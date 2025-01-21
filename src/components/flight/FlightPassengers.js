import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import './style.css';

const FlightPassengers = () => {
    const { flightId } = useParams(); // Pobieranie ID lotu z URL
    const [passengers, setPassengers] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Hook do przekierowywania

    const [flightStatus, setFlightStatus] = useState('');
    useEffect(() => {
        const jwt = localStorage.getItem('jwt');

        if (jwt) {
            axiosInstance
                .get(`/api/flights/${flightId}/passengers`, {
                    headers: { Authorization: `Bearer ${jwt}` },
                })
                .then((response) => {
                    setFlightStatus(response.data.state); // Ustaw status lotu
                })
                .catch((error) => {
                    console.error('Error fetching flight details:', error);
                    setError('Failed to fetch flight details.');
                });

            axiosInstance
                .get(`/api/flights/${flightId}/passengers`, {
                    headers: { Authorization: `Bearer ${jwt}` },
                })
                .then((response) => {
                    setPassengers(response.data); // Ustaw listę pasażerów
                })
                .catch((error) => {
                    console.error('Error fetching passengers:', error);
                    setError('Failed to fetch passengers.');
                });
        }
    }, [flightId]);

    const updateFlightStatus = (newStatus) => {
        const jwt = localStorage.getItem('jwt');

        if (!jwt) {
            setError('You must be logged in to update flight status.');
            return;
        }

        // Tworzenie obiektu z kluczem "newStatus"
        const payload = { newStatus };

        axiosInstance
            .put(`/api/flights/${flightId}/status`, payload, {
                headers: { Authorization: `Bearer ${jwt}` },
            })
            .then(() => {
                setFlightStatus(newStatus); // Zaktualizuj status w stanie
            })
            .catch((error) => {
                console.error('Error updating flight status:', error);
                setError('Failed to update flight status.');
            });
    };
    // Funkcja obsługująca przekierowanie do formularza dodawania pasażerów
    const handleAddPassengers = () => {
        navigate(`/flights/${flightId}/upload-passengers`);
    };

    // Funkcja do usuwania pasażera
    const handleDeletePassenger = async (passengerId) => {
        const jwt = localStorage.getItem('jwt');

        if (!jwt) {
            setError('You must be logged in to delete a passenger.');
            return;
        }

        try {
            await axiosInstance.delete(`/api/flights/${flightId}/passengers/${passengerId}`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });

            // Aktualizuj listę pasażerów po usunięciu
            setPassengers((prevPassengers) =>
                prevPassengers.filter((passenger) => passenger.id !== passengerId)
            );
        } catch (error) {
            console.error('Error deleting passenger:', error);
            setError('An error occurred while deleting the passenger.');
        }
    };
    return (
        <section>
            <main className="main">
                {error && <div className="error-message">{error}</div>}

                <h1>Passengers List</h1>

                {/* Liczba pasażerów */}
                <div>
                    <h3>Total Passengers: {passengers.length}</h3>
                </div>

                <button onClick={handleAddPassengers} className="add-passengers-btn">
                    Add Passengers
                </button>
                <div className="status-section">
                    <h3>Flight Status: {flightStatus}</h3>
                    <div className="status-buttons">
                        {['Prepare', 'Open', 'Closed', 'Finalized'].map((status) => (
                            <button
                                key={status}
                                onClick={() => updateFlightStatus(status.toLowerCase())}
                                className={`status-btn ${flightStatus === status.toLowerCase() ? 'active' : ''}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {passengers.length > 0 ? (
                    <table className="passenger-table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Name</th>
                                <th>Surname</th>
                                <th>Gender</th>
                                <th>Actions</th> {/* Kolumna dla przycisku usuwania */}
                            </tr>
                        </thead>
                        <tbody>
                            {passengers.map((passenger, index) => (
                                <tr key={passenger.id}>
                                    <td>{index + 1}</td>
                                    <td>{passenger.name}</td>
                                    <td>{passenger.surname}</td>
                                    <td>{passenger.gender}</td>
                                    <td>
                                        {/* Przycisk do usuwania pasażera */}
                                        <button
                                            onClick={() => handleDeletePassenger(passenger.id)}
                                            className="delete-btn">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div>No passengers found for this flight.</div>
                )}
            </main>
        </section>
    );
};

export default FlightPassengers;