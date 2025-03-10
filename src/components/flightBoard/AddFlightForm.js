import React, { useState, useEffect } from 'react';
import axios from '../../api/axiosConfig';

const AddFlightForm = () => {
    const [planes, setPlanes] = useState([]);
    const [flightData, setFlightData] = useState({
        flightNumber: '',
        destination: '',
        departureDate: '',
        departureTime: '',
        planeId: '',
        status: '', // Dodanie statusu
        aircraftId: 'SP-LWC', // Ustawienie domyślnej wartości dla aircraftId
    });
    const [destinations, setDestinations] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Fetch destinations (assuming this endpoint exists in the backend)
    useEffect(() => {
        const fetchDestinations = async () => {
            try {
                const response = await axios.get('/api/destinations');  // Endpoint should be updated as per your API
                setDestinations(response.data);
            } catch (error) {
                console.error('Error fetching destinations:', error);
            }
        };

        fetchDestinations();
    }, []);

    // Fetch planes (assuming this endpoint exists in the backend)
    useEffect(() => {
        const fetchPlanes = async () => {
            try {
                const response = await axios.get('/api/planes');  // Endpoint for fetching planes
                setPlanes(response.data);
            } catch (error) {
                console.error('Error fetching planes:', error);
            }
        };

        fetchPlanes();
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
            planeId: flightData.planeId,
            tatus: flightData.status ,// Dodanie statusu lotu
            aircraftId: 'SP-LWC', // Ustawienie domyślnej wartości dla aircraftId
        };

        try {
            const response = await axios.post('/api/flights/add-flight', flightPayload);  // Update endpoint as needed
            setSuccessMessage('Flight added successfully!');
            setFlightData({
                flightNumber: '',
                destination: '',
                departureDate: '',
                departureTime: '',
                planeId: '',
                status: '',
                aircraftId: 'SP-LWC', // Ustawienie domyślnej wartości dla aircraftId // Resetowanie statusu
            });
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
                <div>
                    <label>Plane</label>
                    <select
                        name="planeId"
                        value={flightData.planeId}
                        onChange={handleChange}
                        required
                    >
                        <option value="" disabled>Select a plane</option>
                        {planes.map((plane) => (
                            <option key={plane.id} value={plane.id}>
                                {plane.model} ({plane.id})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Flight Status</label>
                    <select
                        name="status"
                        value={flightData.status}
                        onChange={handleChange}
                        required
                    >
                        <option value="" disabled>Select a status</option>
                        <option value="PREPARE">Prepare</option>
                        <option value="OPEN">Open</option>
                        <option value="CLOSED">Closed</option>
                        <option value="FINALIZED">Finalized</option>
                    </select>
                </div>
                <button type="submit">Add Flight</button>
            </form>
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        </div>
    );
};

export default AddFlightForm;
