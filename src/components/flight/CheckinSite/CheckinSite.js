import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../api/axiosConfig';
import './style.css';


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
                // Ustaw domyślną wartość 'P' jeśli documentType jest null
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
            }
        };
        loadSrrCodes();
    }, [location.state?.passengers]);

    const refreshSrrCodes = async (passengerId) => {
        try {
            const response = await axiosInstance.get(`/api/passengers/${passengerId}`);
            const passengerData = response.data.passenger || response.data;

            if (passengerData) {
                setPassengerSrrCodes(prev => ({
                    ...prev,
                    [passengerId]: passengerData.srrCodes || []
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

            const updatedPassengers = location.state.passengers.map((p) =>
                p.id === selectedPassenger.id ? { ...p, status } : p
            );

            setSelectedPassenger((prev) => ({ ...prev, status }));
            location.state.passengers = updatedPassengers;
            await refreshSrrCodes(selectedPassenger.id);

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

            // Zapisz zaktualizowane dane pasażera
            const response = await axiosInstance.put(
                `/api/passengers/${selectedPassenger.id}`,
                updatedPassenger
            );

            // Pobierz zaktualizowane dane pasażera
            const refreshedPassenger = await axiosInstance.get(`/api/passengers/${selectedPassenger.id}`);
            const updatedPassengerData = refreshedPassenger.data.passenger || refreshedPassenger.data;

            // Aktualizuj location.state
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
    // Dodaj useEffect do monitorowania zmian w location.state
    useEffect(() => {
        if (!location.state?.passengers?.length) {
            console.warn('No passengers data in location.state');
            // Możesz tutaj dodać kod do pobrania danych
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

            // Aktualizujemy stan pasażera w location.state
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

        } catch (error) {
            console.error("Error adding baggage:", error.response ? error.response.data : error.message);
        }
    };

    const handleAddComment = async () => {
        if (!selectedPassenger || !comment.trim()) return;

        const newComment = {
            text: comment,
            date: new Date().toLocaleString(),
            addedBy: "Admin",
        };

        try {
            const response = await axiosInstance.put(
                `/api/passengers/${selectedPassenger.id}/add-comment`,
                newComment,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            // Aktualizujemy stan pasażera w location.state
            if (location.state?.passengers) {
                const updatedPassengers = location.state.passengers.map(p =>
                    p.id === selectedPassenger.id ? response.data : p
                );
                location.state.passengers = updatedPassengers;
            }

            setSelectedPassenger(response.data);
            setComment('');
            await refreshSrrCodes(selectedPassenger.id);

        } catch (error) {
            console.error("Error adding comment:", error.response ? error.response.data : error.message);
        }
    };

    const handleCommentChange = (event) => {
        setComment(event.target.value);
    };

    const getSrrTooltip = (code, passenger) => {
        if (code.startsWith('BAG')) {
            if (!passenger.baggageList || !Array.isArray(passenger.baggageList)) {
                return 'No baggage details available';
            }

            const bagIndex = parseInt(code.slice(3)) - 1;
            const baggage = passenger.baggageList[bagIndex];

            if (baggage) {
                return `Baggage Details:\n` +
                    `ID: ${baggage.id || 'N/A'}\n` +
                    `Weight: ${baggage.weight || 'N/A'} kg`;
            }
            return 'Baggage information not found';
        }

        if (code === 'DOCS') {
            if (passenger.documentType || passenger.citizenship || passenger.validUntil || passenger.issueCountry) {
                const details = [];

                if (passenger.documentType) details.push(`Type: ${passenger.documentType}`);
                if (passenger.citizenship) details.push(`Citizenship: ${passenger.citizenship}`);
                if (passenger.serialName) details.push(`Serial Number: ${passenger.serialName}`);
                if (passenger.validUntil) details.push(`Valid Until: ${passenger.validUntil}`);
                if (passenger.issueCountry) details.push(`Issue Country: ${passenger.issueCountry}`);

                return details.length > 0
                    ? `Document Details:\n${details.join('\n')}`
                    : 'Document information not available';
            }
            return 'Document information not available';
        }

        if (code === 'COM') {
            if (passenger.comments && passenger.comments.length > 0) {
                return passenger.comments.map(comment =>
                    `Comment: ${comment.text}\n` +
                    `Added by: ${comment.addedBy}\n` +
                    `Date: ${comment.date}`
                ).join('\n\n');
            }
            return 'No comments available';
        }

        return 'No additional information available';
    };


    return (
        <section>
            <main className="main">
                <h1>Check-in Site</h1>
                <div className="passenger-container">
                    <table className="passenger-table">
                        <thead>
                            <tr>
                                <th>Select</th>
                                <th>No.</th>
                                <th>Name</th>
                                <th>Gender</th>
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
                                            name="passengerSelect" // dodaj name aby radio buttons działały jako grupa
                                            checked={selectedPassenger?.id === passenger.id}
                                            onChange={() => handleSelectPassenger(passenger.id)}
                                        />
                                    </td>
                                    <td>{index + 1}</td>
                                    <td>{passenger.name} {passenger.surname} {passenger.title} {passengerSrrCodes[passenger.id]?.length > 0 && (
                                        <div className="srr-codes">
                                            {passengerSrrCodes[passenger.id].map((code, idx) => (
                                                <span
                                                    key={idx}
                                                    className={`srr-code ${code.toLowerCase()}`}
                                                    data-tooltip={getSrrTooltip(code, passenger)}
                                                >
                                                    {code}
                                                </span>
                                            ))}
                                        </div>
                                    )}</td>
                                    <td>{passenger.gender}</td>
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
                        <button disabled={!selectedPassenger}>Seat</button>
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

                {/* Formularz komentarza */}
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

                    {/* Lista komentarzy */}
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
            </main>

            {/* Modal z danymi pasażera */}
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