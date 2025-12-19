import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';

import { Link, useLocation, useParams } from 'react-router-dom';

import axiosInstance from '../../../api/axiosConfig';
import PassengerTable from '../components/PassengerTable/PassengerTable';
import ErrorMessage from '../components/ErrorMessage/ErrorMessage';
import { useSrrTooltip } from '../hooks/useSrrTooltip';
import { passengerReducer, initialState } from '../reducers/PassengerReducer';
import SeatMap from '../components/SeatMap/SeatMap';
import ActionPanel from '../components/ActionPanel/ActionPanel';
import { releasePassengerSeat } from '../utils/PassengerUtils';

import '../style.css';
import './style.css';

/**
 * Boarding Component
 *
 * Manages the passenger boarding process for flights.
 * Features include:
 * - Real-time passenger boarding status updates
 * - Boarding pass scanning and validation
 * - Passenger status management
 * - Integration with seat map
 * - Boarding statistics and progress tracking
 *
 * @component
 * @param {Object} props
 * @param {string} props.flightId - Unique identifier for the flight
 * @param {Array} props.passengers - List of passengers for the flight
 * @param {Function} props.onBoardingComplete - Callback function when boarding is completed
 * @param {Object} props.seatMap - Seat map configuration for the aircraft
 */

const StatsItem = ({ label, value }) => (
    <div className="stats-item">
        <div className="stats-label">{label}</div>
        <div className="stats-value">{value}</div>
    </div>
);

