import React, { useState, useEffect } from 'react';
import axios from '../../api/axiosConfig';
import './AddFlightForm.css';

const statusOptions = [
    { value: 'PREPARE', label: 'Prepare' },
    { value: 'OPEN', label: 'Open' },
    { value: 'CLOSED', label: 'Closed' },
    { value: 'FINALIZED', label: 'Finalized' }
];

const initialFlightData = {
    flightNumber: '',
    destination: '',
    departureDate: '',
    departureTime: '',
    planeId: '',
    status: '',
    aircraftId: 'SP-LWC'
};

const AddFlightForm = () => {
    const [planes, setPlanes] = useState([]);
    const [flightData, setFlightData] = useState(initialFlightData);
    const [destinations, setDestinations] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

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
        setSuccessMessage('');
        setErrorMessage('');
        setSubmitting(true);
        const flightPayload = {
            flightNumber: flightData.flightNumber,
            route: `KTW - ${flightData.destination}`, // Route includes destination ID
            departureDate: flightData.departureDate,
            departureTime: flightData.departureTime,
            planeId: flightData.planeId,
            status: flightData.status,
            aircraftId: flightData.aircraftId,
        };

        try {
            const response = await axios.post('/api/flights/add-flight', flightPayload);  // Update endpoint as needed
            setSuccessMessage('Flight added successfully!');
            setFlightData(initialFlightData);
        } catch (error) {
            setErrorMessage('An error occurred while adding the flight.');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReset = () => {
        if (submitting) return;
        setFlightData(initialFlightData);
    };

    return (
        <section className="add-flight-page">
            <div className="add-flight-card">
                <header className="add-flight-head">
                    <div>
                        <p className="eyebrow">Operations</p>
                        <h1>Add new flight</h1>
                        <p>Create a new departure and keep the board in sync.</p>
                    </div>
                    <div className="add-flight-status">
                        <span className="label">Default aircraft</span>
                        <strong>{flightData.aircraftId}</strong>
                    </div>
                </header>

                <form className="add-flight-form" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <label className="form-field">
                            <span>Flight number</span>
                            <input
                                type="text"
                                name="flightNumber"
                                value={flightData.flightNumber}
                                onChange={handleChange}
                                placeholder="e.g. LO123"
                                required
                            />
                        </label>

                        <label className="form-field">
                            <span>Destination</span>
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
                        </label>

                        <label className="form-field">
                            <span>Departure date</span>
                            <input
                                type="date"
                                name="departureDate"
                                value={flightData.departureDate}
                                onChange={handleChange}
                                required
                            />
                        </label>

                        <label className="form-field">
                            <span>Departure time</span>
                            <input
                                type="time"
                                name="departureTime"
                                value={flightData.departureTime}
                                onChange={handleChange}
                                required
                            />
                        </label>

                        <label className="form-field">
                            <span>Aircraft</span>
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
                        </label>

                        <label className="form-field">
                            <span>Flight status</span>
                            <select
                                name="status"
                                value={flightData.status}
                                onChange={handleChange}
                                required
                            >
                                <option value="" disabled>Select status</option>
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="primary-action" disabled={submitting}>
                            {submitting ? 'Saving flight…' : 'Add flight'}
                        </button>
                        <button
                            type="button"
                            className="ghost-action"
                            onClick={handleReset}
                            disabled={submitting}
                        >
                            Clear form
                        </button>
                    </div>

                    <div className="form-messages">
                        {successMessage && <span className="success-banner">{successMessage}</span>}
                        {errorMessage && <span className="error-banner">{errorMessage}</span>}
                    </div>
                </form>
            </div>
        </section>
    );
};

export default AddFlightForm;
