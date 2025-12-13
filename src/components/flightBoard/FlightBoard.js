import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock3,
  Plane,
  DoorOpen,
  Trash2,
  UploadCloud,
  ChevronRight,
  ArrowLeft,
  Pencil,
  Shield,
} from 'lucide-react';
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
  const [userRole, setUserRole] = useState(null);
  const [pendingFlight, setPendingFlight] = useState(null);
  const [isAdminPanel, setIsAdminPanel] = useState(false);
  const [editingFlightId, setEditingFlightId] = useState(null);
  const [uiEditMode, setUiEditMode] = useState(false);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  const decodeRole = useCallback(() => {
    const token = localStorage.getItem('jwt');
    if (!token) {
      setUserRole(null);
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserRole(payload.role);
    } catch (err) {
      console.error('Failed to decode token role', err);
      setUserRole(null);
    }
  }, []);

  const fetchFlights = useCallback(() => {
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

  useEffect(() => {
    decodeRole();
    fetchFlights();
  }, [decodeRole, fetchFlights]);

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

  const canEdit = userRole === 'ADMIN' || userRole === 'LEADER';

  const updateFlightInState = (flightId, updater) => {
    setFlights((prev) =>
      prev.map((flight) => (flight.id === flightId ? { ...flight, ...updater } : flight))
    );
  };

  const handleFlightEditToggle = async (flight) => {
    if (!canEdit) return;
    const jwt = localStorage.getItem('jwt');
    if (!jwt) return;

    setPendingFlight(flight.id);
    try {
      const response = await axiosInstance.put(
        `/api/flights/${flight.id}/edit-mode`,
        { enabled: !flight.editModeEnabled },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      updateFlightInState(flight.id, {
        editModeEnabled: response.data?.editModeEnabled,
        status: response.data?.status || flight.status,
      });
    } catch (err) {
      console.error('Failed to toggle flight edit mode', err);
      alert('Nie udało się zmienić trybu edycji lotu.');
    } finally {
      setPendingFlight(null);
    }
  };

  const handleStatusChange = async (flight, newStatus) => {
    if (!newStatus || newStatus === flight.status) return;
    const jwt = localStorage.getItem('jwt');
    if (!jwt) return;

    setPendingFlight(flight.id);
    try {
      const response = await axiosInstance.put(
        `/api/flights/${flight.id}/status`,
        { newStatus },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      updateFlightInState(flight.id, {
        status: response.data?.status || newStatus,
        editModeEnabled: response.data?.editModeEnabled ?? flight.editModeEnabled,
      });
    } catch (err) {
      console.error('Failed to update flight status', err);
      alert('Nie udało się zaktualizować statusu lotu.');
    } finally {
      setPendingFlight(null);
    }
  };

  const filteredFlights = flights.filter(
    (flight) => !selectedDate || flight.departureDate === selectedDate
  );

  const totalItems = filteredFlights.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
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

  const toggleAdminPanel = () => {
    setIsAdminPanel((prev) => !prev);
    setEditingFlightId(null);
  };

  const renderAdminCard = (flight) => {
    const route = formatRoute(flight.route);
    const model = flight.aircraftId || flight.plane?.model || '—';
    const status = flight.status || flight.state;
    const isEditing = editingFlightId === flight.id;

    return (
      <article key={flight.id} className="flight-card admin-card">
        <div className="admin-card-body">
          <div className="admin-card-info">
            <div className="admin-card-header">
              <span className="flight-number">{flight.flightNumber || '—'}</span>
              {renderStatus(status)}
            </div>
            <div className="admin-card-grid">
              <div>
                <span>Trasa</span>
                <strong>
                  {route.from} <span className="route-sep">→</span> {route.to}
                </strong>
              </div>
              <div>
                <span>Odlot</span>
                <strong>
                  {flight.departureDate || '—'}, {flight.departureTime || 'TBD'}
                </strong>
              </div>
              <div>
                <span>Samolot</span>
                <strong>{model}</strong>
              </div>
              <div>
                <span>Destynacja</span>
                <strong>{flight.destination || '—'}</strong>
              </div>
            </div>
          </div>
          <div className="admin-card-actions">
            <button
              type="button"
              className={`icon-button ${isEditing ? 'active' : ''}`}
              onClick={() => setEditingFlightId(isEditing ? null : flight.id)}
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              className="icon-button danger"
              onClick={() => deleteFlight(flight.id)}
              disabled={loading}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {isEditing && (
          <div className="admin-card-editor">
            <div className="editor-row">
              <label htmlFor={`status-${flight.id}`}>Status lotu</label>
              <select
                id={`status-${flight.id}`}
                value={(flight.status || '').toUpperCase()}
                onChange={(e) => handleStatusChange(flight, e.target.value)}
                disabled={!flight.editModeEnabled || pendingFlight === flight.id}
              >
                <option value="PREPARE">Prepare</option>
                <option value="OPEN">Open</option>
                <option value="CLOSED">Closed</option>
                <option value="FINALIZED">Finalized</option>
              </select>
            </div>
            <div className="editor-row split">
              <button
                type="button"
                className={`ghost-action ${flight.editModeEnabled ? 'active' : ''}`}
                onClick={() => handleFlightEditToggle(flight)}
                disabled={pendingFlight === flight.id}
              >
                {flight.editModeEnabled ? 'Zablokuj edycję' : 'Odblokuj edycję'}
              </button>
              <Link
                to={`/flights/${flight.id}/upload-passengers`}
                className="ghost-action"
              >
                <UploadCloud size={16} />
                Dodaj pasażerów (.txt)
              </Link>
            </div>
          </div>
        )}
      </article>
    );
  };

  return (
    <section className={`flightboard-page ${isAdminPanel ? 'admin-view' : ''}`}>
      {loading && (
        <div className="loading-screen">
          <div className="spinner"></div>
        </div>
      )}

      <main className="flightboard-main">
        {!isAdminPanel ? (
          <>
            <div className="flightboard-top">
              <div>
                {canEdit && (
                  <button
                    type="button"
                    className="admin-panel-btn"
                    onClick={toggleAdminPanel}
                  >
                    Admin Panel
                  </button>
                )}
              </div>
              <div className="flightboard-right">
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
                    {canEdit && uiEditMode && (
                      <div className="flight-card-edit">
                        <div className="toggle-row">
                          <p>Status edycji lotu</p>
                          <button
                            type="button"
                            className={`ghost-action ${flight.editModeEnabled ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFlightEditToggle(flight);
                            }}
                            disabled={pendingFlight === flight.id}
                          >
                            {flight.editModeEnabled ? 'Zablokuj edycję' : 'Odblokuj edycję'}
                          </button>
                        </div>
                        <div className="status-edit-row">
                          <label htmlFor={`status-${flight.id}`}>Flight status</label>
                          <select
                            id={`status-${flight.id}`}
                            value={(flight.status || '').toUpperCase()}
                            onChange={(e) => handleStatusChange(flight, e.target.value)}
                            disabled={!flight.editModeEnabled || pendingFlight === flight.id}
                          >
                            <option value="PREPARE">Prepare</option>
                            <option value="OPEN">Open</option>
                            <option value="CLOSED">Closed</option>
                            <option value="FINALIZED">Finalized</option>
                          </select>
                        </div>
                      </div>
                    )}
                    <div className="flight-card-actions" onClick={(e) => e.stopPropagation()}>
                      {canEdit && uiEditMode && (
                        <>
                          <Link
                            to={`/flights/${flight.id}/upload-passengers`}
                            className="card-action-btn"
                          >
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
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>

            {emptyState && (
              <div className="empty-state">No flights available for the selected date.</div>
            )}

            {totalPages > 1 && <div className="pagination-row">{pagination}</div>}

            {canEdit && uiEditMode && (
              <div className="board-footer-actions">
                <Link to="/add-flight" className="primary-action">
                  Add new flight
                </Link>
                <Link to="/register" className="ghost-action">
                  Add new user
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="admin-panel">
            <div className="admin-head">
              <div className="admin-head-left">
                <button
                  type="button"
                  className="topbar-back admin-panel-back"
                  onClick={toggleAdminPanel}
                >
                  <ArrowLeft size={20} />
                </button>
                <h1>Panel administracyjny</h1>
                <p>Zarządzanie lotami i systemem</p>
              </div>
              <div className="admin-head-actions">
                <Link to="/add-flight" className="primary-action outline">
                  + Dodaj lot
                </Link>
              </div>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <div className="flight-card-list admin-list">
              {currentFlights.map((flight) => renderAdminCard(flight))}
            </div>
          </div>
        )}
      </main>
    </section>
  );
};

export default FlightBoard;
