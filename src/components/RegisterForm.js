import React, { useState } from 'react';
import axiosInstance from '../api/axiosConfig';

const RegisterForm = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    // Funkcja obsługująca wysyłanie formularza
    const handleSubmit = async (e) => {
        e.preventDefault();

        const user = {
            username: username,
            email: email,
            password: password,
        };

        try {
            // Wysyłanie danych do backendu
            const response = await axiosInstance.post('/api/auth/register', user);
            if (response.status === 200) {
                setSuccessMessage('User registered successfully!');
                setErrorMessage('');
                // Resetowanie pól formularza
                setUsername('');
                setEmail('');
                setPassword('');
            } else {
                setErrorMessage('Unexpected response from the server.');
            }
        } catch (error) {
            console.error('Error registering user:', error);
            setErrorMessage(error.response?.data?.message || 'Error registering user');
            setSuccessMessage('');
        }
    };

    return (
        <div>
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Register</button>
            </form>
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        </div>
    );
};

export default RegisterForm;