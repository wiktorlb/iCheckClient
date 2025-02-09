import React, { useEffect, useMemo, useCallback, useReducer, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import PassengerStats from './components/PassengerStats/PassengerStats';
import PassengerTable from './components/PassengerTable/PassengerTable';
import SearchBar from './components/SearchBar/SearchBar';
import ActionPanel from './components/ActionPanel/ActionPanel';
import ErrorMessage from './components/ErrorMessage/ErrorMessage';
import { useSrrTooltip } from './hooks/useSrrTooltip';
import { passengerReducer, initialState } from './reducers/PassengerReducer';
import { updatePassengersStatus, getSelectedPassengerDetails } from './utils/PassengerUtils';
import FlightInfo from './components/FlightInfo/FlightInfo';
import './style.css';

/**
 * Główny komponent zarządzający listą pasażerów lotu
 * @component
 */
const FlightPassengers = () => {
    const { flightId } = useParams();
    const navigate = useNavigate();
    const [state, dispatch] = useReducer(passengerReducer, initialState);
    const { passengers, selectedPassengers, error, searchTerm } = state;
    const [flightDetails, setFlightDetails] = useState(null);

    // Hook dostarczający funkcję do generowania tooltipów dla kodów SSR
    const getSrrTooltip = useSrrTooltip();

    // Memoizacja filtrowanych pasażerów dla lepszej wydajności
    const filteredPassengers = useMemo(() =>
        passengers.filter(passenger =>
            passenger.surname.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        [passengers, searchTerm]
    );

    // Efekt pobierający dane pasażerów przy montowaniu komponentu lub zmianie ID lotu
    useEffect(() => {
        const fetchPassengers = async () => {
            try {
                const jwt = localStorage.getItem('jwt');
                if (!jwt) return;

                const response = await axiosInstance.get(
                    `/api/passengers/flights/${flightId}/passengers-with-srr`,
                    { headers: { Authorization: `Bearer ${jwt}` } }
                );

                dispatch({ type: 'SET_PASSENGERS', payload: response.data });
            } catch (error) {
                console.error('Error fetching passengers:', error);
                dispatch({
                    type: 'SET_ERROR',
                    payload: 'Failed to fetch passengers.'
                });
            }
        };

        fetchPassengers();
    }, [flightId]);

    // Efekt pobierający szczegóły lotu
    useEffect(() => {
        const fetchFlightDetails = async () => {
            try {
                const jwt = localStorage.getItem('jwt');
                if (!jwt) return;

                const response = await axiosInstance.get(`/api/flights/${flightId}`, {
                    headers: { Authorization: `Bearer ${jwt}` }
                });
                setFlightDetails(response.data);
            } catch (error) {
                console.error('Error fetching flight details:', error);
            }
        };

        fetchFlightDetails();
    }, [flightId]);

    // Funkcja obsługująca akcje na pasażerach (akceptacja/update)
    const handleAction = useCallback(async (action) => {
        const jwt = localStorage.getItem('jwt');
        if (!jwt) return;

        const newStatus = action === 'accept' ? 'ACC' : action === 'offload' ? 'OFF' : '';

        try {
            if (newStatus) {
                await updatePassengersStatus(selectedPassengers, newStatus, jwt);
                dispatch({
                    type: 'UPDATE_PASSENGERS_STATUS',
                    payload: { selectedPassengers, newStatus }
                });
            }

            const selectedDetails = getSelectedPassengerDetails(
                passengers,
                selectedPassengers,
                newStatus
            );
            navigate('/checkin', { state: { passengers: selectedDetails, action } });
        } catch (error) {
            console.error('Error updating passengers:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: 'Failed to update passengers.'
            });
        }
    }, [selectedPassengers, passengers, navigate]);

    // Komponent paska postępu
    const ProgressBar = ({ stats, total }) => {
        const getPercentage = (value) => (value / total) * 100;

        return (
            <div className="single-progress-bar">
                <div className="progress-segment boarded"
                    style={{ width: `${getPercentage(stats.boarded || 0)}%` }} />
                <div className="progress-segment none"
                    style={{ width: `${getPercentage(stats.none || 0)}%` }} />
                <div className="progress-segment acc"
                    style={{ width: `${getPercentage(stats.acc || 0)}%` }} />
                <div className="progress-segment stby"
                    style={{ width: `${getPercentage(stats.stby || 0)}%` }} />
                <div className="progress-segment off"
                    style={{ width: `${getPercentage(stats.off || 0)}%` }} />
            </div>
        );
    };

    // Aktualizacja obliczeń statystyk
    const stats = useMemo(() => {
        return passengers.reduce((acc, passenger) => {
            const status = passenger.status?.toLowerCase();
            if (!status) {
                acc.none++;
                return acc;
            }
            switch(status) {
                case 'boarded':
                    acc.boarded++;
                    break;
                case 'acc':
                    acc.acc++;
                    break;
                case 'stby':
                    acc.stby++;
                    break;
                case 'off':
                    acc.off++;
                    break;
                default:
                    acc.none++;
            }
            return acc;
        }, { boarded: 0, none: 0, acc: 0, stby: 0, off: 0 });
    }, [passengers]);

    return (
        <section>
            <div className="content-wrapper">
                {flightDetails && (
                    <FlightInfo
                        flightNumber={flightDetails.flightNumber}
                        departureTime={flightDetails.departureTime}
                        route={flightDetails.route}
                        status={flightDetails.state}
                    />
                )}
                <div className="main-container">
                    <PassengerStats passengers={passengers} />
                    <main className="main">

                        <ErrorMessage error={error} />
                        <SearchBar
                            value={searchTerm}
                            onChange={(e) => dispatch({
                                type: 'SET_SEARCH_TERM',
                                payload: e.target.value
                            })}
                        />
                        <PassengerTable
                            passengers={filteredPassengers}
                            selectedPassengers={selectedPassengers}
                            onToggleSelection={(id) => dispatch({
                                type: 'TOGGLE_PASSENGER_SELECTION',
                                payload: id
                            })}
                            getSrrTooltip={getSrrTooltip}
                        />
                    </main>
                </div>
            </div>
            <ActionPanel
                visible={selectedPassengers.length > 0}
                onAction={handleAction}
            />
        </section>
    );
};

export default FlightPassengers;