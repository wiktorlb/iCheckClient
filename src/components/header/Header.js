import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, RefreshCw, LogOut, Users } from 'lucide-react';

import axiosInstance from '../../api/axiosConfig';
import './style.css';

const logo = `${process.env.PUBLIC_URL}/iCheckLogo.png`;


const Header = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [flightDetails, setFlightDetails] = useState(null);

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const handleRefresh = () => {
    window.dispatchEvent(
      new CustomEvent('app:data-refresh', {
        detail: {
          pathname: location.pathname,
          search: location.search
        }
      })
    );
  };

  const showBackButton = location.pathname !== '/flightboard' && location.pathname !== '/login';
  const flightMatch = location.pathname.match(/^\/flights\/([^/]+)/);
  const passengersMatch = location.pathname.match(/^\/flights\/([^/]+)\/passengers/);
  const passengersFlightId = passengersMatch ? passengersMatch[1] : null;

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const queryFlightId = searchParams.get('flightId');
  const stateFlightId = location.state?.flightId || null;
  const currentFlightId = flightMatch ? flightMatch[1] : queryFlightId || stateFlightId;

  useEffect(() => {
    if (!currentFlightId) {
      setFlightDetails(null);
      return;
    }

    const controller = new AbortController();
    const jwt = localStorage.getItem('jwt');
    if (!jwt) return;

    const fetchFlightDetails = async () => {
      try {
        const response = await axiosInstance.get(`/api/flights/${currentFlightId}`, {
          headers: { Authorization: `Bearer ${jwt}` },
          signal: controller.signal
        });
        setFlightDetails(response.data);
      } catch (error) {
        if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
          console.error('Failed to load flight info for header', error);
        }
      }
    };

    fetchFlightDetails();
    return () => controller.abort();
  }, [currentFlightId]);

  const flightInfo = useMemo(() => {
    if (!flightDetails) return null;

    const route = flightDetails.route || '';
    const routeSegments = route
      .split(/[-–>]/)
      .map(part => part.trim())
      .filter(Boolean);
    const formattedRoute =
      routeSegments.length >= 2
        ? `${routeSegments[0]} - ${routeSegments[routeSegments.length - 1]}`
        : routeSegments[0] || route || flightDetails.destination || '—';

    const combineDepartureDateTime = () => {
      const datePart = flightDetails.departureDate;
      const timePart = flightDetails.departureTime;

      if (datePart && timePart) {
        const combined = new Date(`${datePart}T${timePart}`);
        if (!Number.isNaN(combined.getTime())) {
          return combined;
        }
      }

      if (timePart) {
        const parsed = new Date(timePart);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed;
        }
      }

      if (datePart) {
        const parsed = new Date(datePart);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed;
        }
      }

      return null;
    };

    const departureDateTime = combineDepartureDateTime();
    const formattedDeparture = departureDateTime
      ? departureDateTime.toLocaleString([], {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        })
      : flightDetails.departureTime || flightDetails.departureDate || '—';

    const statusText =
      (flightDetails.status || flightDetails.flightStatus || '')
        .toString()
        .toUpperCase() || '—';

    const statusClass = statusText === 'OPEN' ? 'on-time' : 'delayed';

    return {
      number: flightDetails.flightNumber || '—',
      route: formattedRoute,
      departure: formattedDeparture,
      statusLabel: statusText,
      statusClass
    };
  }, [flightDetails]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/flightboard');
    }
  };

  return (
    <header className="topbar">
      <div className="center topbar-inner">
        <div className="topbar-left">
          {showBackButton ? (
            <div className="topbar-back-wrapper">
              <button className="topbar-back" onClick={handleBack}>
                <ArrowLeft size={20} />
              </button>
              {flightInfo && (
                <div className="flight-context">
                  <div className="flight-row primary">
                    <span className="flight-number-chip">{flightInfo.number}</span>
                    <span className={`status-pill-mini ${flightInfo.statusClass}`}>
                      {flightInfo.statusLabel}
                    </span>
                  </div>
                  <div className="flight-row secondary">
                    <span className="flight-route">{flightInfo.route}</span>
                    <span className="flight-departure">{flightInfo.departure}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button className="brand" onClick={() => navigate('/flightboard')}>
                <img src={logo} alt="Logo" />
             {/*  <div className="brand-icon">
                <PlaneTakeoff size={18} />
              </div>
              <div className="brand-copy">
                <span className="brand-name">iCheck</span>
                <span className="brand-subtitle">Tablica lotów</span>
              </div> */}
            </button>
          )}
        </div>
        <div className="topbar-actions">
          {passengersFlightId ? (
            <div className="topbar-action-group">
              <button
                className="topbar-action primary"
                onClick={() => navigate(`/flights/${passengersFlightId}/boarding`)}
              >
                <Users size={16} />
                <span>BOARDING</span>
              </button>
              <button className="topbar-action" onClick={handleRefresh}>
                <RefreshCw size={16} />
              </button>
            </div>
          ) : (
            <div className="topbar-action-group">
              <button className="topbar-action" onClick={handleRefresh}>
                <RefreshCw size={16} />
              </button>
            </div>
          )}
          <button className="topbar-action logout" onClick={handleLogout}>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;