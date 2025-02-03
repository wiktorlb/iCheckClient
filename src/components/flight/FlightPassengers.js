import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import './style.css';

const FlightPassengers = () => {
    const { flightId } = useParams();
    const [passengers, setPassengers] = useState([]);
    const [error, setError] = useState(null);
    const [flightStatus, setFlightStatus] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedPassenger, setSelectedPassenger] = useState(null);

    useEffect(() => {
        const jwt = localStorage.getItem('jwt');
        console.log("flightId:", flightId); // Sprawdzamy, czy flightId jest dostępne

        if (jwt) {
            axiosInstance.get(`/api/flights/${flightId}/passengers`, {
                headers: { Authorization: `Bearer ${jwt}` },
            }).then((response) => {
                setFlightStatus(response.data.state);
            }).catch((error) => {
                console.error('Error fetching flight details:', error);
                setError('Failed to fetch flight details.');
            });

            // Pobierz pasażerów
            axiosInstance.get(`/api/flights/${flightId}/passengers`, {
                headers: { Authorization: `Bearer ${jwt}` },
            }).then((response) => {
                setPassengers(response.data);
            }).catch((error) => {
                console.error('Error fetching passengers:', error);
                setError('Failed to fetch passengers.');
            });
        }
    }, [flightId]);

    const handleAcceptPassenger = async (passengerId) => {
        const jwt = localStorage.getItem('jwt');
        if (!jwt) return;

        try {
            // Zmieniamy status pasażera na 'Accepted'
            await axiosInstance.put(`/api/flights/${flightId}/passengers/${passengerId}/accept`, {}, {
                headers: { Authorization: `Bearer ${jwt}` },
            });

            // Po zaakceptowaniu pasażera, zaktualizuj listę pasażerów
            const updatedPassengers = await axiosInstance.get(`/api/flights/${flightId}/passengers`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });

            setPassengers(updatedPassengers.data);
        } catch (error) {
            console.error('Error accepting passenger:', error);
        }
    };
    const handleSavePassenger = async () => {
        const jwt = localStorage.getItem('jwt');
        if (!jwt) return;

        try {
            await axiosInstance.put(`/api/passengers/${selectedPassenger.id}`, selectedPassenger, {
                headers: { Authorization: `Bearer ${jwt}` },
            });

            // Pobierz aktualne dane pasażerów
            const updatedPassengers = await axiosInstance.get(`/api/flights/${flightId}/passengers`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });

            setPassengers(updatedPassengers.data);
            setShowModal(false);
            setSelectedPassenger(null);
        } catch (error) {
            console.error('Error saving passenger:', error);
        }
    };
    const handleInputChange = (field) => (e) => {
        setSelectedPassenger((prev) => ({
            ...prev,
            [field]: e.target.value
        }));
    };

    const handleOpenModal = (passenger) => {
        console.log("Opening modal for passenger:", passenger);
        setSelectedPassenger(passenger);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedPassenger(null);
    };

    return (
        <section>
            <main className="main">
                {error && <div className="error-message">{error}</div>}
                <h1>Passengers List</h1>
                <div>
                    <h3>Total Passengers: {passengers.length}</h3>
                </div>
                {passengers.length > 0 ? (
                    <table className="passenger-table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Name</th>
                                <th>Surname</th>
                                <th>Gender</th>
                                <th>State</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {passengers.map((passenger, index) => (
                                <tr key={passenger.id}>
                                    <td>{index + 1}</td>
                                    <td>{passenger.name}</td>
                                    <td>{passenger.surname}</td>
                                    <td>{passenger.gender}</td>
                                    <td>{passenger.status}</td>
                                    <td>
                                        <button onClick={() => handleAcceptPassenger(passenger.id)} className="accept-btn">Accept</button>
                                        <button onClick={() => handleOpenModal(passenger)} className="api-btn">API</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div>No passengers found for this flight.</div>
                )}
            </main>

            {showModal && selectedPassenger && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Advance Passenger Information</h2>
                            <button className="close-btn" onClick={handleCloseModal}>X</button>
                        </div>
                        <label>Name: <input type="text" defaultValue={selectedPassenger.name} /></label>
                        <label>Surname: <input type="text" defaultValue={selectedPassenger.surname} /></label>
                        {/* Gender - Select */}
                        <label>Gender:
                            <select value={selectedPassenger.gender} onChange={handleInputChange('gender')}>
                                <option value="MR">MR</option>
                                <option value="MRS">MRS</option>
                                <option value="CHLD">CHLD</option>
                            </select>
                        </label>

                        <label>Date of Birth: <input type="date" value={selectedPassenger.dateOfBirth} onChange={handleInputChange('dateOfBirth')} /></label>
                        <label>Citizenship: <input type="text" value={selectedPassenger.citizenship} onChange={handleInputChange('citizenship')} /></label>
                        <label>Document Type:
                            <select value={selectedPassenger.documentType} onChange={handleInputChange('documentType')}>
                                <option value="P">P</option>
                                <option value="ID">ID</option>
                            </select>
                        </label>
                        <label>Serial Name: <input type="text" value={selectedPassenger.serialName} onChange={handleInputChange('serialName')} /></label>
                        <label>Valid Until: <input type="date" value={selectedPassenger.validUntil} onChange={handleInputChange('validUntil')} /></label>
                        <label>Issue Country: <input type="text" value={selectedPassenger.issueCountry} onChange={handleInputChange('issueCountry')} /></label>
                        <button onClick={handleSavePassenger}>Save</button>
                    </div>
                </div>
            )}
        </section>
    );
};

export default FlightPassengers;