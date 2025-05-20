import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import "./style.css";

const Header = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showSortationMenu, setShowSortationMenu] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

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

  // Check if current path matches the navigation item
  const isActive = (path) => {
    if (path === '/flightboard') {
      return location.pathname === '/flightboard';
    }
    if (path === '/checkin') {
      return location.pathname.includes('/flights/') && location.pathname.includes('/passengers');
    }
    if (path === '/boarding') {
      return location.pathname.includes('/boarding');
    }
    return false;
  };

  const handleGenerateBaggageList = () => {
    if (!isFlightPage) {
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 30000);
      return;
    }

    const currentFlightId = location.pathname.split('/')[2];
    navigate(`/flights/${currentFlightId}/baggage-list`);
  };

  return (
    <header className="header">
      <div className="logo">iCheck</div>
      <nav className="nav">
        <Link to="/management" className={isActive('/management') ? 'active' : ''}>USERS</Link>
        <Link to="/flightboard" className={isActive('/flightboard') ? 'active' : ''}>FLIGHTS</Link>
        <Link to="/checkin" className={isActive('/checkin') ? 'active' : ''}>CHECK-IN</Link>
        {isFlightPage ? (
          <Link to={`/flights/${currentFlightId}/boarding`} className={isActive('/boarding') ? 'active' : ''}>BOARDING</Link>
        ) : (
          <a href="#" className={isActive('/boarding') ? 'active' : ''}>BOARDING</a>
        )}
        <div
          className="nav-item-container"
          onMouseEnter={() => setShowSortationMenu(true)}
          onMouseLeave={() => setShowSortationMenu(false)}
        >
          <span className="nav-link">SORTATION</span>
          {showSortationMenu && (
            <div className="dropdown-menu">
              <button onClick={handleGenerateBaggageList}>Generate Baggage List</button>
            </div>
          )}
          {showTooltip && (
            <div className="tooltip">
              Please select a flight first
            </div>
          )}
        </div>
        <a href="#" className="logout-link" onClick={handleLogout}> LOGOUT </a>
      </nav>
    </header>
  );
};

export default Header;