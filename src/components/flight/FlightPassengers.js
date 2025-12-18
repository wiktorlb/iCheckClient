import React, { useEffect, useMemo, useCallback, useReducer, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import PassengerTable from './components/PassengerTable/PassengerTable';
import ErrorMessage from './components/ErrorMessage/ErrorMessage';
import { useSrrTooltip } from './hooks/useSrrTooltip';
import { passengerReducer, initialState } from './reducers/PassengerReducer';
import { updatePassengersStatus, getSelectedPassengerDetails, releasePassengerSeat } from './utils/PassengerUtils';
import SeatMap from './components/SeatMap/SeatMap';
import './style.css';

const statusToneMap = {
    open: 'status-open',
    boarding: 'status-boarding',
    delayed: 'status-delayed',
    prepare: 'status-prepare',
    finalized: 'status-finalized',
    closed: 'status-closed',
};

const FlightPassengers = () => {
    const { flightId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [state, dispatch] = useReducer(passengerReducer, initialState);
    const { passengers, selectedPassengers, error, searchTerm } = state;
    const [flightDetails, setFlightDetails] = useState(null);
    const [srrSearchTerm, setSrrSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showAddPassengerModal, setShowAddPassengerModal] = useState(false);
    const [newPassenger, setNewPassenger] = useState({
        name: '',
        surname: '',
        title: 'MR',
        gender: 'M'
    });
    const [creatingPassenger, setCreatingPassenger] = useState(false);
    const [createPassengerError, setCreatePassengerError] = useState('');

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

    const fetchPassengers = useCallback(async () => {
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

    const handleRefreshFlightInfo = useCallback(() => {
        fetchFlightDetails();
    }, [fetchFlightDetails]);

    const handleAction = useCallback(async (action) => {
        const jwt = localStorage.getItem('jwt');
        if (!jwt) return;

        const newStatus = action === 'accept' ? 'ACC' : action === 'offload' ? 'OFF' : '';

        try {
            if (newStatus) {
                await updatePassengersStatus(selectedPassengers, newStatus, jwt);
                if (['OFF', 'STBY'].includes(newStatus.toUpperCase())) {
                    const releasePromises = selectedPassengers.map((passengerId) => {
                        const passenger = passengers.find((p) => p.id === passengerId);
                        if (!passenger?.seatNumber) return null;

                        return releasePassengerSeat({
                            flightId,
                            passengerId,
                            seatNumber: passenger.seatNumber
                        });
                    }).filter(Boolean);

                    if (releasePromises.length > 0) {
                        await Promise.allSettled(releasePromises);
                        await fetchFlightDetails();
                    }
                }
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

            navigate(`/checkin?flightId=${flightId}`, { state: { passengers: selectedDetails, flightId, action } });

        } catch (error) {
            console.error('Error updating passengers:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: 'Failed to update passengers.'
            });
        }
    }, [selectedPassengers, passengers, navigate, flightId, fetchFlightDetails]);

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

    const allowCapacity = flightDetails?.capacity || flightDetails?.plane?.capacity || 0;
    const statusLabel = (flightDetails?.status || flightDetails?.state || 'Unknown').toLowerCase();
    const statusClass = statusToneMap[statusLabel] || 'status-unknown';
    const gate = flightDetails?.boardingGate || flightDetails?.gate || '—';
    const radioNumber = flightDetails?.radioNumber || flightDetails?.radio || '—';
    const planeModel = flightDetails?.plane?.model || flightDetails?.aircraftId || '—';
    const capacity = allowCapacity || passengers.length || '—';

    const statsOrder = [
        { label: 'BOARDED', value: stats.boarded },
        { label: 'ACCEPTED', value: stats.acc },
        { label: 'BOOKED', value: stats.booked },
        { label: 'ALLOWED', value: allowCapacity || '—' },
        { label: 'STANDBY', value: stats.stby },
        { label: 'BAGS', value: stats.bags },
        { label: 'SBAGS', value: stats.sbags },
    ];

    const isActionDisabled = selectedPassengers.length === 0;

    const openAddPassengerModal = () => {
        setNewPassenger({
            name: '',
            surname: '',
            title: 'MR',
            gender: 'M'
        });
        setCreatePassengerError('');
        setShowAddPassengerModal(true);
    };

    const closeAddPassengerModal = () => {
        if (!creatingPassenger) {
            setShowAddPassengerModal(false);
        }
    };

    const handleNewPassengerChange = (field) => (event) => {
        setNewPassenger((prev) => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    const handleCreatePassenger = async (event) => {
        event.preventDefault();
        if (!flightId) return;

        const trimmedName = newPassenger.name.trim();
        const trimmedSurname = newPassenger.surname.trim();

        if (!trimmedName || !trimmedSurname) {
            setCreatePassengerError('Name and surname are required.');
            return;
        }

        try {
            setCreatingPassenger(true);
            setCreatePassengerError('');

            const jwt = localStorage.getItem('jwt');
            const config = jwt ? { headers: { Authorization: `Bearer ${jwt}` } } : undefined;

            const payload = {
                flightId,
                name: trimmedName,
                surname: trimmedSurname,
                title: newPassenger.title,
                gender: newPassenger.gender
            };

            await axiosInstance.post('/api/passengers', payload, config);
            await fetchPassengers();
            setShowAddPassengerModal(false);
        } catch (err) {
            const message = err.response?.data || 'Failed to create passenger.';
            setCreatePassengerError(typeof message === 'string' ? message : 'Failed to create passenger.');
        } finally {
            setCreatingPassenger(false);
        }
    };

    return (
        <section className="passengers-page">


            <div className="passengers-body center">
                <aside className="passengers-left">
                    <div className="panel flight-info-panel">
                        <div className="info-grid">
                            <div className='info-container'>
                                <p className="info-label">Gate</p>
                                <p className="info-value">{gate}</p>
                            </div>
                            <div className='info-container'>
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
                            />
                        ) : (
                            <div className="panel-placeholder">Seat map unavailable for this flight.</div>
                        )}
                    </div>
                    <div className="panel flight-info-panel">
                        <div className="flight-actions no-margin">
                            <Link to={`/flights/${flightId}/passenger-list`} className="ghost-action">
                                Passenger List
                            </Link>
                            <Link to={`/flights/${flightId}/baggage-list`} className="ghost-action">
                                Baggage List
                            </Link>
                        </div>
                        <div className="flight-actions">
                            <button type="button" className="ghost-action" onClick={openAddPassengerModal}>
                                Add Passenger
                            </button>
                        </div>
                    </div>
                </aside>

                <div className="passengers-right">
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
                                    className="ghost-button"
                                    disabled={isActionDisabled}
                                    onClick={() => handleAction('update')}
                                >
                                    Update
                                </button>
                                <button
                                    type="button"
                                    className="primary-button"
                                    disabled={isActionDisabled}
                                    onClick={() => handleAction('accept')}
                                >
                                    Accept
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

            {showAddPassengerModal && (
                <div
                    className="api-modal-overlay"
                    role="dialog"
                    aria-modal="true"
                    onClick={!creatingPassenger ? closeAddPassengerModal : undefined}
                >
                    <div
                        className="api-modal add-passenger-modal"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="api-modal-header">
                            <div>
                                <h1 className="api-modal-eyebrow">Quick add</h1>
                                <h3>New passenger</h3>
                            </div>
                            <button
                                type="button"
                                className="api-modal-close"
                                onClick={closeAddPassengerModal}
                                aria-label="Close add passenger form"
                                disabled={creatingPassenger}
                            >
                                ✕
                            </button>
                        </div>
                        <form className="api-form-grid" onSubmit={handleCreatePassenger}>
                            <label className="api-field">
                                <span>First name</span>
                                <input
                                    type="text"
                                    value={newPassenger.name}
                                    onChange={handleNewPassengerChange('name')}
                                    placeholder="Enter first name"
                                    required
                                />
                            </label>
                            <label className="api-field">
                                <span>Last name</span>
                                <input
                                    type="text"
                                    value={newPassenger.surname}
                                    onChange={handleNewPassengerChange('surname')}
                                    placeholder="Enter last name"
                                    required
                                />
                            </label>
                            <label className="api-field">
                                <span>Title</span>
                                <select
                                    value={newPassenger.title}
                                    onChange={handleNewPassengerChange('title')}
                                >
                                    <option value="MR">MR</option>
                                    <option value="MRS">MRS</option>
                                </select>
                            </label>
                            <label className="api-field">
                                <span>Gender</span>
                                <select
                                    value={newPassenger.gender}
                                    onChange={handleNewPassengerChange('gender')}
                                >
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                </select>
                            </label>
                            {createPassengerError && (
                                <p className="modal-error">{createPassengerError}</p>
                            )}
                            <div className="api-modal-footer">
                                <button
                                    type="button"
                                    className="ghost-btn"
                                    onClick={closeAddPassengerModal}
                                    disabled={creatingPassenger}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="primary-btn"
                                    disabled={creatingPassenger}
                                >
                                    {creatingPassenger ? 'Adding…' : 'Add passenger'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default FlightPassengers;
