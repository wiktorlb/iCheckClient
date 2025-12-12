import React, { useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import { jwtDecode } from 'jwt-decode';
import "./style.css";

const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {loading && (
        <div className="loading-screen">
          <div className="spinner"></div>
        </div>
      )}
      <div className="hero-image" style={{ backgroundImage: "url('/loginPicture.jpg')" }} />
      <div className="auth-panel">
        <div className="auth-content">
          <h1 className="brand-logo">iCheck</h1>
          <form onSubmit={handleLogin} className="auth-form">
            <label className="auth-field">
              <span>Login</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>
            <label className="auth-field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <button type="submit" className="auth-button" disabled={loading}>
              <span>Log in</span>
              <span className="arrow">→</span>
            </button>
          </form>
          {errorMessage && <p className="auth-error">{errorMessage}</p>}
        </div>
      </div>
    </div>
  );
};

export default LoginForm;