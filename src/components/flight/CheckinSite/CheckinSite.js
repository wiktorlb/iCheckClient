import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../api/axiosConfig';
import './style.css';
import { useSrrTooltip } from '../hooks/useSrrTooltip';
import FlightInfo from '../components/FlightInfo/FlightInfo';
import SeatMap from '../components/SeatMap/SeatMap';

const { countries } = require('countries-list');

const CheckinSite = () => {
    const location = useLocation();
    const navigate = useNavigate();
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
                dateOfBirth: selectedPassenger.dateOfBirth || '',
                citizenship: selectedPassenger.citizenship || '',
                documentType: selectedPassenger.documentType || 'P',
                serialName: selectedPassenger.serialName || '',
                validUntil: selectedPassenger.validUntil || '',
                issueCountry: selectedPassenger.issueCountry || ''
            });
        }
    }, [selectedPassenger]);

    useEffect(() => {
        const countryNamesArray = Object.values(countries).map(country => country.name).sort();
        setCountryNames(countryNamesArray);
    }, [selectedPassenger]);

    const fetchSrrCodes = async (passengerId) => {
        try {
            const response = await axiosInstance.get(`/api/passengers/${passengerId}`);
            return response.data.srrCodes || [];
        } catch (error) {
            console.error('Error fetching SRR codes:', error);
            return [];
        }
    };

    useEffect(() => {
        const loadSrrCodes = async () => {
            if (location.state?.passengers) {
                const srrCodesMap = {};
                for (const passenger of location.state.passengers) {
                    const codes = await fetchSrrCodes(passenger.id);
                    srrCodesMap[passenger.id] = codes;
                }
                setPassengerSrrCodes(srrCodesMap);
                setCurrentSrrCodes(srrCodesMap);
            }
        };
        loadSrrCodes();
    }, [location.state?.passengers]);

    const refreshSrrCodes = async (passengerId) => {
        try {
            const response = await axiosInstance.get(`/api/passengers/${passengerId}`);
            const passengerData = response.data.passenger || response.data;

            if (passengerData) {
                const newSrrCodes = passengerData.srrCodes || [];
                setPassengerSrrCodes(prev => ({
                    ...prev,
                    [passengerId]: newSrrCodes
                }));
                setCurrentSrrCodes(prev => ({
                    ...prev,
                    [passengerId]: newSrrCodes
                }));
            }
        } catch (error) {
            console.error('Error refreshing SRR codes:', error);
        }
    };

    const handleOpenModal = async (passenger) => {
        if (!passenger?.id) {
            console.error('No passenger selected');
            return;
        }

        try {
            const response = await axiosInstance.get(`/api/passengers/${passenger.id}`);
            const passengerData = response.data.passenger || response.data;

            setSelectedPassenger(passengerData);
            setPassengerForm({
                name: passengerData.name || '',
                surname: passengerData.surname || '',
                gender: passengerData.gender || '',
                title: passengerData.title || '',
                status: passengerData.status || '',
                dateOfBirth: passengerData.dateOfBirth || '',
                citizenship: passengerData.citizenship || '',
                documentType: passengerData.documentType || 'P',
                serialName: passengerData.serialName || '',
                validUntil: passengerData.validUntil || '',
                issueCountry: passengerData.issueCountry || ''
            });

            setShowModal(true);
        } catch (error) {
            console.error('Error fetching passenger data:', error.response ? error.response.data : error.message);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedPassenger(null);
    };

    const handleInputChange = (field) => (event) => {
        setPassengerForm(prev => ({
            ...prev,
            [field]: event.target.value
        }));
    };
    const handleUpdateStatus = async (status) => {
        if (!selectedPassenger) return;

        try {
            // Aktualizacja statusu pasażera
            await axiosInstance.put(
                `/api/passengers/${selectedPassenger.id}/status`,
                JSON.stringify(status),
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                    },
                }
            );

            // Jeśli status to OFF, zwolnij miejsce
            if (status === 'OFF' && selectedPassenger.seatNumber) {
                try {
                    await axiosInstance.post(
                        `/api/flights/release-seat`,
                        {
                            flightId: location.state.flightId,
                            passengerId: selectedPassenger.id,
                            seatNumber: selectedPassenger.seatNumber
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                                'Content-Type': 'application/json',
                            },
                        }
                    );
                } catch (error) {
                    console.error('Błąd przy zwalnianiu miejsca:', error.response ? error.response.data : error.message);
                }
            }

            const updatedPassengers = location.state.passengers.map((p) =>
                p.id === selectedPassenger.id ? { ...p, status } : p
            );

            setSelectedPassenger((prev) => ({ ...prev, status }));
            location.state.passengers = updatedPassengers;
            await refreshSrrCodes(selectedPassenger.id);

            // Odśwież szczegóły lotu, aby zaktualizować mapę miejsc
            await fetchFlightDetails();

        } catch (error) {
            console.error('Error updating passenger status:', error.response ? error.response.data : error.message);
        }
    };

    const handleSavePassenger = async () => {
        if (!selectedPassenger?.id) {
            console.error('No passenger selected');
            return;
        }

        try {
            const updatedPassenger = {
                id: selectedPassenger.id,
                flightId: selectedPassenger.flightId,
                name: passengerForm.name,
                surname: passengerForm.surname,
                gender: passengerForm.gender,
                status: selectedPassenger.status,
                title: passengerForm.title,
                dateOfBirth: passengerForm.dateOfBirth || null,
                citizenship: passengerForm.citizenship || null,
                documentType: passengerForm.documentType || 'P',
                serialName: passengerForm.serialName || null,
                validUntil: passengerForm.validUntil || null,
                issueCountry: passengerForm.issueCountry || null
            };

            const response = await axiosInstance.put(
                `/api/passengers/${selectedPassenger.id}`,
                updatedPassenger
            );

            const refreshedPassenger = await axiosInstance.get(`/api/passengers/${selectedPassenger.id}`);
            const updatedPassengerData = refreshedPassenger.data.passenger || refreshedPassenger.data;

            if (location.state?.passengers) {
                const updatedPassengers = location.state.passengers.map(p =>
                    p.id === selectedPassenger.id ? updatedPassengerData : p
                );

                location.state = {
                    ...location.state,
                    passengers: updatedPassengers
                };
            }

            setSelectedPassenger(updatedPassengerData);
            await refreshSrrCodes(selectedPassenger.id);
            handleCloseModal();

        } catch (error) {
            console.error('Error updating passenger:', error);
            alert('Error updating passenger: ' + (error.response?.data?.message || error.message));
        }
    };

    useEffect(() => {
        if (!location.state?.passengers?.length) {
            console.warn('No passengers data in location.state');
        }
    }, [location.state]);

    const handleSelectPassenger = (passengerId) => {
        const passenger = location.state?.passengers.find(p => p.id === passengerId);
        if (passenger) {
            setSelectedPassenger(passenger);
        } else {
            console.error('Passenger not found');
        }
    };

    const handleAddBaggage = async () => {
        if (!selectedPassenger || !baggageWeight || !baggageType) return;

        const baggageData = {
            weight: parseFloat(baggageWeight),
            type: baggageType
        };

        try {
            const response = await axiosInstance.put(
                `/api/passengers/${selectedPassenger.id}/add-baggage`,
                baggageData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (location.state?.passengers) {
                const updatedPassengers = location.state.passengers.map(p =>
                    p.id === selectedPassenger.id ? response.data : p
                );
                location.state.passengers = updatedPassengers;
            }

            setSelectedPassenger(response.data);
            await refreshSrrCodes(selectedPassenger.id);
            setBaggageWeight('');
            setBaggageType('BAG');

            await fetchFlightDetails();

        } catch (error) {
            console.error("Error adding baggage:", error.response ? error.response.data : error.message);
        }
    };

    const handleAddComment = async () => {
        if (!selectedPassenger || !comment.trim()) return;

        try {
            const jwt = localStorage.getItem('jwt');
            const tokenPayload = JSON.parse(atob(jwt.split('.')[1]));
            const userId = tokenPayload.sub;

            const newComment = {
                text: comment,
                date: new Date().toLocaleString(),
                addedBy: userId
            };

            const response = await axiosInstance.put(
                `/api/passengers/${selectedPassenger.id}/add-comment`,
                newComment,
                {
                    headers: {
                        Authorization: `Bearer ${jwt}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (location.state?.passengers) {
                const updatedPassengers = location.state.passengers.map(p =>
                    p.id === selectedPassenger.id ? response.data : p
                );
                location.state.passengers = updatedPassengers;
            }

            setSelectedPassenger(response.data);
            setComment('');

            await refreshSrrCodes(selectedPassenger.id);

            await fetchFlightDetails();

        } catch (error) {
            console.error("Error adding comment:", error.response ? error.response.data : error.message);
        }
    };

    const handleCommentChange = (event) => {
        setComment(event.target.value);
    };

    const fetchFlightDetails = async () => {
        if (location.state?.flightId) {
            try {
                // Pobierz szczegóły lotu
                const flightResponse = await axiosInstance.get(`/api/flights/${location.state.flightId}`);
                console.log('Flight details response:', flightResponse.data);

                // Pobierz wszystkich pasażerów lotu
                const passengersResponse = await axiosInstance.get(`/api/passengers/flights/${location.state.flightId}/passengers-with-srr`);
                console.log('Passengers response:', passengersResponse.data);

                // Połącz dane
                const flightDetails = {
                    ...flightResponse.data,
                    passengers: passengersResponse.data
                };

                setFlightDetails(flightDetails);
            } catch (error) {
                console.error('Error fetching flight details:', error);
            }
        }
    };

    useEffect(() => {
        fetchFlightDetails();
    }, [location.state?.flightId]);

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

            // Aktualizacja stanu kodów SSR
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

    const handleAssignSeat = async (seatNumber) => {
        if (!selectedPassenger?.id || !location.state?.flightId) {
            console.error('Brak danych: flightId lub passengerId');
            return;
        }

        if (!seatNumber) {
            seatNumber = prompt("Wprowadź numer miejsca:");
            if (!seatNumber) return;
        }

        try {
            // Przypisanie miejsca
            const response = await axiosInstance.post(
                `/api/flights/assign-seat`,
                {
                    flightId: location.state.flightId,
                    passengerId: selectedPassenger.id,
                    seatNumber: seatNumber
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log(`Miejsce ${seatNumber} przypisane do pasażera ${selectedPassenger.name}:`, response.data);

            // Pobierz zaktualizowane dane pasażera
            const passengerResponse = await axiosInstance.get(`/api/passengers/${selectedPassenger.id}`);
            const updatedPassenger = passengerResponse.data.passenger || passengerResponse.data;

            // Upewnij się, że pasażer ma przypisany numer miejsca
            if (!updatedPassenger.seatNumber) {
                updatedPassenger.seatNumber = seatNumber;
            }

            // Aktualizuj stan pasażera
            setSelectedPassenger(updatedPassenger);

            // Aktualizuj listę pasażerów
            if (location.state?.passengers) {
                const updatedPassengers = location.state.passengers.map(p =>
                    p.id === selectedPassenger.id ? updatedPassenger : p
                );
                location.state.passengers = updatedPassengers;
            }

            // Dodaj kod SSR i odśwież kody
            await addSrrCode(selectedPassenger.id, 'SEAT');
            await refreshSrrCodes(selectedPassenger.id);

            // Odśwież szczegóły lotu
            await fetchFlightDetails();

        } catch (error) {
            console.error('Błąd przy przypisywaniu miejsca:', error.response ? error.response.data : error.message);
            alert(`Błąd: ${error.response?.data || error.message}`);
        }
    };

    useEffect(() => {
        const fetchPassengerData = async () => {
            if (location.state?.passengers) {
                const updatedPassengers = await Promise.all(
                    location.state.passengers.map(async (passenger) => {
                        try {
                            const response = await axiosInstance.get(`/api/passengers/${passenger.id}`);
                            return response.data.passenger || response.data;
                        } catch (error) {
                            console.error(`Błąd przy pobieraniu danych pasażera ${passenger.id}:`, error);
                            return passenger;
                        }
                    })
                );
                location.state.passengers = updatedPassengers;
            }
        };
        fetchPassengerData();
    }, [location.state?.passengers]);

    return (
        <section className="checkin-site">
            <div className="checkin-container">
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
                        flightId={location.state?.flightId}
                        seatMap={flightDetails.seatMap}
                        occupiedSeats={flightDetails.occupiedSeats || []}
                        onSeatClick={handleAssignSeat}
                        selectedPassenger={selectedPassenger}
                    />
                )}
            </div>
            <div className="checkin-actions">
                <h1>Check-in Actions</h1>
                <div className="passenger-container">
                    <table className="passenger-table">
                        <thead>
                            <tr>
                                <th>Select</th>
                                <th>No.</th>
                                <th>Name</th>
                                <th>Gender</th>
                                <th>Seat</th>
                                <th>State</th>
                            </tr>
                        </thead>
                        <tbody>
                            {location.state?.passengers.map((passenger, index) => (
                                <tr key={passenger.id} className={
                                    passenger.status === 'ACC' ? 'row-accepted' :
                                    passenger.status === 'STBY' ? 'row-standby' :
                                    passenger.status === 'OFF' ? 'row-offloaded' : ''
                                }>
                                    <td>
                                        <input
                                            type="radio"
                                            name="passengerSelect"
                                            checked={selectedPassenger?.id === passenger.id}
                                            onChange={() => handleSelectPassenger(passenger.id)}
                                        />
                                    </td>
                                    <td>{index + 1}</td>
                                    <td>{passenger.name} {passenger.surname} {passenger.title} {currentSrrCodes[passenger.id]?.length > 0 && (
                                        <div className="srr-codes">
                                            {currentSrrCodes[passenger.id].map((code, idx) => (
                                                <span
                                                    key={idx}
                                                    className={`srr-code ${code === 'SEAT' ? 'seat-code' : code.toLowerCase()}`}
                                                    data-tooltip={getSrrTooltip(code, passenger)}
                                                    onMouseEnter={(event) => {
                                                        const element = event.currentTarget;
                                                        const rect = element.getBoundingClientRect();

                                                        // Oblicz pozycję tooltipa
                                                        let x = rect.left + (rect.width / 2);
                                                        let y = rect.top - 15;

                                                        // Sprawdź pozycję względem viewportu
                                                        if (rect.top < 100) {
                                                            // Jeśli jest zbyt blisko góry, pokaż tooltip pod elementem
                                                            y = rect.bottom + 10;
                                                        }

                                                        // Ustaw style za pomocą CSS custom properties
                                                        element.style.setProperty('--tooltip-x', `${x}px`);
                                                        element.style.setProperty('--tooltip-y', `${y}px`);
                                                    }}
                                                >
                                                    {code}
                                                </span>
                                            ))}
                                        </div>
                                    )}</td>
                                    <td>{passenger.gender}</td>
                                    <td>{passenger.seatNumber}</td>
                                    <td>{passenger.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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

                <div className="baggage-form">
                    <label>Wybierz typ bagażu:</label>
                    <select value={baggageType} onChange={(e) => setBaggageType(e.target.value)}>
                        <option value="BAG">BAG</option>
                        <option value="HAND_LUGGAGE">HAND LUGGAGE</option>
                        <option value="DAA">DAA</option>
                        <option value="SPORT_EQUIPMENT">SPORT EQUIPMENT</option>
                        <option value="WHEELCHAIR">WHEELCHAIR</option>
                    </select>
                    <input
                        type="number"
                        placeholder="Enter baggage weight"
                        value={baggageWeight}
                        onChange={(e) => setBaggageWeight(e.target.value)}
                    />
                    <button onClick={handleAddBaggage} disabled={!selectedPassenger}>Add Baggage</button>
                </div>

                <div className="comment-section">
                    <h2>Add a Comment</h2>
                    <textarea
                        value={comment}
                        onChange={handleCommentChange}
                        placeholder="Write your comment here..."
                        rows="4"
                        cols="50"
                    />
                    <button onClick={handleAddComment} disabled={!selectedPassenger}>Add Comment</button>

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

            {showModal && selectedPassenger && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>API for {selectedPassenger.name} {selectedPassenger.surname}</h2>
                            <button className="close-btn" onClick={handleCloseModal}>X</button>
                        </div>
                        <div className="form-grid">
                            <label>
                                Name:
                                <input
                                    type="text"
                                    value={passengerForm.name}
                                    onChange={handleInputChange('name')}
                                />
                            </label>
                            <label>
                                Surname:
                                <input
                                    type="text"
                                    value={passengerForm.surname}
                                    onChange={handleInputChange('surname')}
                                />
                            </label>

                            <label>
                                Gender:
                                <select
                                    value={passengerForm.gender}
                                    onChange={handleInputChange('gender')}
                                >
                                    <option value="">Select gender</option>
                                    <option value="M">M</option>
                                    <option value="F">F</option>
                                </select>
                            </label>

                            <label>
                                Title:
                                <select
                                    value={passengerForm.title}
                                    onChange={handleInputChange('title')}
                                >
                                    <option value="">Select title</option>
                                    <option value="MR">MR</option>
                                    <option value="MRS">MRS</option>
                                    <option value="CHLD">CHLD</option>
                                </select>
                            </label>

                            <label>
                                Date of Birth:
                                <input
                                    type="date"
                                    value={passengerForm.dateOfBirth || ''}
                                    onChange={handleInputChange('dateOfBirth')}
                                />
                            </label>

                            <label>
                                Citizenship:
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

                            <label>
                                Document Type:
                                <select
                                    value={passengerForm.documentType || 'P'}
                                    onChange={handleInputChange('documentType')}
                                >
                                    <option value="P">Passport</option>
                                    <option value="ID">ID Card</option>
                                </select>
                            </label>

                            <label>
                                Serial Name:
                                <input
                                    type="text"
                                    value={passengerForm.serialName || ''}
                                    onChange={handleInputChange('serialName')}
                                />
                            </label>

                            <label>
                                Valid Until:
                                <input
                                    type="date"
                                    value={passengerForm.validUntil || ''}
                                    onChange={handleInputChange('validUntil')}
                                />
                            </label>

                            <label>
                                Issue Country:
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

                        <div className="modal-footer">
                            <button onClick={handleSavePassenger} className="save-btn">Save</button>
                            <button onClick={handleCloseModal} className="cancel-btn">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default CheckinSite;