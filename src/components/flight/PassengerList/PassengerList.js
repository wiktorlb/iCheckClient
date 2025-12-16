import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosInstance from '../../../api/axiosConfig';
import ErrorMessage from '../components/ErrorMessage/ErrorMessage';
import '../style.css';
import './style.css';

const SummaryCard = ({ label, value }) => (
  <div className="stats-item">
    <span className="stats-label">{label}</span>
    <span className="stats-value">{value}</span>
  </div>
);

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
};

const PassengerList = () => {
  const { flightId } = useParams();
  const [passengers, setPassengers] = useState([]);
  const [flightDetails, setFlightDetails] = useState(null);
  const [error, setError] = useState(null);
  const [groupFilter, setGroupFilter] = useState('ALL');

  useEffect(() => {
    const fetchPassengers = async () => {
      try {
        const jwt = localStorage.getItem('jwt');
        if (!jwt) return;

        const response = await axiosInstance.get(
          `/api/passengers/flights/${flightId}/passengers-with-srr`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );

        setPassengers(response.data);
      } catch (fetchError) {
        console.error('Error fetching passengers:', fetchError);
        setError('Failed to fetch passengers.');
      }
    };

    const fetchFlightDetails = async () => {
      try {
        const jwt = localStorage.getItem('jwt');
        const config = jwt ? { headers: { Authorization: `Bearer ${jwt}` } } : undefined;
        const response = await axiosInstance.get(`/api/flights/${flightId}`, config);
        setFlightDetails(response.data);
      } catch (detailsError) {
        console.error('Error fetching flight details:', detailsError);
      }
    };

    fetchPassengers();
    fetchFlightDetails();
  }, [flightId]);

  const categorizePassenger = (passenger) => {
    const title = passenger.title?.toUpperCase() || '';
    const gender = passenger.gender?.toUpperCase();

    if (title.includes('CH') || gender === 'CHD') {
      return 'CHILD';
    }

    if (gender === 'M') {
      return 'MALE';
    }

    if (gender === 'F') {
      return 'FEMALE';
    }

    return 'CHILD';
  };

  const summary = useMemo(() => passengers.reduce((acc, passenger) => {
    const group = categorizePassenger(passenger);

    if (group === 'MALE') acc.males += 1;
    else if (group === 'FEMALE') acc.females += 1;
    else acc.childs += 1;

    return acc;
  }, {
    males: 0,
    females: 0,
    childs: 0
  }), [passengers]);

  const decoratedPassengers = useMemo(() => passengers.map((passenger) => {
    const group = categorizePassenger(passenger);
    return {
      id: passenger.id,
      group,
      fullName: `${passenger.name || ''} ${passenger.surname || ''}`.trim() || '—',
      seat: passenger.seatNumber || '—',
      documentType: passenger.documentType === 'ID' ? 'ID' : 'Passport',
      documentNumber: passenger.serialName || '—',
      dateOfBirth: formatDate(passenger.dateOfBirth),
      validUntil: formatDate(passenger.validUntil)
    };
  }), [passengers]);

  const filteredPassengers = useMemo(() => {
    if (groupFilter === 'ALL') return decoratedPassengers;
    return decoratedPassengers.filter(passenger => passenger.group === groupFilter);
  }, [decoratedPassengers, groupFilter]);

  const gate = flightDetails?.boardingGate || flightDetails?.gate || '—';
  const radioNumber = flightDetails?.radioNumber || flightDetails?.radio || '—';

  return (
    <section className="passengers-page passenger-list-page">
      <div className="passengers-body center flex">
        <div className="passengers-right full-width">
          <div className="passengers-overview">
            <SummaryCard label="Males" value={summary.males} />
            <SummaryCard label="Females" value={summary.females} />
            <SummaryCard label="Childs" value={summary.childs} />
          </div>

          <div className="passenger-table-card passenger-list-card">
            <div className="table-toolbar">
              <div className="toolbar-search passenger-list-toolbar">
                <select
                  className="search-input"
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                >
                  <option value="ALL">All passengers</option>
                  <option value="MALE">Males</option>
                  <option value="FEMALE">Females</option>
                  <option value="CHILD">Childs</option>
                </select>
              </div>
              <div className="toolbar-actions">
                <Link
                  to={`/flights/${flightId}/baggage-list`}
                  className="ghost-button"
                >
                  View Baggage List
                </Link>
              </div>
            </div>

            <ErrorMessage error={error} />

            <div className="passenger-list-content">
              {filteredPassengers.length === 0 ? (
                <div className="panel-placeholder">No passengers to display.</div>
              ) : (
                filteredPassengers.map((passenger) => (
                  <div key={passenger.id} className="passenger-list-row">
                    <div className="passenger-list-info">
                      <p className="label">Full Name</p>
                      <p className="value">{passenger.fullName}</p>
                    </div>
                    <div className="passenger-list-seat">
                      <p className="label">Seat</p>
                      <span className="seat-chip">{passenger.seat}</span>
                    </div>
                    <div className="passenger-list-api">
                      <div className="api-item">
                        <span className="api-label">Document</span>
                        <span className="api-value">{passenger.documentType}</span>
                      </div>
                      <div className="api-item">
                        <span className="api-label">Number</span>
                        <span className="api-value">{passenger.documentNumber}</span>
                      </div>
                      <div className="api-item">
                        <span className="api-label">Birth date</span>
                        <span className="api-value">{passenger.dateOfBirth}</span>
                      </div>
                      <div className="api-item">
                        <span className="api-label">Valid until</span>
                        <span className="api-value">{passenger.validUntil}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PassengerList;
