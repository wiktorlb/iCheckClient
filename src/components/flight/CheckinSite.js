import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import './style.css';

const { countries } = require('countries-list');

const CheckinSite = () => {
    const { flightId } = useParams();
    const [passengers, setPassengers] = useState([]);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [selectedPassenger, setSelectedPassenger] = useState(null);
    const [countryNames, setCountryNames] = useState([]);

    useEffect(() => {
        const jwt = localStorage.getItem('jwt');
        if (jwt) {
            axiosInstance.get(`/api/flights/${flightId}/selected-passengers`, {
                headers: { Authorization: `Bearer ${jwt}` },
            }).then((response) => {
                setPassengers(response.data);
            }).catch((error) => {
                console.error('Error fetching selected passengers:', error);
                setError('Failed to fetch selected passengers.');
            });
        }
        const countryNamesArray = Object.values(countries).map(country => country.name).sort();
        setCountryNames(countryNamesArray);
    }, [flightId]);

    const handleOpenModal = (passenger) => {
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
                <h1>Check-in Selected Passengers</h1>
                {passengers.length > 0 ? (
                    <table className="passenger-table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Name</th>
                                <th>Surname</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {passengers.map((passenger, index) => (
                                <tr key={passenger.id}>
                                    <td>{index + 1}</td>
                                    <td>{passenger.name}</td>
                                    <td>{passenger.surname}</td>
                                    <td>
                                        <button onClick={() => handleOpenModal(passenger)} className="api-btn">API</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div>No selected passengers.</div>
                )}
            </main>

            {showModal && selectedPassenger && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>API Modal</h2>
                            <button className="close-btn" onClick={handleCloseModal}>X</button>
                        </div>
                        <p>API details for {selectedPassenger.name} {selectedPassenger.surname}</p>
                        <button onClick={handleCloseModal}>Close</button>
                    </div>
                </div>
            )}
        </section>
    );
};

export default CheckinSite;