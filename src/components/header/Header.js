import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Button from "react-bootstrap/Button";
import "./style.css";

const Header = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // Wywołanie funkcji przekazanej jako prop (onLogout) z App.js
    onLogout();
    navigate('/'); // Po wylogowaniu przekierowanie na stronę logowania
  };

  // Extract flightId from the current path
  const getFlightIdFromPath = (path) => {
    const match = path.match(/\/flights\/([^\/]+)/);
    return match ? match[1] : null;
  };

  const currentFlightId = getFlightIdFromPath(location.pathname);
  const isFlightPage = currentFlightId !== null;

  return (
    <header className="header">
      <div className="logo">iCheck</div>
      <nav className="nav">
        <Link to="/management">USERS</Link>
        <Link to="/flightboard">FLIGHTS</Link>
        <a href="#">CHECK-IN</a>
        {isFlightPage ? (
          <Link to={`/flights/${currentFlightId}/boarding`}>BOARDING</Link>
        ) : (
          <a href="#">BOARDING</a>
        )}
        <a href="#">SORTATION</a>
        <a href="#" className="logout-link" onClick={handleLogout}> LOGOUT </a>
      </nav>
    </header>
  );
};

export default Header;