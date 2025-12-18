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

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const PassengerList = () => {
  const { flightId } = useParams();
  const [passengers, setPassengers] = useState([]);
  const [flightDetails, setFlightDetails] = useState(null);
  const [error, setError] = useState(null);
  const [groupFilter, setGroupFilter] = useState('ALL');
  const [validUntilFilter, setValidUntilFilter] = useState('');

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
    const rawValidUntil = passenger.validUntil || null;
    const validUntilDate = parseDate(rawValidUntil);
    return {
      id: passenger.id,
      group,
      fullName: `${passenger.name || ''} ${passenger.surname || ''}`.trim() || '—',
      seat: passenger.seatNumber || '—',
      documentType: passenger.documentType === 'ID' ? 'ID' : 'Passport',
      documentNumber: passenger.serialName || '—',
      dateOfBirth: formatDate(passenger.dateOfBirth),
      validUntil: formatDate(passenger.validUntil),
      rawValidUntil,
      validUntilDate
    };
  }), [passengers]);

  const filteredPassengers = useMemo(() => {
    const selectedValidDate = parseDate(validUntilFilter);
    if (groupFilter === 'ALL') return decoratedPassengers;
    return decoratedPassengers.filter(passenger => {
      const matchesGroup = passenger.group === groupFilter || groupFilter === 'ALL';
      const matchesValidDate = selectedValidDate
        ? passenger.validUntilDate && passenger.validUntilDate < selectedValidDate
        : true;
      return matchesGroup && matchesValidDate;
    });
  }, [decoratedPassengers, groupFilter, validUntilFilter]);

  const gate = flightDetails?.boardingGate || flightDetails?.gate || '—';
  const radioNumber = flightDetails?.radioNumber || flightDetails?.radio || '—';

  const handleDownloadPassengerList = () => {
    if (!passengers.length) {
      return;
    }

    const lines = passengers.map((passenger, index) => {
      const title = passenger.title?.toUpperCase()
        || (passenger.gender === 'M' ? 'MR' : passenger.gender === 'F' ? 'MRS' : 'CHLD');
      const firstName = passenger.name || '';
      const lastName = passenger.surname || '';
      const documentType = passenger.documentType === 'ID' ? 'ID' : 'P';
      const validDate = formatDate(passenger.validUntil);

      return `${index + 1}. ${firstName} ${lastName} ${title} | ${documentType} | ${validDate}`;
    }).join('\n');

    const blob = new Blob([lines], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const suffix = flightDetails?.flightNumber ? `_${flightDetails.flightNumber}` : '';
    a.download = `passenger_list${suffix}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

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
                <input
                  type="date"
                  className="search-input"
                  value={validUntilFilter}
                  onChange={(e) => setValidUntilFilter(e.target.value)}
                  placeholder="Valid before..."
                />
              </div>
              <div className="toolbar-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleDownloadPassengerList}
                >
                  Download Passenger List
                </button>
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
