import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import './style.css';

const FlightPassengers = () => {
    const { flightId } = useParams(); // Pobieranie ID lotu z URL
    const [passengers, setPassengers] = useState([]);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Hook do przekierowywania

    useEffect(() => {
        const jwt = localStorage.getItem('jwt');

        if (jwt) {
            axiosInstance
                .get(`/api/flights/${flightId}/passengers`, {
                    headers: { Authorization: `Bearer ${jwt}` },
                })
                .then((response) => {
                    setPassengers(response.data); // Ustawienie listy pasażerów
                })
                .catch((error) => {
                    console.error('Error fetching passengers:', error);
                    setError('Failed to fetch passengers.');
                });
        }
    }, [flightId]);

    // Funkcja obsługująca przekierowanie do formularza dodawania pasażerów
    const handleAddPassengers = () => {
        navigate(`/flights/${flightId}/upload-passengers`); // Przekierowanie do formularza
    };

    // Funkcja do usuwania pasażera
    const handleDeletePassenger = async (passengerId) => {
        console.log('Deleting passenger with ID:', passengerId);
        const jwt = localStorage.getItem('jwt');

        if (!jwt) {
            setError('You must be logged in to delete a passenger.');
            return;
        }

        try {
            const response = await axiosInstance.delete(`/api/flights/${flightId}/passengers/${passengerId}`, {
                headers: { Authorization: `Bearer ${jwt}` },
            });

            // Po usunięciu pasażera, odśwież listę
            setPassengers((prevPassengers) =>
                prevPassengers.filter((passenger) => passenger.id !== passengerId)
            );
        } catch (error) {
            console.error('Error deleting passenger:', error);
            if (error.response && error.response.status === 401) {
                setError('Invalid or expired token. Please log in again.');
            } else {
                setError('An error occurred while deleting the passenger.');
            }
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