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
    const getPassengerStats = () => {
        const stats = {
            none: 0,
            acc: 0,
            stby: 0,
            off: 0
        };

        passengers.forEach(passenger => {
            switch (passenger.status) {
                case 'NONE':
                    stats.none++;
                    break;
                case 'ACC':
                    stats.acc++;
                    break;
                case 'STBY':
                    stats.stby++;
                    break;
                case 'OFF':
                    stats.off++;
                    break;
                default:
                    break;
            }
        });

        const total = passengers.length || 1; // Zabezpieczenie przed dzieleniem przez 0
        return {
            none: {
                count: stats.none,
                percentage: (stats.none / total) * 100
            },
            acc: {
                count: stats.acc,
                percentage: (stats.acc / total) * 100
            },
            stby: {
                count: stats.stby,
                percentage: (stats.stby / total) * 100
            },
            off: {
                count: stats.off,
                percentage: (stats.off / total) * 100
            }
        };
    };

    const getSrrTooltip = (code, passenger) => {
        if (code.startsWith('BAG')) {
            const baggage = passenger.baggageList[parseInt(code.replace('BAG', '')) - 1];
            return baggage ? `Weight: ${baggage.weight}kg\nID: ${baggage.id}` : 'No baggage details';
        }
        if (code === 'COM') {
            const comments = passenger.comments;
            return comments && comments.length > 0
                ? comments.map(com =>
                    `${com.text}\nAdded by: ${com.addedBy}\nDate: ${com.date}`
                ).join('\n\n')
                : 'No comments';
        }
        if (code === 'DOCS') {
            return passenger.documentType
                ? `Document: ${passenger.documentType}\nCitizenship: ${passenger.citizenship}`
                : 'No document details';
        }
        return 'No additional information';
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
                <div className="stats-container">
                    <div className="stats-header">
                        <div className="stats-title">
                            <h3>Total Passengers: {passengers.length}</h3>
                        </div>
                        <div className="stats-legend">
                            <div className="legend-item">
                                <span className="legend-color none"></span>
                                <span>Not Checked ({getPassengerStats().none.count})</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-color acc"></span>
                                <span>Accepted ({getPassengerStats().acc.count})</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-color stby"></span>
                                <span>Standby ({getPassengerStats().stby.count})</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-color off"></span>
                                <span>Offloaded ({getPassengerStats().off.count})</span>
                            </div>
                        </div>
                    </div>
                    <div className="single-progress-bar">
                        <div
                            className="progress-segment none"
                            style={{ width: `${getPassengerStats().none.percentage}%` }}
                            title={`Not Checked: ${getPassengerStats().none.count}`}
                        >
                            {getPassengerStats().none.percentage > 10 && getPassengerStats().none.count}
                        </div>
                        <div
                            className="progress-segment acc"
                            style={{ width: `${getPassengerStats().acc.percentage}%` }}
                            title={`Accepted: ${getPassengerStats().acc.count}`}
                        >
                            {getPassengerStats().acc.percentage > 10 && getPassengerStats().acc.count}
                        </div>
                        <div
                            className="progress-segment stby"
                            style={{ width: `${getPassengerStats().stby.percentage}%` }}
                            title={`Standby: ${getPassengerStats().stby.count}`}
                        >
                            {getPassengerStats().stby.percentage > 10 && getPassengerStats().stby.count}
                        </div>
                        <div
                            className="progress-segment off"
                            style={{ width: `${getPassengerStats().off.percentage}%` }}
                            title={`Offloaded: ${getPassengerStats().off.count}`}
                        >
                            {getPassengerStats().off.percentage > 10 && getPassengerStats().off.count}
                        </div>
                    </div>
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
                                                        <span
                                                            key={idx}
                                                            className={`srr-code ${code.toLowerCase()}`}
                                                            data-tooltip={getSrrTooltip(code, passenger)}
                                                        >
                                                            {code}
                                                        </span>
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