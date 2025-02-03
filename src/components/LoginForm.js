import React, { useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import { jwtDecode } from 'jwt-decode';
import "./style.css";

const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false); // Dodano stan ładowania

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); // Włączenie ekranu ładowania
    try {
      const response = await axiosInstance.post('/api/auth/login', {
        username,
        password,
      });

      if (response.status === 200) {
        const { token } = response.data;
        localStorage.setItem('jwt', token);
        console.log('Token saved in localStorage:', token);

        const decodedToken = jwtDecode(token);
        console.log('Decoded Token:', decodedToken);

        if (decodedToken && decodedToken.role) {
          console.log('User Roles:', decodedToken.role);
        }

        onLogin();
      }
    } catch (error) {
      setErrorMessage('Invalid credentials or server error');
      console.error('Login error:', error.response?.data || error.message);
    } finally {
      setLoading(false); // Wyłączenie ekranu ładowania
    }
  };

  return (
    <div className="login-container">
      {loading && (
        <div className="loading-screen">
          <div className="spinner"></div>
        </div>
      )}
      <div className="login-box">
        <h2 className="login-title">iCheck</h2>
        <form onSubmit={handleLogin} className="login-form">
          <input
            className="login-input"
            type="text"
            placeholder="ID Number"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="login-button" disabled={loading}>
            Login
          </button>
        </form>
        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      </div>
    </div>
  );
};

export default LoginForm;