import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../../api/axiosConfig';
import "./style.css";

const UploadPassengers = () => {
    const { flightId } = useParams();
    const [file, setFile] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false); // Dodano stan ładowania

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            setErrorMessage('Please select a file.');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        setLoading(true); // Włączenie ekranu ładowania

        try {
            const response = await axios.post(`/api/passengers/${flightId}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setSuccessMessage(response.data);
            setErrorMessage('');
        } catch (error) {
            setErrorMessage('An error occurred while uploading the file.');
            console.error(error);
        } finally {
            setLoading(false); // Wyłączenie ekranu ładowania
        }
    };

    return (
        <div>
            {loading && (
                <div className="loading-screen">
                    <div className="spinner"></div>
                </div>
            )}
            <h2>Upload Passengers for Flight {flightId}</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="file">Select a text file:</label>
                    <input
                        type="file"
                        id="file"
                        accept=".txt"
                        onChange={handleFileChange}
                        required
                    />
                </div>
                <button type="submit" disabled={loading}>Upload</button>
            </form>
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        </div>
    );
};

export default UploadPassengers;