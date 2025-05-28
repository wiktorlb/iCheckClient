import React, { useEffect, useMemo, useCallback, useReducer, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import PassengerStats from './components/PassengerStats/PassengerStats';
import PassengerTable from './components/PassengerTable/PassengerTable';
import SearchBar from './components/SearchBar/SearchBar';
import SearchBarSSR from './components/SearchBarSSR/SearchBarSSR';
import ActionPanel from './components/ActionPanel/ActionPanel';
import ErrorMessage from './components/ErrorMessage/ErrorMessage';
import { useSrrTooltip } from './hooks/useSrrTooltip';
import { passengerReducer, initialState } from './reducers/PassengerReducer';
import { updatePassengersStatus, getSelectedPassengerDetails } from './utils/PassengerUtils';
import FlightInfo from './components/FlightInfo/FlightInfo';
import './style.css';
import SeatMap from './components/SeatMap/SeatMap';
import BaggageList from './components/BaggageList/BaggageList';

/**
 * Stats Item Component
 *
 * Renders a single statistics item with label and value.
 * Used in the statistics container to display flight metrics.
 *
 * @component
 * @param {Object} props
 * @param {string} props.label - The label for the statistic
 * @param {number|string} props.value - The value to display
 */
const StatsItem = ({ label, value }) => (
    <div className="stats-item">
        <div className="stats-label">{label}</div>
        <div className="stats-value">{value}</div>
    </div>
);

/**
 * Flight Passengers Component
 *
 * Main component for managing and displaying flight passenger information.
 * Features include:
 * - Passenger list management
 * - Search functionality (by surname and SSR codes)
 * - Passenger statistics
 * - Status management
 * - Integration with seat map
 *
 * @component
 */
const FlightPassengers = () => {
    const { flightId } = useParams();
    const navigate = useNavigate();
    const [state, dispatch] = useReducer(passengerReducer, initialState);
    const { passengers, selectedPassengers, error, searchTerm } = state;
    const [flightDetails, setFlightDetails] = useState(null);
    const [srrSearchTerm, setSrrSearchTerm] = useState('');

    const getSrrTooltip = useSrrTooltip();

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

    useEffect(() => {
        const fetchFlightDetails = async () => {
            try {
                const response = await axiosInstance.get(`/api/flights/${flightId}`);
                console.log('Flight details response:', response.data);
                console.log('SeatMap data:', response.data.seatMap);
                setFlightDetails(response.data);
            } catch (error) {
                console.error('Error fetching flight details:', error);
            }
        };

        fetchFlightDetails();
    }, [flightId]);

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

            const selectedDetails = getSelectedPassengerDetails(passengers, selectedPassengers, newStatus);


            if (selectedDetails.length === 0) {
                console.error('Brak wybranych pasażerów!');
                return;
            }

            const flightId = selectedDetails[0]?.flightId;

            if (!flightId) {
                console.error('Brak flightId w wybranych pasażerach!', selectedDetails);
                return;
            }

            navigate('/checkin', { state: { passengers: selectedDetails, flightId, action } });

        } catch (error) {
            console.error('Error updating passengers:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: 'Failed to update passengers.'
            });
        }
    }, [selectedPassengers, passengers, navigate]);

    const stats = useMemo(() => {
        const baseStats = passengers.reduce((acc, passenger) => {
            const status = passenger.status?.toLowerCase();


            const baggageCount = passenger.baggageList?.length || 0;
            acc.bags += baggageCount;


            if (status === 'stby' && baggageCount > 0) {
                acc.sbags += baggageCount;
            }


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

    /**
     * Progress Bar Component
     *
     * Visual representation of passenger status distribution.
     * Shows segments for different passenger statuses (boarded, accepted, standby, etc.).
     *
     * @component
     * @param {Object} props
     * @param {Object} props.stats - Statistics object containing passenger counts
     * @param {number} props.total - Total number of passengers
     */
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
                    {/* Render the seat map */}
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
                mode="passengers"
            />
        </section>
    );
};

export default FlightPassengers;
