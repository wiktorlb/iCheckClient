import React, { useState, useEffect } from 'react';
import axios from '../../api/axiosConfig';

const AddFlightForm = () => {
    const [flightData, setFlightData] = useState({
        flightNumber: '',
        destination: '',
        departureDate: '',
        departureTime: '',
    });
    const [destinations, setDestinations] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const fetchDestinations = async () => {
            try {
                const response = await axios.get('/api/flights/destinations');
                setDestinations(response.data);
            } catch (error) {
                console.error('Error fetching destinations:', error);
            }
        };

        fetchDestinations();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFlightData({ ...flightData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const flightPayload = {
            flightNumber: flightData.flightNumber,
            route: `KTW - ${flightData.destination}`, // Route includes destination ID
            departureDate: flightData.departureDate,
            departureTime: flightData.departureTime,
        };

        try {
            const response = await axios.post('/api/flights', flightPayload);
            setSuccessMessage('Flight added successfully!');
            setFlightData({ flightNumber: '', destination: '', departureDate: '', departureTime: '' });
        } catch (error) {
            setErrorMessage('An error occurred while adding the flight.');
            console.error(error);
        }
    };

    return (
        <div>
            <h2>Add Flight</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Flight Number</label>
                    <input
                        type="text"
                        name="flightNumber"
                        value={flightData.flightNumber}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Destination</label>
                    <select
                        name="destination"
                        value={flightData.destination}
                        onChange={handleChange}
                        required
                    >
                        <option value="" disabled>Select a destination</option>
                        {destinations.map((dest) => (
                            <option key={dest.id} value={dest.id}>
                                {dest.name} ({dest.id})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Departure Date</label>
                    <input
                        type="date"
                        name="departureDate"
                        value={flightData.departureDate}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Departure Time</label>
                    <input
                        type="time"
                        name="departureTime"
                        value={flightData.departureTime}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit">Add Flight</button>
            </form>
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        </div>
    );
};

export default AddFlightForm;