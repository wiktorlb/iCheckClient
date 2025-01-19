import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom'; // Zaktualizowane importy
import LoginForm from './components/LoginForm';
import FlightBoard from './components/flightBoard/FlightBoard';
import AddFlightForm from './components/flightBoard/AddFlightForm';
import RegisterForm from './components/RegisterForm'; // Formularz rejestracji
import Header from './components/header/Header'; // Importowanie Header
import 'bootstrap/dist/css/bootstrap.min.css';
import Management from './components/management/Management'; // Importowanie komponentu Management
import FlightCheckin from './components/flight/FlightCheckin';

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
        {/* Ścieżka logowania */}
        <Route path="/login" element={isLoggedIn ? <Navigate to="/flightboard" /> : <LoginForm onLogin={handleLogin} />} />

        {/* Ścieżka rejestracji */}
        <Route path="/register" element={isLoggedIn ? <RegisterForm /> : <RegisterForm />} />

        {/* Ścieżka do FlightBoard */}
        <Route path="/flightboard" element={isLoggedIn ? <FlightBoard onLogout={handleLogout} /> : <Navigate to="/login" />} />

        {/* Dodanie Rejsu (dostępne tylko dla zalogowanych użytkowników) */}
        <Route path="/add-flight" element={isLoggedIn ? <AddFlightForm /> : <Navigate to="/login" />} />

        {/* Odprawa pasażerów */}
        <Route path="/checkin" element={isLoggedIn ? <FlightCheckin /> : <Navigate to="/login" />} />

        {/* Ścieżka do strony zarządzania */}
        <Route path="/management" element={isLoggedIn ? <Management /> : <Navigate to="/login" />} />

        {/* Domyślna ścieżka, przekierowuje do logowania */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
};

export default App;