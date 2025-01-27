import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom'; // Zaktualizowane importy
import LoginForm from './components/LoginForm';
import FlightBoard from './components/flightBoard/FlightBoard';
import AddFlightForm from './components/flightBoard/AddFlightForm';
import RegisterForm from './components/RegisterForm'; // Formularz rejestracji
import Header from './components/header/Header'; // Importowanie Header
import 'bootstrap/dist/css/bootstrap.min.css';
import FlightPassengers from './components/flight/FlightPassengers';
import UploadPassengers from './components/flight/UploadPassengers';
import UserManagement from './components/UserManagement';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Sprawdzanie, czy token istnieje w localStorage
  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (token) {
      setIsLoggedIn(true); // Użytkownik jest zalogowany, jeśli token jest dostępny
    }
  }, []);

  // Funkcja logowania, ustawia stan na true
  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  // Funkcja wylogowania, ustawia stan na false
  const handleLogout = () => {
    localStorage.removeItem('jwt'); // Usuwanie tokenu z localStorage
    setIsLoggedIn(false); // Ustawienie stanu na false
  };

  return (
    <div>
      {isLoggedIn && <Header onLogout={handleLogout} />} {/* Wyświetlanie Header tylko, gdy użytkownik jest zalogowany */}

      <Routes>
        {/* Ścieżka logowania WSZYSCY*/}
        <Route path="/login" element={isLoggedIn ? <Navigate to="/flightboard" /> : <LoginForm onLogin={handleLogin} />} />

        {/* Ścieżka rejestracji */}
        <Route path="/register" element={isLoggedIn ? <RegisterForm /> : <RegisterForm />} />

        {/* Ścieżka do FlightBoard */}
        <Route path="/flightboard" element={isLoggedIn ? <FlightBoard onLogout={handleLogout} /> : <Navigate to="/login" />} />

        {/* Dodanie Rejsu (dostępne tylko dla zalogowanych użytkowników) */}
        <Route path="/add-flight" element={isLoggedIn ? <AddFlightForm /> : <Navigate to="/login" />} />

        {/* Ścieżka dla pasażerów danego lotu */}
        {/* <Route path="/flights/:id/passengers" element={isLoggedIn ? <FlightPassengers /> : <Navigate to="/login" />} /> */}
        <Route path="/flights/:flightId/passengers" element={isLoggedIn ? <FlightPassengers /> : <Navigate to="/login" />} />

        {/* Ścieżka do dodania pasażerów */}
        <Route path="/flights/:flightId/upload-passengers" element={isLoggedIn ? <UploadPassengers /> : <Navigate to="/login" />} />

        {/* Ścieżka do strony zarządzania */}
        <Route path="/management" element={isLoggedIn ? <UserManagement /> : <Navigate to="/login" />} />

        {/* Domyślna ścieżka, przekierowuje do logowania */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
};

export default App;