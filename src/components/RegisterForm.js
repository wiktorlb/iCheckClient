import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import './style.css';

const generateUsername = () => String(Math.floor(10000 + Math.random() * 90000));

const RegisterForm = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState(generateUsername());
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setUsername(generateUsername());
        setEmail('');
        setPassword('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setSuccessMessage('');
        setErrorMessage('');

        const user = {
            username,
            email,
            password,
        };

        try {
            const response = await axiosInstance.post('/api/auth/register', user);
            if (response.status === 200) {
                const { message, username: createdUsername } = response.data || {};
                setSuccessMessage(
                    message || `User registered successfully. Login: ${createdUsername || user.username}`
                );
                resetForm();
            } else {
                setErrorMessage('Unexpected response from the server.');
            }
        } catch (error) {
            console.error('Error registering user:', error);
            const backendMessage = error.response?.data;
            setErrorMessage(
                typeof backendMessage === 'string'
                    ? backendMessage
                    : backendMessage?.message || 'Error registering user.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="auth-page">
            {loading && (
                <div className="loading-screen">
                    <div className="spinner"></div>
                </div>
            )}
            <div className="hero-image" style={{ backgroundImage: "url('/loginPicture.jpg')" }} />
            <div className="auth-panel">
                <div className="auth-content">
                    <p className="eyebrow">Administration</p>
                    <h1>Create staff account</h1>
                    <p className="subtext">Generate a five-digit username, set contact email, and choose a temporary password.</p>

                    {successMessage && <div className="inline-banner success">{successMessage}</div>}
                    {errorMessage && <div className="inline-banner error">{errorMessage}</div>}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <label className="auth-field">
                            <span>Username (auto)</span>
                            <div className="input-with-button">
                                <input type="text" value={username} readOnly />
                                <button
                                    type="button"
                                    className="mini-button"
                                    onClick={() => setUsername(generateUsername())}
                                    disabled={loading}
                                >
                                    Refresh
                                </button>
                            </div>
                        </label>

                        <label className="auth-field">
                            <span>Email</span>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </label>
                        <label className="auth-field">
                            <span>Temporary password</span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={8}
                                required
                            />
                        </label>
                        <div className="auth-button-container">
                            <button type="submit" className="auth-button primary" disabled={loading}>
                                Create account
                            </button>
                            <button
                                type="button"
                                className="auth-button ghost"
                                onClick={() => navigate('/management')}
                                disabled={loading}
                            >
                                Back to list
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
};

export default RegisterForm;