const Boarding = () => {
    const { flightId } = useParams();
    const location = useLocation();

    const [state, dispatch] = useReducer(passengerReducer, initialState);
    const { passengers, selectedPassengers, error, searchTerm } = state;
    const [flightDetails, setFlightDetails] = useState(null);
    const [srrSearchTerm, setSrrSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [closingFlight, setClosingFlight] = useState(false);

    const [closeResult, setCloseResult] = useState(null);
    const [deboarding, setDeboarding] = useState(false);
    const [deboardResult, setDeboardResult] = useState(null);
    const [confirmDeboardOpen, setConfirmDeboardOpen] = useState(false);
    const [confirmSingleDeboardOpen, setConfirmSingleDeboardOpen] = useState(false);
    const [singleDeboarding, setSingleDeboarding] = useState(false);
    const [showEmergencyPanel, setShowEmergencyPanel] = useState(false);

    const flightStatus = (flightDetails?.status || flightDetails?.state || '').toUpperCase();
    const isFinalized = flightStatus === 'FINALIZED';

    const getSrrTooltip = useSrrTooltip();

    const filteredPassengers = useMemo(() =>
        passengers.filter(passenger => {
            const matchesSurname = passenger.surname.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSrr = !srrSearchTerm ||
                (passenger.srrCodes && passenger.srrCodes.some(code =>
                    code.toUpperCase().includes(srrSearchTerm.toUpperCase())
                ));
            const matchesStatus = !statusFilter ||
                (passenger.status && passenger.status.toLowerCase() === statusFilter);
            return matchesSurname && matchesSrr && matchesStatus;
        }),
        [passengers, searchTerm, srrSearchTerm, statusFilter]
    );

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

    const fetchPassengers = useCallback(async () => {
        try {
            const jwt = localStorage.getItem('jwt');
            if (!jwt) return;

            const response = await axiosInstance.get(
                `/api/passengers/flights/${flightId}/passengers-with-srr-filtered`,
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
    }, [flightId]);

    useEffect(() => {
        fetchPassengers();
    }, [fetchPassengers]);

    const fetchFlightDetails = useCallback(async () => {
        try {
            const jwt = localStorage.getItem('jwt');
            const config = jwt ? { headers: { Authorization: `Bearer ${jwt}` } } : undefined;
            const response = await axiosInstance.get(`/api/flights/${flightId}`, config);
            setFlightDetails(response.data);
        } catch (error) {
            console.error('Error fetching flight details:', error);
        }
    }, [flightId]);

    useEffect(() => {
        fetchFlightDetails();
    }, [fetchFlightDetails]);

    useEffect(() => {
        const handleGlobalRefresh = (event) => {
            const targetPath = event.detail?.pathname;
            const targetSearch = event.detail?.search;
            if (targetPath === location.pathname && targetSearch === location.search) {
                fetchPassengers();
                fetchFlightDetails();
            }
        };

        window.addEventListener('app:data-refresh', handleGlobalRefresh);
        return () => window.removeEventListener('app:data-refresh', handleGlobalRefresh);
    }, [fetchPassengers, fetchFlightDetails, location.pathname, location.search]);

    const selectedPassengerObjects = useMemo(
        () => passengers.filter((passenger) => selectedPassengers.includes(passenger.id)),
        [passengers, selectedPassengers]
    );

    const handleBoardPassenger = async () => {
        if (isFinalized || !selectedPassengers.length) return;

        dispatch({ type: 'CLEAR_SELECTION' });

        try {
            const jwt = localStorage.getItem('jwt');
            if (!jwt) return;

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

            await fetchPassengers();

        } catch (error) {
            console.error('Error updating passenger status:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: 'Failed to update passenger status.'
            });
        }
    };

    const handleDeboardSelectedPassengers = async () => {
        if (isFinalized || !selectedPassengers.length) return;

        try {
            const jwt = localStorage.getItem('jwt');
            if (!jwt) return;

            setSingleDeboarding(true);

            await Promise.all(selectedPassengerObjects.map(async ({ id, seatNumber }) => {
                await axiosInstance.put(
                    `/api/passengers/${id}/status`,
                    JSON.stringify('OFF'),
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${jwt}`
                        }
                    }
                );

                if (seatNumber) {
                    await releasePassengerSeat({
                        flightId,
                        passengerId: id,
                        seatNumber
                    });
                }
            }));

            await fetchPassengers();
            dispatch({ type: 'CLEAR_SELECTION' });
            setConfirmSingleDeboardOpen(false);
        } catch (error) {
            console.error('Error deboarding passenger:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: 'Failed to deboard passenger.'
            });
        } finally {
            setSingleDeboarding(false);
        }
    };

    const handleAction = async (action) => {
        if (isFinalized) return;
        if (action === 'board') {
            await handleBoardPassenger();
        }
    };

    const handleDeboardClick = () => {
        if (isFinalized || !selectedPassengers.length) return;
        setConfirmSingleDeboardOpen(true);
    };

    const handleCloseFlight = async () => {
        if (isFinalized) return;
        const jwt = localStorage.getItem('jwt');
        if (!jwt) return;

        setClosingFlight(true);

        setCloseResult(null);
        try {
            const response = await axiosInstance.put(
                `/api/flights/${flightId}/close-when-ready`,
                {},
                { headers: { Authorization: `Bearer ${jwt}` } }
            );
            setCloseResult({ type: 'success', message: response.data?.message || 'Flight closed successfully.' });
            await fetchPassengers();
            await fetchFlightDetails();
        } catch (error) {
            const message = error.response?.data || 'Unable to close flight. Ensure all passengers are boarded or offloaded.';
            setCloseResult({ type: 'error', message });
        } finally {
            setClosingFlight(false);
        }
    };

    const handleDeboardAll = async () => {
        if (isFinalized) return;
        const jwt = localStorage.getItem('jwt');
        if (!jwt || !passengers.length) return;

        setDeboarding(true);
        setDeboardResult(null);

        try {
            await Promise.all(
                passengers.map(async ({ id, seatNumber }) => {
                    await axiosInstance.put(
                        `/api/passengers/${id}/status`,
                        JSON.stringify('OFF'),
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${jwt}`
                            }
                        }
                    );

                    if (seatNumber) {
                        await releasePassengerSeat({
                            flightId,
                            passengerId: id,
                            seatNumber
                        });
                    }
                })
            );

            await fetchPassengers();
            await fetchFlightDetails();

            setDeboardResult({
                type: 'success',
                message: 'All passengers were marked as OFF (deboarded).'
            });
        } catch (error) {
            const message = error.response?.data || 'Failed to deboard passengers.';
            setDeboardResult({
                type: 'error',
                message
            });
        } finally {
            setDeboarding(false);
        }
    };

    const openDeboardConfirm = () => {
        if (isFinalized) return;
        setConfirmDeboardOpen(true);
    };

    const closeDeboardConfirm = () => {
        if (!deboarding) {
            setConfirmDeboardOpen(false);
        }
    };

    const confirmDeboard = async () => {
        if (isFinalized) return;
        await handleDeboardAll();
        setConfirmDeboardOpen(false);
    };

    useEffect(() => {
        if (isFinalized) {
            setConfirmDeboardOpen(false);
            setConfirmSingleDeboardOpen(false);
        }
    }, [isFinalized]);

    const allowCapacity = flightDetails?.capacity || flightDetails?.plane?.capacity || 0;
    const gate = flightDetails?.boardingGate || flightDetails?.gate || '—';
    const radioNumber = flightDetails?.radioNumber || flightDetails?.radio || '—';
    const planeModel = flightDetails?.plane?.model || flightDetails?.aircraftId || '—';
    const statsOrder = [
        { label: 'BOARDED', value: stats.boarded },
        { label: 'ACCEPTED', value: stats.acc },
        { label: 'BOOKED', value: stats.booked },
        { label: 'ALLOWED', value: allowCapacity || '—' },
        { label: 'STANDBY', value: stats.stby },
        { label: 'BAGS', value: stats.bags },
        { label: 'SBAGS', value: stats.sbags }
    ];

    return (
        <section className="passengers-page boarding-page">
            <div className="passengers-body center">
                <aside className="passengers-left">
                    <div className="panel flight-info-panel">
                        <div className="info-grid">
                            <div className="info-container">
                                <p className="info-label">Gate</p>
                                <p className="info-value">{gate}</p>
                            </div>
                            <div className="info-container">
                                <p className="info-label">Radio</p>
                                <p className="info-value">{radioNumber}</p>
                            </div>
                        </div>
                    </div>
                    <div className="panel seatmap-panel">
                        {flightDetails?.seatMap ? (
                            <SeatMap
                                flightId={flightId}
                                seatMap={flightDetails.seatMap}
                                occupiedSeats={flightDetails.occupiedSeats || []}
                                passengers={passengers}
                                disabled={isFinalized}
                            />
                        ) : (
                            <div className="panel-placeholder">Seat map unavailable for this flight.</div>
                        )}
                    </div>
                    <div className="panel flight-info-panel">
                        <div className="flight-actions no-margin">
                            <Link to={`/flights/${flightId}/passengers`} className="ghost-action">
                                Passenger List
                            </Link>
                            <Link to={`/flights/${flightId}/baggage-list`} className="ghost-action">
                                Baggage List
                            </Link>
                        </div>
                        <div className="flight-actions">
                            <button
                                type="button"
                                className="ghost-action"
                                onClick={handleCloseFlight}
                                disabled={closingFlight || isFinalized}
                            >
                                {closingFlight ? 'Closing...' : 'Close Flight'}
                            </button>
                        </div>
                        <div className="flight-actions emergency-actions">
                            {deboardResult && (
                                <div className={`close-banner ${deboardResult.type}`}>
                                    {deboardResult.message}
                                </div>
                            )}
                            <button
                                type="button"
                                className="danger-button inline"
                                onClick={openDeboardConfirm}
                                disabled={isFinalized || deboarding || !passengers.length}
                            >
                                {deboarding ? 'Deboarding...' : 'Deboard all passengers'}
                            </button>
                        </div>
                        {closeResult && (
                            <div className={`close-banner ${closeResult.type}`}>
                                {closeResult.message}
                            </div>
                        )}
                    </div>
                </aside>

                <div className="passengers-right">
                    {isFinalized && (
                        <div className="finalized-banner" role="status">
                            <strong>Flight finalized</strong>
                            <span>Boarding operations are locked. Lists remain available for viewing.</span>
                        </div>
                    )}
                    <div className="passengers-overview">
                        {statsOrder.map(({ label, value }) => (
                            <div key={label} className="stats-item">
                                <span className="stats-label">{label}</span>
                                <span className="stats-value">{value ?? '—'}</span>
                            </div>
                        ))}
                    </div>

                    <div className="passenger-table-card">
                        <div className="table-toolbar">
                            <div className="toolbar-search">
                                <input
                                    type="text"
                                    className="search-input"
                                    value={searchTerm}
                                    onChange={(e) => dispatch({
                                        type: 'SET_SEARCH_TERM',
                                        payload: e.target.value
                                    })}
                                    placeholder="Search by Last Name..."
                                />
                                <input
                                    type="text"
                                    className="search-input"
                                    value={srrSearchTerm}
                                    onChange={(e) => setSrrSearchTerm(e.target.value)}
                                    placeholder="Filter by SSR..."
                                />
                                <select
                                    className="search-input status-select"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="">Status: any</option>
                                    <option value="boarded">Boarded</option>
                                    <option value="acc">Accepted</option>
                                    <option value="stby">Standby</option>
                                    <option value="off">Off</option>
                                    <option value="none">None</option>
                                </select>
                            </div>
                            <div className="toolbar-actions">
                                <button
                                    type="button"
                                    className="primary-button"
                                    disabled={isFinalized || !selectedPassengers.length}
                                    onClick={() => handleAction('board')}
                                >
                                    Board
                                </button>
                                <button
                                    type="button"
                                    className="primary-button"
                                    disabled={isFinalized || !selectedPassengers.length}
                                    onClick={handleDeboardClick}
                                >
                                    Deboard
                                </button>
                            </div>
                        </div>

                        <ErrorMessage error={error} />

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
                </div>
            </div>

            {confirmDeboardOpen && (
                <div className="modal-backdrop">
                    <div className="modal-card">
                        <h3>Are you sure?</h3>
                        <p>This will mark <strong>all passengers</strong> as OFF and cannot be undone.</p>
                        <div className="modal-actions">
                            <button
                                type="button"
                                className="ghost-btn"
                                onClick={closeDeboardConfirm}
                                disabled={deboarding}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="danger-button"
                                onClick={confirmDeboard}
                                disabled={deboarding}
                            >
                                {deboarding ? 'Processing...' : 'Confirm deboard'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {confirmSingleDeboardOpen && (
                <div className="modal-backdrop">
                    <div className="modal-card">
                        <h3>Are you sure to deboard passenger?</h3>
                        <p>This action will mark the selected passenger as OFF.</p>
                        <div className="modal-actions">
                            <button
                                type="button"
                                className="ghost-btn"
                                onClick={() => !singleDeboarding && setConfirmSingleDeboardOpen(false)}
                                disabled={singleDeboarding}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="danger-button"
                                onClick={handleDeboardSelectedPassengers}
                                disabled={singleDeboarding}
                            >
                                {singleDeboarding ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );

};

export default Boarding;