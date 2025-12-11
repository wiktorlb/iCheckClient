import React, { useEffect, useMemo, useCallback, useReducer, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import PassengerTable from './components/PassengerTable/PassengerTable';
import ErrorMessage from './components/ErrorMessage/ErrorMessage';
import { useSrrTooltip } from './hooks/useSrrTooltip';
import { passengerReducer, initialState } from './reducers/PassengerReducer';
import { updatePassengersStatus, getSelectedPassengerDetails } from './utils/PassengerUtils';
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

    return (
        <section className="passengers-page">
            <div className="passengers-overview">
                {statsOrder.map(({ label, value }) => (
                    <div key={label} className="stats-item">
                        <span className="stats-label">{label}</span>
                        <span className="stats-value">{value ?? '—'}</span>
                    </div>
                ))}
            </div>

            <div className="passengers-body">
                <aside className="passengers-left">
                    <div className="panel flight-info-panel">
                        <div className="panel-header compact">
                            <div>
                                <h3>Informacje o locie</h3>
                                <p>{flightDetails?.route || 'Trasa niedostępna'}</p>
                            </div>
                            <span className={`status-pill ${statusClass}`}>
                                {flightDetails?.status || flightDetails?.state || 'Unknown'}
                            </span>
                        </div>
                        <div className="info-grid">
                            <div>
                                <p className="info-label">Gate</p>
                                <p className="info-value">{gate}</p>
                            </div>
                            <div>
                                <p className="info-label">Radio</p>
                                <p className="info-value">{radioNumber}</p>
                            </div>
                            <div>
                                <p className="info-label">Samolot</p>
                                <p className="info-value">{planeModel}</p>
                            </div>
                            <div>
                                <p className="info-label">Pojemność</p>
                                <p className="info-value">{capacity}</p>
                            </div>
                        </div>
                        <div className="flight-actions">
                            <Link to={`/flights/${flightId}/passengers`} className="ghost-action">
                                Lista pasażerów
                            </Link>
                            <Link to={`/flights/${flightId}/baggage-list`} className="ghost-action">
                                Lista bagażu
                            </Link>
                        </div>
                    </div>

                    <div className="panel seatmap-panel">
                        <div className="panel-header">
                            <div>
                                <h3>Mapa miejsc</h3>
                                <p>Podgląd zajętości kabiny w czasie rzeczywistym</p>
                            </div>
                            <div className="seat-legend">
                                <span><span className="dot available" />Wolne</span>
                                <span><span className="dot occupied" />Zajęte</span>
                                <span><span className="dot boarded" />Boarded</span>
                            </div>
                        </div>
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
                </aside>

                <div className="passengers-right">
                    <div className="passenger-table-card">
                        <div className="table-toolbar">
                            <div className="toolbar-title">
                                <h3>Lista pasażerów</h3>
                                <span>{filteredPassengers.length} pozycji</span>
                            </div>
                            <div className="toolbar-search">
                                <input
                                    type="text"
                                    className="search-input"
                                    value={searchTerm}
                                    onChange={(e) => dispatch({
                                        type: 'SET_SEARCH_TERM',
                                        payload: e.target.value
                                    })}
                                    placeholder="Szukaj po nazwisku..."
                                />
                                <input
                                    type="text"
                                    className="search-input"
                                    value={srrSearchTerm}
                                    onChange={(e) => setSrrSearchTerm(e.target.value)}
                                    placeholder="Filtruj po kodzie SSR..."
                                />
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
        </section>
    );
};

export default FlightPassengers;
