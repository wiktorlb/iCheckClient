import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import './style.css';

const { countries } = require('countries-list');

const CheckinSite = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [selectedPassenger, setSelectedPassenger] = useState(null);  // Zmieniamy na pojedynczego pasażera
    const [showModal, setShowModal] = useState(false);
    const [countryNames, setCountryNames] = useState([]);
    const [baggageWeight, setBaggageWeight] = useState('');

    useEffect(() => {
        const countryNamesArray = Object.values(countries).map(country => country.name).sort();
        setCountryNames(countryNamesArray);
    }, []);

    const handleOpenModal = async (passenger) => {
        try {
            const response = await axiosInstance.get(`/api/passengers/${passenger.id}`);
            setSelectedPassenger(response.data);
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
        setSelectedPassenger(prevState => ({
            ...prevState,
            [field]: event.target.value
        }));
    };
    const handleUpdateStatus = async (status) => {
        if (!selectedPassenger) return;

        try {
            const response = await axiosInstance.put(`/api/passengers/${selectedPassenger.id}/status`, JSON.stringify(status), {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwt')}`,
                },
            });

            // Aktualizacja statusu pasażera w stanie
            const updatedPassengers = location.state.passengers.map((p) =>
                p.id === selectedPassenger.id ? { ...p, status } : p
            );

            setSelectedPassenger((prev) => ({ ...prev, status })); // Aktualizacja wybranego pasażera
            location.state.passengers = updatedPassengers; // Aktualizacja listy pasażerów w stanie

        } catch (error) {
            console.error('Error updating passenger status:', error.response ? error.response.data : error.message);
        }
    };
    const handleSavePassenger = async () => {
        const jwt = localStorage.getItem('jwt');
        if (!jwt) {
            console.error('No JWT token found');
            return;
        }

        try {
            const response = await axiosInstance.put(`/api/passengers/${selectedPassenger.id}`, selectedPassenger, {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                },
            });
            console.log('Response from API:', response.data);
            setSelectedPassenger(response.data);  // Zaktualizuj dane pasażera
            handleCloseModal();
        } catch (error) {
            console.error('Error updating passenger:', error);
        }
    };

    const handleSelectPassenger = (passengerId) => {
        setSelectedPassenger(location.state?.passengers.find(p => p.id === passengerId));  // Ustawiamy pojedynczego pasażera
    };

    const handleAddBaggage = () => {
        if (!selectedPassenger) {
            console.log("No passenger selected for baggage.");
            return;
        }
        // Możesz dodać logikę do dodawania bagażu, np. przekierowanie do formularza bagażu
        console.log(`Adding baggage for ${selectedPassenger.name}`);
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
                                <th>Surname</th>
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
                                            type="radio"  // Zmienia typ na radio, aby można było zaznaczyć tylko jeden
                                            checked={selectedPassenger?.id === passenger.id}
                                            onChange={() => handleSelectPassenger(passenger.id)}
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

                <div className="actions-container">
                    <div className="left-actions">
                        <button onClick={() => console.log("Printing...")}>Print</button>
                        <button onClick={() => navigate(-1)}>Back</button>
                    </div>
                    <div className="right-actions">
                        <button disabled={!selectedPassenger}
                                onClick={() => handleOpenModal(selectedPassenger)}>API</button>
                        <button disabled={!selectedPassenger}>Seat</button>
                        <button disabled={!selectedPassenger} onClick={() => handleUpdateStatus('ACC')}>Accept</button>
                        <button disabled={!selectedPassenger} onClick={() => handleUpdateStatus('STBY')}>Standby</button>
                        <button disabled={!selectedPassenger} onClick={() => handleUpdateStatus('OFF')}>Offload</button>
                    </div>
                </div>

                <div className="baggage-form">
                    <input
                        type="number"
                        placeholder="Enter baggage weight"
                        value={baggageWeight}
                        onChange={(e) => setBaggageWeight(e.target.value)}
                    />
                    <button onClick={handleAddBaggage} disabled={!selectedPassenger}>Add Baggage</button>
                </div>
            </main>

            {/* Modal z danymi pasażera */}
            {showModal && selectedPassenger && (
                <div className="modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Advance Passenger Information</h2>
                            <button className="close-btn" onClick={handleCloseModal}>X</button>
                        </div>
                        <label>Name: <input type="text" value={selectedPassenger.name} onChange={handleInputChange('name')} /></label>
                        <label>Surname: <input type="text" value={selectedPassenger.surname} onChange={handleInputChange('surname')} /></label>

                        <label>Gender:
                            <select value={selectedPassenger.gender} onChange={handleInputChange('gender')}>
                                <option value="MR">MR</option>
                                <option value="MRS">MRS</option>
                                <option value="CHLD">CHLD</option>
                            </select>
                        </label>

                        <label>Date of Birth: <input type="date" value={selectedPassenger.dateOfBirth || ''} onChange={handleInputChange('dateOfBirth')} /></label>

                        <label>Citizenship:
                            <select value={selectedPassenger.citizenship || ''} onChange={handleInputChange('citizenship')}>
                                {countryNames.map((country) => (
                                    <option key={country} value={country}>{country}</option>
                                ))}
                            </select>
                        </label>

                        <label>Document Type:
                            <select value={selectedPassenger.documentType || ''} onChange={handleInputChange('documentType')}>
                                <option value="P">P</option>
                                <option value="ID">ID</option>
                            </select>
                        </label>

                        <label>Serial Name: <input type="text" value={selectedPassenger.serialName || ''} onChange={handleInputChange('serialName')} /></label>
                        <label>Valid Until: <input type="date" value={selectedPassenger.validUntil || ''} onChange={handleInputChange('validUntil')} /></label>

                        <label>Issue Country:
                            <select value={selectedPassenger.issueCountry || ''} onChange={handleInputChange('issueCountry')}>
                                {countryNames.map((country) => (
                                    <option key={country} value={country}>{country}</option>
                                ))}
                            </select>
                        </label>

                        <button onClick={handleSavePassenger}>Save</button>
                    </div>
                </div>
            )}
        </section>
    );
};

export default CheckinSite;