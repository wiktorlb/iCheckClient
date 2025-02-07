/* import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import FlightBoard from './components/flightBoard/FlightBoard';
import AddFlightForm from './components/flightBoard/AddFlightForm';
import RegisterForm from './components/RegisterForm';
import Header from './components/header/Header';
import 'bootstrap/dist/css/bootstrap.min.css';
import FlightPassengers from './components/flight/FlightPassengers';
import UploadPassengers from './components/flight/UploadPassengers';
import UserManagement from './components/UserManagement';
import CheckinSite from './components/flight/CheckinSite'; */

import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import FlightBoard from './components/flightBoard/FlightBoard';
import AddFlightForm from './components/flightBoard/AddFlightForm';
import RegisterForm from './components/RegisterForm';
import Header from './components/header/Header';
import 'bootstrap/dist/css/bootstrap.min.css';
import FlightPassengers from './components/flight/FlightPassengers';
import UploadPassengers from './components/flight/UploadPassengers/UploadPassengers';
import UserManagement from './components/UserManagement';
import CheckinSite from './components/flight/CheckinSite/CheckinSite';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Sprawdzamy token po załadowaniu komponentu
  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (token) {
      setIsLoggedIn(true);

      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setUserRole(decodedToken.role); // Ustawiamy rolę na podstawie tokenu
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []); // Uruchamiamy tylko raz, przy pierwszym renderze

  // Funkcja logowania
  const handleLogin = () => {
    setIsLoggedIn(true);
    // Pobieranie roli z tokenu po zalogowaniu
    const token = localStorage.getItem('jwt');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setUserRole(decodedToken.role);
      } catch (error) {
        console.error("Error decoding token after login:", error);
      }
    }
  };

  // Funkcja wylogowania
  const handleLogout = () => {
    localStorage.removeItem('jwt');
    setIsLoggedIn(false);
    setUserRole(null); // Reset roli po wylogowaniu
  };

  return (
    <div>
      {isLoggedIn && <Header onLogout={handleLogout} />}

      <Routes>
        {/* Ścieżka logowania */}
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/flightboard" /> : <LoginForm onLogin={handleLogin} />}
        />

        {/* Ścieżka rejestracji */}
        <Route
          path="/register"
          element={
            isLoggedIn && userRole === 'ADMIN' ? (
              <RegisterForm />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Ścieżka do FlightBoard */}
        <Route
          path="/flightboard"
          element={
            isLoggedIn && (userRole === 'ADMIN' || userRole === 'USER' || userRole === 'LEADER') ? (
              <FlightBoard />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Dodanie Rejsu (dostępne tylko dla zalogowanych użytkowników) */}
        <Route
          path="/add-flight"
          element={
            isLoggedIn && (userRole === 'ADMIN' ||  userRole === 'LEADER') ? (
              <AddFlightForm />
            ) : (
              <Navigate to="/flightboard" />
            )
          }
        />

        {/* Ścieżka do pasażerów danego lotu */}
        <Route
          path="/flights/:flightId/passengers"
          element={
            isLoggedIn && (userRole === 'ADMIN' || userRole === 'USER' || userRole === 'LEADER') ? (
              <FlightPassengers />
            ) : (
              <Navigate to="/flightboard" />
            )
          }
        />

        {/* Ścieżka do dodania pasażerów */}
        <Route
          path="/flights/:flightId/upload-passengers"
          element={
            isLoggedIn && (userRole === 'ADMIN' || userRole === 'LEADER') ? (
              <UploadPassengers />
            ) : (
              <Navigate to="/flightboard" />
            )
          }
        />

        {/* Ścieżka do strony zarządzania użytkownikami */}
        <Route
          path="/management"
          element={
            isLoggedIn && userRole === 'ADMIN' ? (
              <UserManagement />
            ) : (
              <Navigate to="/flightboard" />
            )
          }
        />
        {/* Ścieżka do strony odprawy pasażerów */}
        <Route
          path="/checkin"
          element={isLoggedIn ? <CheckinSite /> : <Navigate to="/login" />}
        />

        {/* Domyślna ścieżka, przekierowuje do logowania */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
};

export default App;