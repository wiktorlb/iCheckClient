import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../../api/axiosConfig';
import PassengerTable from '../components/PassengerTable/PassengerTable';
import SearchBar from '../components/SearchBar/SearchBar';
import SearchBarSSR from '../components/SearchBarSSR/SearchBarSSR';
import ErrorMessage from '../components/ErrorMessage/ErrorMessage';
import { useSrrTooltip } from '../hooks/useSrrTooltip';
import { passengerReducer, initialState } from '../reducers/PassengerReducer';
import FlightInfo from '../components/FlightInfo/FlightInfo';
import SeatMap from '../components/SeatMap/SeatMap';
import ActionPanel from '../components/ActionPanel/ActionPanel';
import './style.css';

// Komponent elementu statystyk
const StatsItem = ({ label, value }) => (
    <div className="stats-item">
        <div className="stats-label">{label}</div>
        <div className="stats-value">{value}</div>
    </div>
);

const Boarding = () => {
    const { flightId } = useParams();
    const [state, dispatch] = useReducer(passengerReducer, initialState);
    const { passengers, selectedPassengers, error, searchTerm } = state;
    const [flightDetails, setFlightDetails] = useState(null);
    const [srrSearchTerm, setSrrSearchTerm] = useState('');

    // Hook dostarczający funkcję do generowania tooltipów dla kodów SSR
    const getSrrTooltip = useSrrTooltip();

    // Memoizacja filtrowanych pasażerów dla lepszej wydajności
    const filteredPassengers = useMemo(() =>
        passengers.filter(passenger => {
            const matchesSurname = passenger.surname.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSrr = !srrSearchTerm ||
                (passenger.srrCodes && passenger.srrCodes.some(code =>
                    code.toUpperCase().includes(srrSearchTerm.toUpperCase())
                ));
            return matchesSurname && matchesSrr;
        }),
        [passengers, searchTerm, srrSearchTerm]
    );

    // Aktualizacja obliczeń statystyk
    const stats = useMemo(() => {
        const baseStats = passengers.reduce((acc, passenger) => {
            const status = passenger.status?.toLowerCase();

            // Liczenie bagaży
            const baggageCount = passenger.baggageList?.length || 0;
            acc.bags += baggageCount;

            // Jeśli pasażer ma status standby, dodaj jego bagaże do SBAGS
            if (status === 'stby' && baggageCount > 0) {
                acc.sbags += baggageCount;
            }

            // Liczenie statusów
            switch (status) {
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
        }, {
            boarded: 0,
            none: 0,
            acc: 0,
            stby: 0,
            off: 0,
            bags: 0,
            sbags: 0
        });

        return {
            ...baseStats,
            booked: passengers.length
        };
    }, [passengers]);

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
                const response = await axiosInstance.get(`/api/flights/${flightId}`);
                setFlightDetails(response.data);
            } catch (error) {
                console.error('Error fetching flight details:', error);
            }
        };

        fetchFlightDetails();
    }, [flightId]);

    // Funkcja obsługująca zmianę statusu pasażera na boarded
    const handleBoardPassenger = async () => {
        if (!selectedPassengers.length) return;

        // Clear selection immediately
        dispatch({ type: 'CLEAR_SELECTION' });

        try {
            const jwt = localStorage.getItem('jwt');
            if (!jwt) return;

            // Aktualizacja statusu dla wszystkich wybranych pasażerów
            await Promise.all(selectedPassengers.map(async (passengerId) => {
                await axiosInstance.put(
                    `/api/passengers/${passengerId}/status`,
                    JSON.stringify('BOARDED'),
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${jwt}`,
                        },
                    }
                );
            }));

            // Odświeżenie listy pasażerów
            const response = await axiosInstance.get(
                `/api/passengers/flights/${flightId}/passengers-with-srr`,
                { headers: { Authorization: `Bearer ${jwt}` } }
            );

            dispatch({ type: 'SET_PASSENGERS', payload: response.data });

        } catch (error) {
            console.error('Error updating passenger status:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: 'Failed to update passenger status.'
            });
        }
    };

    // Funkcja obsługująca akcje na pasażerach
    const handleAction = async (action) => {
        if (action === 'board') {
            await handleBoardPassenger();
        }
    };

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

    return (
        <section>
            <div className="content-wrapper">
                <div className="main-container-flightData">
                    {flightDetails && (
                        <FlightInfo
                            flightNumber={flightDetails.flightNumber}
                            departureTime={flightDetails.departureTime}
                            route={flightDetails.route}
                            status={flightDetails.state}
                        />
                    )}
                    {flightDetails && flightDetails.seatMap && (
                        <SeatMap
                            flightId={flightId}
                            seatMap={flightDetails.seatMap}
                            occupiedSeats={flightDetails.occupiedSeats || []}
                        />
                    )}
                </div>
                <div className="main-container">
                    <div className="statistics-container">
                        <StatsItem label="BOARDED" value={stats.boarded} />
                        <StatsItem label="ACCEPTED" value={stats.acc} />
                        <StatsItem label="BOOKED" value={stats.booked} />
                        <StatsItem label="ALLOWED" value='189' />
                        <StatsItem label="STANDBY" value={stats.stby} />
                        <StatsItem label="BAGS" value={stats.bags} />
                        <StatsItem label="SBAGS" value={stats.sbags} />
                    </div>
                    <main className="main">
                        <div className="progress-bar-container">
                            <ProgressBar stats={stats} total={passengers.length} />
                        </div>
                        <ErrorMessage error={error} />
                        <div className="table-spacer">
                            <div className="search-bars-container">
                                <SearchBar
                                    value={searchTerm}
                                    onChange={(e) => dispatch({
                                        type: 'SET_SEARCH_TERM',
                                        payload: e.target.value
                                    })}
                                    placeholder="Search by surname..."
                                />
                                <SearchBarSSR
                                    value={srrSearchTerm}
                                    onChange={(e) => setSrrSearchTerm(e.target.value)}
                                />
                            </div>
                            <PassengerTable
                                passengers={filteredPassengers}
                                selectedPassengers={selectedPassengers}
                                onToggleSelection={(id) => dispatch({
                                    type: 'TOGGLE_PASSENGER_SELECTION',
                                    payload: id
                                })}
                                getSrrTooltip={getSrrTooltip}
                            />
                        </div>
                    </main>
                </div>
            </div>
            <ActionPanel
                visible={selectedPassengers.length > 0}
                onAction={handleAction}
                mode="boarding"
            />
        </section>
    );
};

export default Boarding;