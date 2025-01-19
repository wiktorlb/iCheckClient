import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import './style.css';

const FlightCheckin = () => {
    const { flightId } = useParams(); // Pobranie ID lotu z URL
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
                    setPassengers(response.data);
                })
                .catch((error) => {
                    console.error('Error fetching passengers:', error);
                    setError('Failed to fetch passengers.');
                });
        }
    }, [flightId]);

    const updatePassengerState = (id, newState) => {
        const jwt = localStorage.getItem('jwt');
        if (jwt) {
            axiosInstance
                .put(`/api/flights/passenger/${id}/state`, newState, {
                    headers: { Authorization: `Bearer ${jwt}` },
                })
                .then((response) => {
                    setPassengers((prev) =>
                        prev.map((p) =>
                            p.id === id ? { ...p, state: response.data.state } : p
                        )
                    );
                })
                .catch((error) => {
                    console.error('Error updating passenger state:', error);
                });
        }
    };

    return (
        <div className="main-wrapper">
            <div className="pax-main">
                {error && <div className="error-message">{error}</div>}
                <table className="pax-table">
                    <thead>
                        <tr>
                            <th>No.</th>
                            <th>Bag</th>
                            <th>Passenger</th>
                            <th>Gender</th>
                            <th>State</th>
                            <th>Seat</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {passengers.map((passenger, index) => (
                            <tr key={passenger.id}>
                                <td>{index + 1}</td>
                                <td>{/* Bag information */}</td>
                                <td>{`${passenger.surname} ${passenger.name}`}</td>
                                <td>{passenger.gender}</td>
                                <td>{passenger.state}</td>
                                <td>{passenger.seat}</td>
                                <td>
                                    <button
                                        onClick={() =>
                                            updatePassengerState(
                                                passenger.id,
                                                passenger.state === 'NOSHOW'
                                                    ? 'ACCEPTED'
                                                    : 'BOARDED'
                                            )
                                        }
                                    >
                                        {passenger.state === 'NOSHOW'
                                            ? 'Accept'
                                            : passenger.state === 'ACCEPTED'
                                                ? 'Board'
                                                : 'Done'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FlightCheckin;