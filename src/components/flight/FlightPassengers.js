import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import './style.css';

const { countries } = require('countries-list');

const FlightPassengers = () => {
    const { flightId } = useParams();
    const navigate = useNavigate();
    const [passengers, setPassengers] = useState([]);
    const [selectedPassengers, setSelectedPassengers] = useState([]);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [countryNames, setCountryNames] = useState([]);

    useEffect(() => {
        const jwt = localStorage.getItem('jwt');

        if (jwt) {
            axiosInstance.get(`/api/flights/${flightId}/passengers`, {
                headers: { Authorization: `Bearer ${jwt}` },
            }).then((response) => {
                setPassengers(response.data);
            }).catch((error) => {
                console.error('Error fetching passengers:', error);
                setError('Failed to fetch passengers.');
            });
        }

        const countryNamesArray = Object.values(countries).map(country => country.name).sort();
        setCountryNames(countryNamesArray);
    }, [flightId]);

    const togglePassengerSelection = (passengerId) => {
        setSelectedPassengers((prevSelected) => {
            if (prevSelected.includes(passengerId)) {
                return prevSelected.filter(id => id !== passengerId);
            } else {
                return [...prevSelected, passengerId];
            }
        });
    };

    const handleNavigate = (action) => {
        navigate('/checkin', { state: { passengers: selectedPassengers, action } });
    };

    const filteredPassengers = passengers.filter(passenger =>
        passenger.surname.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <section>
            <main className="main">
                {error && <div className="error-message">{error}</div>}
                <h1>Passengers List</h1>
                <div>
                    <h3>Total Passengers: {passengers.length}</h3>
                </div>
                <input
                    type="text"
                    placeholder="Search by surname..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-bar"
                />
                {filteredPassengers.length > 0 ? (
                    <div className="passenger-container">
                        <table className="passenger-table">
                            <thead>
                                <tr>
                                    <th>Select</th>
                                    <th>No.</th>
                                    <th>Name</th>
                                    <th>Surname</th>
                                    <th>Gender</th>
                                    <th>State</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPassengers.map((passenger, index) => (
                                    <tr key={passenger.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedPassengers.includes(passenger.id)}
                                                onChange={() => togglePassengerSelection(passenger.id)}
                                            />
                                        </td>
                                        <td>{index + 1}</td>
                                        <td>{passenger.name}</td>
                                        <td>{passenger.surname}</td>
                                        <td>{passenger.gender}</td>
                                        <td>{passenger.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div>No passengers found for this flight.</div>
                )}
            </main>

            {selectedPassengers.length > 0 && (
                <div className="action-panel fixed-action-panel">
                    <button onClick={() => handleNavigate('accept')} className="accept-btn">Accept Passenger</button>
                    <button onClick={() => handleNavigate('update')} className="update-btn">Update Passenger</button>
                </div>
            )}
        </section>
    );
};

export default FlightPassengers;