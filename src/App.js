import React, { useState, useEffect, useCallback } from 'react';

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
import Boarding from './components/flight/Boarding/Boarding';
import BaggageList from './components/flight/BaggageList/BaggageList';
import PassengerList from './components/flight/PassengerList/PassengerList';
/* import Users from './components/UserManagement/Users'; */

const parseStoredAuth = () => {
  const token = localStorage.getItem('jwt');
  if (!token) {
    return { loggedIn: false, role: null };
  }

  try {
    const decodedToken = JSON.parse(atob(token.split('.')[1]));
    const role = decodedToken?.role || decodedToken?.roles?.find?.(() => true) || null;
    return { loggedIn: true, role };
  } catch (error) {
    console.error('Error decoding token:', error);
    return { loggedIn: false, role: null };
  }
};

const App = () => {
  const initialAuth = parseStoredAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(initialAuth.loggedIn);
  const [userRole, setUserRole] = useState(initialAuth.role);

  const syncAuthFromStorage = useCallback(() => {
    const { loggedIn, role } = parseStoredAuth();
    setIsLoggedIn(loggedIn);
    setUserRole(role);
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === 'jwt') {
        syncAuthFromStorage();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [syncAuthFromStorage]);

  const handleLogin = () => {
    syncAuthFromStorage();
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    setIsLoggedIn(false);
    setUserRole(null);
  };

  return (
    <div>
      {isLoggedIn && <Header onLogout={handleLogout} />}

      <Routes>
        {/* Login route */}

        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/flightboard" /> : <LoginForm onLogin={handleLogin} />}
        />

        {/* Registration route */}

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

        {/* FlightBoard route */}

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

        {/* Add flight (available to logged-in users) */}

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

        {/* Passengers for a specific flight */}

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

        {/* Upload passengers for a flight */}

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

        {/* User management page */}

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
        {/* Check-in page */}

        <Route
          path="/checkin"
          element={isLoggedIn ? <CheckinSite /> : <Navigate to="/login" />}
        />

        {/* Boarding page */}

        <Route
          path="/flights/:flightId/boarding"
          element={
            isLoggedIn && (userRole === 'ADMIN' || userRole === 'USER' || userRole === 'LEADER') ? (
              <Boarding />
            ) : (
              <Navigate to="/flightboard" />
            )
          }
        />

        {/* Baggage list */}

        <Route
          path="/flights/:flightId/baggage-list"
          element={
            isLoggedIn && (userRole === 'ADMIN' || userRole === 'USER' || userRole === 'LEADER') ? (
              <BaggageList />
            ) : (
              <Navigate to="/flightboard" />
            )
          }
        />

        {/* Passenger list (API) */}

        <Route
          path="/flights/:flightId/passenger-list"
          element={
            isLoggedIn && (userRole === 'ADMIN' || userRole === 'USER' || userRole === 'LEADER') ? (
              <PassengerList />
            ) : (
              <Navigate to="/flightboard" />
            )
          }
        />

        {/* Default route redirects to login */}

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
};

export default App;