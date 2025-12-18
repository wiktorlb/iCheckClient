import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import axiosInstance from '../../../api/axiosConfig';
import '../style.css';
import './style.css';
import { useSrrTooltip } from '../hooks/useSrrTooltip';
import SeatMap from '../components/SeatMap/SeatMap';
import PassengerTable from '../components/PassengerTable/PassengerTable';
import { releasePassengerSeat } from '../utils/PassengerUtils';

const { countries } = require('countries-list');

const statusToneMap = {
    open: 'status-open',
    boarding: 'status-boarding',
    delayed: 'status-delayed',
    prepare: 'status-prepare',
    finalized: 'status-finalized',
    closed: 'status-closed',
};

const formatDateForInput = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value.split('T')[0] || '';
    }
    return date.toISOString().split('T')[0];
};

const normalizeDateForApi = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toISOString();
};

const CheckinSite = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const queryFlightId = searchParams.get('flightId');
    const activeFlightId = location.state?.flightId || queryFlightId;

    const [selectedPassenger, setSelectedPassenger] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [countryNames, setCountryNames] = useState([]);
    const [baggageWeight, setBaggageWeight] = useState('');
    const [baggageType, setBaggageType] = useState("BAG");
    const [comment, setComment] = useState('');
    const [passengerSrrCodes, setPassengerSrrCodes] = useState({});
    const [currentSrrCodes, setCurrentSrrCodes] = useState({});
    const getSrrTooltip = useSrrTooltip();
    const [flightDetails, setFlightDetails] = useState(null);

    const [passengerForm, setPassengerForm] = useState({
        name: '',
        surname: '',
        gender: '',
        title: '',
        dateOfBirth: '',
        citizenship: '',
        documentType: '',
        serialName: '',
        validUntil: '',
        issueCountry: ''
    });

    useEffect(() => {
        if (selectedPassenger) {
            setPassengerForm({
                name: selectedPassenger.name || '',
                surname: selectedPassenger.surname || '',
                gender: selectedPassenger.gender || '',
                title: selectedPassenger.title || '',
                dateOfBirth: formatDateForInput(selectedPassenger.dateOfBirth),

                citizenship: selectedPassenger.citizenship || '',
                documentType: selectedPassenger.documentType || 'P',
                serialName: selectedPassenger.serialName || '',
                validUntil: formatDateForInput(selectedPassenger.validUntil),

                issueCountry: selectedPassenger.issueCountry || ''
            });
        }
    }, [selectedPassenger]);

    useEffect(() => {
        const countryNamesArray = Object.values(countries).map(country => country.name).sort();
        setCountryNames(countryNamesArray);
    }, []);

    const fetchSrrCodes = async (passengerId) => {
        try {
            const response = await axiosInstance.get(`/api/passengers/${passengerId}`);
            return response.data.srrCodes || [];
        } catch (error) {
            console.error('Error fetching passenger data:', error.response ? error.response.data : error.message);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleInputChange = (field) => (event) => {
        setPassengerForm(prev => ({
            ...prev,
            [field]: event.target.value
        }));
    };

    const fetchFlightDetails = async () => {
        if (activeFlightId) {
            try {
                const flightResponse = await axiosInstance.get(`/api/flights/${activeFlightId}`);
                const passengersResponse = await axiosInstance.get(`/api/passengers/flights/${activeFlightId}/passengers-with-srr`);

                const mergedFlightDetails = {
                    ...flightResponse.data,
                    passengers: passengersResponse.data
                };

                setFlightDetails(mergedFlightDetails);
                setCurrentSrrCodes(() => {
                    const updated = {};
                    mergedFlightDetails.passengers?.forEach(passenger => {
                        updated[passenger.id] = passenger.srrCodes || [];
                    });
                    return updated;
                });
                setSelectedPassenger(prev => {
                    if (!prev) return prev;
                    const refreshed = mergedFlightDetails.passengers?.find(p => p.id === prev.id);
                    return refreshed ? { ...prev, ...refreshed } : prev;
                });
            } catch (error) {
                console.error('Error fetching flight details:', error);
            }
        }
    };

    useEffect(() => {
        fetchFlightDetails();
    }, [activeFlightId]);

    useEffect(() => {
        const handleGlobalRefresh = (event) => {
            const targetPath = event.detail?.pathname;
            const targetSearch = event.detail?.search;
            if (targetPath === location.pathname && targetSearch === location.search) {
                fetchFlightDetails();
            }
        };

        window.addEventListener('app:data-refresh', handleGlobalRefresh);
        return () => window.removeEventListener('app:data-refresh', handleGlobalRefresh);
    }, [fetchFlightDetails, location.pathname, location.search]);

    const addSrrCode = async (passengerId, srrCode) => {
        try {
            const response = await axiosInstance.post(
                `/api/passengers/${passengerId}/add-srr-code`,
                { srrCode },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log(`Kod SSR ${srrCode} dodany do pasażera:`, response.data);

            const newSrrCodes = response.data.srrCodes || [];
            setPassengerSrrCodes(prev => ({
                ...prev,
                [passengerId]: newSrrCodes
            }));
            setCurrentSrrCodes(prev => ({
                ...prev,
                [passengerId]: newSrrCodes
            }));

            return response.data;
        } catch (error) {
            console.error(`Błąd przy dodawaniu kodu SSR ${srrCode}:`, error.response ? error.response.data : error.message);
            throw error;
        }
    };

    const passengersList = location.state?.passengers || [];

    const passengersWithDetails = useMemo(() => (
        passengersList.map((passenger) => {
            const fullPassengerData = flightDetails?.passengers?.find(p => p.id === passenger.id);
            return {
                ...passenger,
                ...fullPassengerData,
                srrCodes: currentSrrCodes[passenger.id] || fullPassengerData?.srrCodes || []
            };
        })
    ), [passengersList, currentSrrCodes, flightDetails?.passengers]);

    const selectedPassengerIds = selectedPassenger ? [selectedPassenger.id] : [];

    const stats = useMemo(() => {
        const baseStats = passengersWithDetails.reduce((acc, passenger) => {
            const status = passenger.status?.toLowerCase();
            const baggageCount = passenger.baggageList?.length || 0;
            acc.bags += baggageCount;

            if (status === 'stby' && baggageCount > 0) {
                acc.sbags += baggageCount;
            }

            switch (status) {
                case 'boarded':
                    acc.boarded += 1;
                    break;
                case 'acc':
                    acc.acc += 1;
                    break;
                case 'stby':
                    acc.stby += 1;
                    break;
                case 'off':
                    acc.off += 1;
                    break;
                default:
                    acc.none += 1;
            }

            return acc;
        }, {
            boarded: 0,
            acc: 0,
            stby: 0,
            off: 0,
            none: 0,
            bags: 0,
            sbags: 0
        });

        return {
            ...baseStats,
            booked: passengersWithDetails.length
        };
    }, [passengersWithDetails]);

    const allowCapacity = flightDetails?.capacity || flightDetails?.plane?.capacity || passengersList.length || 0;

    const statsOrder = [
        { label: 'BOARDED', value: stats.boarded },
        { label: 'ACCEPTED', value: stats.acc },
        { label: 'BOOKED', value: stats.booked },
        { label: 'ALLOWED', value: allowCapacity || '—' },
        { label: 'STANDBY', value: stats.stby },
        { label: 'BAGS', value: stats.bags },
        { label: 'SBAGS', value: stats.sbags },
    ];

    const handleOpenModal = (passenger) => {
        if (!passenger?.id) {
            console.error('No passenger selected');
            return;
        }
        setSelectedPassenger(passenger);
        setShowModal(true);
    };

    const handleUpdateStatus = async (status) => {
        if (!selectedPassenger) return;

        try {
            await axiosInstance.post(`/api/passengers/${selectedPassenger.id}/update-status`, { status });

            if (['STBY', 'OFF'].includes((status || '').toUpperCase())) {
                const seatNumber = selectedPassenger.seatNumber;
                const flightContextId = activeFlightId || flightDetails?.id;

                if (seatNumber && flightContextId) {
                    await releasePassengerSeat({
                        flightId: flightContextId,
                        passengerId: selectedPassenger.id,
                        seatNumber
                    });
                }
            }

            await fetchFlightDetails();
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleSavePassenger = async () => {
        if (!selectedPassenger?.id) {
            console.error('No passenger selected');
            return;
        }

        try {
            const payload = {
                ...passengerForm,
                dateOfBirth: normalizeDateForApi(passengerForm.dateOfBirth),
                validUntil: normalizeDateForApi(passengerForm.validUntil),
                status: selectedPassenger.status,
            };

            await axiosInstance.put(`/api/passengers/${selectedPassenger.id}`, payload);

            await fetchFlightDetails();
            setShowModal(false);
        } catch (error) {
            console.error('Error saving passenger:', error);
        }
    };

    const handleSelectPassenger = async (passengerId) => {
        const passenger = passengersWithDetails.find(p => p.id === passengerId);
        if (!passenger) return;

        setSelectedPassenger(passenger);

        if (!passenger.srrCodes || passenger.srrCodes.length === 0) {
            const fetchedSrr = await fetchSrrCodes(passengerId);
            setCurrentSrrCodes(prev => ({
                ...prev,
                [passengerId]: fetchedSrr
            }));
        }
    };

    const handleToggleSelection = (passengerId) => {
        if (selectedPassenger?.id === passengerId) {
            setSelectedPassenger(null);
            return;
        }
        handleSelectPassenger(passengerId);
    };

    const handleAddBaggage = async () => {
        if (!selectedPassenger || !baggageWeight || !baggageType) return;

        try {
            await axiosInstance.post(`/api/passengers/${selectedPassenger.id}/add-baggage`, {
                baggageType,
                baggageWeight: parseFloat(baggageWeight)
            });

            setBaggageWeight('');
            await fetchFlightDetails();
        } catch (error) {
            console.error('Error adding baggage:', error);
        }
    };

    const userIdentity = useMemo(() => {
        const token = localStorage.getItem('jwt');
        if (!token) {
            return { displayName: 'Unknown' };
        }

        try {
            const payloadPart = token.split('.')[1];
            const decodedPayload = JSON.parse(atob(payloadPart));
            const displayName =
                decodedPayload?.name ||
                decodedPayload?.username ||
                decodedPayload?.email ||
                decodedPayload?.sub ||
                'Unknown';

            return { displayName };
        } catch (error) {
            console.error('Failed to decode user identity from token', error);
            return { displayName: 'Unknown' };
        }
    }, []);

    const handleAddComment = async () => {
        if (!selectedPassenger || !comment.trim()) return;

        try {
            const commentPayload = {
                text: comment.trim(),
                date: new Date().toISOString(),
                addedBy: userIdentity.displayName || 'Unknown'
            };

            await axiosInstance.post(`/api/passengers/${selectedPassenger.id}/add-comment`, {
                ...commentPayload
            });

            setComment('');
            await fetchFlightDetails();
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleCommentChange = (event) => {
        setComment(event.target.value);
    };

    const handleAssignSeat = async (seatNumber) => {
        if (!selectedPassenger?.id || !activeFlightId) return;

        try {
            await axiosInstance.post(`/api/flights/${activeFlightId}/assign-seat`, {
                passengerId: selectedPassenger.id,
                seatNumber
            });
            await fetchFlightDetails();
        } catch (error) {
            console.error('Error assigning seat:', error);
        }
    };

    const statusLabel = (flightDetails?.status || flightDetails?.state || 'unknown').toLowerCase();
    const statusClass = statusToneMap[statusLabel] || 'status-unknown';
    const gate = flightDetails?.boardingGate || flightDetails?.gate || '—';
    const radioNumber = flightDetails?.radioNumber || flightDetails?.radio || '—';
    const planeModel = flightDetails?.plane?.model || flightDetails?.aircraftId || '—';
    const capacity = allowCapacity || passengersList.length || '—';

    const seatMapPassengers = flightDetails?.passengers || passengersWithDetails;
    const panelFlightId = activeFlightId || flightDetails?.id || '';

    return (
        <section className="passengers-page checkin-page">
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
                                flightId={panelFlightId}
                                seatMap={flightDetails.seatMap}
                                occupiedSeats={flightDetails.occupiedSeats || []}
                                passengers={seatMapPassengers}
                                onSeatClick={handleAssignSeat}
                                selectedPassenger={selectedPassenger}
                            />
                        ) : (
                            <div className="panel-placeholder">Seat map unavailable for this flight.</div>
                        )}
                    </div>
                    <div className="panel flight-info-panel">
                        <div className="flight-actions no-margin">
                            <Link
                                to={panelFlightId ? `/flights/${panelFlightId}/passenger-list` : '#'}
                                className="ghost-action"
                            >
                                Passenger List
                            </Link>
                            <Link
                                to={panelFlightId ? `/flights/${panelFlightId}/baggage-list` : '#'}
                                className="ghost-action"
                            >
                                Baggage List
                            </Link>
                        </div>
                        <div className="flight-actions">
                            <Link
                                to={panelFlightId ? `/flights/${panelFlightId}/baggage-list` : '#'}
                                className="ghost-action"
                            >
                                Add Passenger
                            </Link>
                        </div>
                    </div>
                </aside>

                <div className="passengers-right">
                    <div className="passengers-overview checkin-stats">
                        {statsOrder.map(({ label, value }) => (
                            <div key={label} className="stats-item">
                                <span className="stats-label">{label}</span>
                                <span className="stats-value">{value ?? '—'}</span>
                            </div>
                        ))}
                    </div>
                    <div className="passenger-table-card checkin-table-card">


                        {passengersWithDetails.length ? (
                            <PassengerTable
                                passengers={passengersWithDetails}
                                selectedPassengers={selectedPassengerIds}
                                onToggleSelection={handleToggleSelection}
                                getSrrTooltip={getSrrTooltip}
                            />
                        ) : (
                            <div className="checkin-empty-state">
                                No passengers were passed to this view. Return to the passenger list to start check-in.
                            </div>
                        )}
                    </div>

                    <div className="checkin-form-grid">
                        <div className="panel checkin-panel">
                            <div className="panel-header">
                                <div>
                                    <h3>Add baggage</h3>
                                    <p>Choose baggage type and weight to assign it to the selected passenger.</p>
                                </div>
                                {selectedPassenger && (
                                    <span className="panel-tag">{selectedPassenger.name} {selectedPassenger.surname}</span>
                                )}
                            </div>
                            <div className="baggage-form">
                                <label htmlFor="baggageType">Baggage type</label>
                                <div className="baggage-row">
                                    <select
                                        id="baggageType"
                                        value={baggageType}
                                        onChange={(e) => setBaggageType(e.target.value)}
                                    >
                                        <option value="BAG">BAG</option>
                                        <option value="HAND_LUGGAGE">HAND LUGGAGE</option>
                                        <option value="DAA">DAA</option>
                                        <option value="SPORT_EQUIPMENT">SPORT EQUIPMENT</option>
                                        <option value="WHEELCHAIR">WHEELCHAIR</option>
                                    </select>
                                    <input
                                        type="number"
                                        placeholder="Weight (kg)"
                                        value={baggageWeight}
                                        onChange={(e) => setBaggageWeight(e.target.value)}
                                        min="0"
                                        step="0.1"
                                    />
                                    <button
                                        onClick={handleAddBaggage}
                                        disabled={!selectedPassenger || !baggageWeight}
                                    >
                                        Add baggage
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="panel checkin-panel comment-panel">
                            <div className="panel-header">
                                <div>
                                    <h3>Add comment</h3>
                                    <p>Add context or crew notes for the selected passenger.</p>
                                </div>
                            </div>
                            <textarea
                                value={comment}
                                onChange={handleCommentChange}
                                placeholder="Write your comment here..."
                                rows={4}
                            />
                            <div className="comment-actions">
                                <button onClick={handleAddComment} disabled={!selectedPassenger || !comment.trim()}>
                                    Add comment
                                </button>
                            </div>

                            {selectedPassenger && selectedPassenger.comments?.length > 0 && (
                                <div className="comments-list">
                                    <h3>Comments</h3>
                                    <ul>
                                        {selectedPassenger.comments.map((comment, index) => (
                                            <li key={index}>
                                                <p>{comment.text}</p>
                                                <small>{comment.date} - {comment.addedBy}</small>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="actions-container">
                        <div className="left-actions">
                            <button onClick={() => console.log("Printing...") + navigate(-1)}>Print</button>
                            <button onClick={() => navigate(-1)}>Back</button>
                        </div>
                        <div className="right-actions">
                            <button
                                disabled={!selectedPassenger}
                                onClick={() => selectedPassenger ? handleOpenModal(selectedPassenger) : null}
                            >
                                API
                            </button>
                            <button disabled={!selectedPassenger} onClick={() => handleUpdateStatus('ACC')}>Accept</button>
                            <button disabled={!selectedPassenger} onClick={() => handleUpdateStatus('STBY')}>Standby</button>
                            <button disabled={!selectedPassenger} onClick={() => handleUpdateStatus('OFF')}>Offload</button>
                        </div>
                    </div>
                </div>
            </div>

            {showModal && selectedPassenger && (
                <div className="api-modal-overlay" onClick={handleCloseModal}>
                    <div className="api-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="api-modal-header">
                            <div>
                                <h1 className="api-modal-eyebrow">Advance Passenger Information</h1>
                                <h3>{selectedPassenger.name} {selectedPassenger.surname}</h3>
{/*                                 <span className="api-modal-subtitle">Edit data before sending to border control</span> */}
                            </div>
                            <button
                                type="button"
                                className="api-modal-close"
                                onClick={handleCloseModal}
                                aria-label="Close passenger form"
                            >
                                X
                            </button>
                        </div>

                        <div className="api-form-grid">
                            <label className="api-field">
                                <span>First name</span>
                                <input
                                    type="text"
                                    value={passengerForm.name}
                                    onChange={handleInputChange('name')}
                                />
                            </label>

                            <label className="api-field">
                                <span>Last name</span>
                                <input
                                    type="text"
                                    value={passengerForm.surname}
                                    onChange={handleInputChange('surname')}
                                />
                            </label>

                            <label className="api-field">
                                <span>Gender</span>
                                <select
                                    value={passengerForm.gender}
                                    onChange={handleInputChange('gender')}
                                >
                                    <option value="">Select gender</option>
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                </select>
                            </label>

                            <label className="api-field">
                                <span>Title</span>
                                <select
                                    value={passengerForm.title}
                                    onChange={handleInputChange('title')}
                                >
                                    <option value="">Select title</option>
                                    <option value="MR">MR</option>
                                    <option value="MRS">MRS</option>
                                    <option value="MS">MS</option>
                                    <option value="CHLD">CHLD</option>
                                </select>
                            </label>

                            <label className="api-field">
                                <span>Date of birth</span>
                                <input
                                    type="date"
                                    value={passengerForm.dateOfBirth || ''}
                                    onChange={handleInputChange('dateOfBirth')}
                                />
                            </label>

                            <label className="api-field">
                                <span>Citizenship</span>
                                <select
                                    value={passengerForm.citizenship || ''}
                                    onChange={handleInputChange('citizenship')}
                                >
                                    <option value="">Select country</option>
                                    {countryNames.map((country) => (
                                        <option key={country} value={country}>{country}</option>
                                    ))}
                                </select>
                            </label>

                            <label className="api-field">
                                <span>Document type</span>
                                <select
                                    value={passengerForm.documentType ?? 'P'}
                                    onChange={handleInputChange('documentType')}
                                >
                                    <option value="P">Passport</option>
                                    <option value="ID">National ID</option>
                                </select>
                            </label>

                            <label className="api-field">
                                <span>Document number</span>
                                <input
                                    type="text"
                                    value={passengerForm.serialName ?? ''}
                                    onChange={handleInputChange('serialName')}
                                />
                            </label>

                            <label className="api-field">
                                <span>Valid until</span>
                                <input
                                    type="date"
                                    value={passengerForm.validUntil || ''}
                                    onChange={handleInputChange('validUntil')}
                                />
                            </label>

                            <label className="api-field">
                                <span>Issue country</span>
                                <select
                                    value={passengerForm.issueCountry || ''}
                                    onChange={handleInputChange('issueCountry')}
                                >
                                    <option value="">Select country</option>
                                    {countryNames.map((country) => (
                                        <option key={country} value={country}>{country}</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="api-modal-footer">
                            <button type="button" className="ghost-btn" onClick={handleCloseModal}>
                                Cancel
                            </button>
                            <button type="button" className="primary-btn" onClick={handleSavePassenger}>
                                Save changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default CheckinSite;