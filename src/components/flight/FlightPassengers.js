import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import './style.css';

const FlightPassengers = () => {
    const { flightId } = useParams(); // Pobieranie ID lotu z URL
    const [passengers, setPassengers] = useState([]);
    const [error, setError] = useState(null);

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

    return (
        <section>
            <main className="main">
                {error && <div className="error-message">{error}</div>}

                <h1>Passengers List</h1>

                {passengers.length > 0 ? (
                    <table className="passenger-table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Name</th>
                                <th>Surname</th>
                            </tr>
                        </thead>
                        <tbody>
                            {passengers.map((passenger, index) => (
                                <tr key={passenger.passengerId}>
                                    <td>{index + 1}</td>
                                    <td>{passenger.name}</td>
                                    <td>{passenger.surname}</td>
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