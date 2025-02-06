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

    const [passengerSrrCodes, setPassengerSrrCodes] = useState({});
    useEffect(() => {
        const jwt = localStorage.getItem('jwt');

        if (jwt) {
            axiosInstance.get(`/api/passengers/flights/${flightId}/passengers-with-srr`, {
                headers: { Authorization: `Bearer ${jwt}` },
            }).then((response) => {
                setPassengers(response.data);

                // Przygotuj mapę kodów SSR
                const srrCodesMap = {};
                response.data.forEach(passenger => {
                    srrCodesMap[passenger.id] = passenger.srrCodes || [];
                });
                setPassengerSrrCodes(srrCodesMap);
            }).catch((error) => {
                console.error('Error fetching passengers:', error);
                setError('Failed to fetch passengers.');
            });
        }

        const countryNamesArray = Object.values(countries).map(country => country.name).sort();
        setCountryNames(countryNamesArray);
    }, [flightId]);

    const togglePassengerSelection = (passengerId) => {
        setSelectedPassengers((prevSelected) =>
            prevSelected.includes(passengerId)
                ? prevSelected.filter(id => id !== passengerId)
                : [...prevSelected, passengerId]
        );
    };

    const handleAction = async (action) => {
        const jwt = localStorage.getItem('jwt');
        if (!jwt) return;

        let newStatus = '';
        if (action === 'accept') newStatus = 'ACC';
        if (action === 'offload') newStatus = 'OFF';

        try {
            if (newStatus) {
                await Promise.all(selectedPassengers.map(passengerId =>
                    axiosInstance.put(
                        `/api/passengers/${passengerId}/status`,
                        newStatus,
                        {
                            headers: {
                                Authorization: `Bearer ${jwt}`,
                                "Content-Type": "text/plain"
                            }
                        }
                    )
                ));

                setPassengers(prevPassengers =>
                    prevPassengers.map(passenger =>
                        selectedPassengers.includes(passenger.id)
                            ? { ...passenger, status: newStatus }
                            : passenger
                    )
                );
            }

            const selectedPassengerDetails = passengers.filter(passenger =>
                selectedPassengers.includes(passenger.id)
            ).map(passenger => ({ ...passenger, status: newStatus || passenger.status }));

            navigate('/checkin', { state: { passengers: selectedPassengerDetails, action } });

        } catch (error) {
            console.error('Error updating passengers:', error);
            setError('Failed to update passengers.');
        }
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
                            <thead className="passenger-table-header">
                                <tr className="passenger-table-header-row">
                                    <th>Select</th>
                                    <th>No.</th>
                                    <th>Name</th>
                                    <th>Gender</th>
                                    <th>State</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPassengers.map((passenger, index) => (
                                    <tr key={passenger.id} className={
                                        passenger.status === 'ACC' ? 'row-accepted' :
                                            passenger.status === 'STBY' ? 'row-standby' :
                                                passenger.status === 'OFF' ? 'row-offloaded' : ''
                                    }>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selectedPassengers.includes(passenger.id)}
                                                onChange={() => togglePassengerSelection(passenger.id)}
                                            />
                                        </td>
                                        <td>{index + 1}</td>
                                        <td>
                                            {passenger.name} {passenger.surname} {passenger.title}
                                            {passengerSrrCodes[passenger.id]?.length > 0 && (
                                                <div className="srr-codes">
                                                    {passengerSrrCodes[passenger.id].map((code, idx) => (
                                                        <span key={idx} className="srr-code">{code}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
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
                    <button onClick={() => handleAction('accept')} className="accept-btn">Accept Passenger</button>
                    <button onClick={() => handleAction('update')} className="update-btn">Update Passenger</button>
                </div>
            )}
        </section>
    );
};

export default FlightPassengers;