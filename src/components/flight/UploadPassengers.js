import React, { useState } from 'react';
import { useParams } from 'react-router-dom';  // Importuj useParams
import axios from '../../api/axiosConfig';

const UploadPassengers = () => {
    const { flightId } = useParams(); // Pobierz flightId z URL
    const [file, setFile] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

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
        }
    };

    return (
        <div>
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
                <button type="submit">Upload</button>
            </form>
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        </div>
    );
};

export default UploadPassengers;