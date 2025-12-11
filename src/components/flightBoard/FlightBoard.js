import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Clock3, Plane, DoorOpen, Trash2, UploadCloud, ChevronRight } from 'lucide-react';
import axiosInstance from '../../api/axiosConfig';
import './style.css';

const statusMap = {
  open: { label: 'Open', tone: 'status-open' },
  boarding: { label: 'Boarding', tone: 'status-boarding' },
  delayed: { label: 'Delayed', tone: 'status-delayed' },
  prepare: { label: 'Prepare', tone: 'status-prepare' },
  finalized: { label: 'Finalized', tone: 'status-finalized' },
  closed: { label: 'Closed', tone: 'status-closed' },
};

const FlightBoard = () => {
  const [flights, setFlights] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const jwt = localStorage.getItem('jwt');

    if (jwt) {
      axiosInstance
        .get('/api/flights', { headers: { Authorization: `Bearer ${jwt}` } })
        .then((response) => {
          if (Array.isArray(response.data)) {
            setFlights(response.data);
          } else {
            setFlights([]);
            setError(response.data);
          }
        })
        .catch((err) => {
          console.error('Error fetching flights:', err);
          setError('Failed to fetch flights.');
        });
    } else {
      window.location.href = '/login';
    }
  }, []);

  const deleteFlight = async (flightId) => {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) return (window.location.href = '/login');

    setLoading(true);
    try {
      await axiosInstance.delete(`/api/flights/${flightId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });

      setFlights((prev) => prev.filter((flight) => flight.id !== flightId));
    } catch (err) {
      console.error('Error deleting flight:', err);
      alert('Failed to delete flight.');
    } finally {
      setLoading(false);
    }
  };

  const filteredFlights = flights.filter(
    (flight) => !selectedDate || flight.departureDate === selectedDate
  );

  const totalItems = filteredFlights.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentFlights = filteredFlights.slice(startIndex, startIndex + itemsPerPage);

  const emptyState = !loading && currentFlights.length === 0;

  const renderStatus = (status) => {
    const normalized = (status || '').toLowerCase();
    const swatch = statusMap[normalized] || { label: status || 'Unknown', tone: 'status-unknown' };
    return <span className={`status-pill ${swatch.tone}`}>{swatch.label}</span>;
  };

  const formatRoute = (route) => {
    if (!route) return { from: 'N/A', to: 'N/A' };
    const [from, to] = route.split('-').map((segment) => segment.trim());
    return {
      from: from || 'N/A',
      to: to || 'N/A',
    };
  };

  const pagination = useMemo(
    () =>
      Array.from({ length: totalPages }, (_, index) => (
        <button
          key={index + 1}
          className={`page-pill ${currentPage === index + 1 ? 'active' : ''}`}
          onClick={() => setCurrentPage(index + 1)}
        >
          {index + 1}
        </button>
      )),
    [totalPages, currentPage]
  );

  return (
    <section className="flightboard-page">
      {loading && (
        <div className="loading-screen">
          <div className="spinner"></div>
        </div>
      )}

      <main className="flightboard-main">
        <div className="flightboard-top">
          <div>
            <h1>Flight Board</h1>
            <p>Zarządzaj bieżącymi lotami i przełącz się do widoku pasażerów jednym kliknięciem.</p>
          </div>
          <div className="date-filter">
            <label htmlFor="date">Filter by date</label>
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="flight-card-list">
          {currentFlights.map((flight) => {
            const route = formatRoute(flight.route);
            const model = flight.aircraftId || flight.plane?.model || '—';
            const gate = flight.boardingGate || flight.gate || '—';
            const status = flight.status || flight.state;

            return (
              <article
                key={flight.id}
                className="flight-card"
                onClick={() => navigate(`/flights/${flight.id}/passengers`)}
              >
                <div className="flight-card-body">
                  <div className="flight-card-left">
                    <div className="flight-number">{flight.flightNumber || '—'}</div>
                    <div className="flight-route">
                      <MapPin size={16} />
                      <span>
                        {route.from} <span className="route-sep">→</span> {route.to}
                      </span>
                    </div>
                    <div className="flight-meta">
                      <span>
                        <Clock3 size={15} />
                        {flight.departureTime || 'TBD'}
                      </span>
                      <span>
                        <Plane size={15} />
                        {model}
                      </span>
                      <span>
                        <DoorOpen size={15} />
                        Gate: {gate}
                      </span>
                    </div>
                  </div>
                  <div className="flight-card-right">
                    {renderStatus(status)}
                    <ChevronRight size={18} className="chevron" />
                  </div>
                </div>
                <div className="flight-card-actions" onClick={(e) => e.stopPropagation()}>
                  <Link to={`/flights/${flight.id}/upload-passengers`} className="card-action-btn">
                    <UploadCloud size={16} />
                    <span>Add passengers</span>
                  </Link>
                  <button
                    type="button"
                    className="card-action-btn danger"
                    onClick={() => deleteFlight(flight.id)}
                    disabled={loading}
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {emptyState && <div className="empty-state">No flights available for the selected date.</div>}

        {totalPages > 1 && <div className="pagination-row">{pagination}</div>}

        <div className="board-footer-actions">
          <Link to="/add-flight" className="primary-action">
            Add new flight
          </Link>
          <Link to="/register" className="ghost-action">
            Add new user
          </Link>
        </div>
      </main>
    </section>
  );
};

export default FlightBoard;
