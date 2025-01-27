import React, { useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import { jwtDecode } from 'jwt-decode'; // Zmieniony import
import "./style.css";

const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/api/auth/login', {
        username,
        password,
      });

      if (response.status === 200) {
        const { token } = response.data; // Pobierz token z odpowiedzi
        localStorage.setItem('jwt', token); // Zapisz token w localStorage
        console.log('Token saved in localStorage:', token);

        // Dekodowanie tokena
        const decodedToken = jwtDecode(token); // Użyj jwtDecode
        console.log('Decoded Token:', decodedToken);

        // Wyświetlenie ról użytkownika w konsoli
        if (decodedToken && decodedToken.role) {
          console.log('User Roles:', decodedToken.role);  // Pokaż role użytkownika w konsoli
        }

        onLogin(); // Przekierowanie po zalogowaniu
      }
    } catch (error) {
      setErrorMessage('Invalid credentials or server error');
      console.error('Login error:', error.response?.data || error.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">iCheck</h2>
        <form onSubmit={handleLogin} className="login-form">
          {/* Select Company */}
{/*           <select className="login-input form-select" required>
            <option value="Choose">Choose Company</option>
            <option value="LSAS">LSAS</option>
            <option value="Ryanair">Ryanair</option>
          </select> */}
          {/* Username Input */}
          <input
            className="login-input"
            type="text"
            placeholder="ID Number"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          {/* Password Input */}
          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {/* Submit Button */}
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
        {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      </div>
    </div>
  );
};

export default LoginForm;