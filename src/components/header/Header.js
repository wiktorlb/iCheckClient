import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, RefreshCw, LogOut, PlaneTakeoff, Users } from 'lucide-react';

import './style.css';

const Header = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const showBackButton = location.pathname !== '/flightboard' && location.pathname !== '/login';
  const passengersMatch = location.pathname.match(/^\/flights\/([^/]+)\/passengers/);
  const passengersFlightId = passengersMatch ? passengersMatch[1] : null;

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/flightboard');
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        {showBackButton ? (
          <button className="topbar-back" onClick={handleBack}>
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
        ) : (
          <button className="brand" onClick={() => navigate('/flightboard')}>
            <div className="brand-icon">
              <PlaneTakeoff size={18} />
            </div>
            <div className="brand-copy">
              <span className="brand-name">iCheck</span>
              <span className="brand-subtitle">Tablica lotów</span>
            </div>
          </button>
        )}
      </div>
      <div className="topbar-actions">
        {passengersFlightId ? (
          <button
            className="topbar-action primary"
            onClick={() => navigate(`/flights/${passengersFlightId}/boarding`)}
          >
            <Users size={16} />
            <span>Boarding</span>
          </button>
        ) : (
          <button className="topbar-action" onClick={handleRefresh}>
            <RefreshCw size={16} />
            <span>Odśwież</span>
          </button>
        )}
        <button className="topbar-action logout" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Wyloguj</span>
        </button>
      </div>
    </header>
  );
};

export default Header;