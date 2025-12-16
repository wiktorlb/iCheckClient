import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosInstance from '../../../api/axiosConfig';
import ErrorMessage from '../components/ErrorMessage/ErrorMessage';
import SeatMap from '../components/SeatMap/SeatMap';
import '../style.css';
import './style.css';

const SummaryCard = ({ label, value, suffix = '' }) => (
  <div className="stats-item">
    <span className="stats-label">{label}</span>
    <span className="stats-value">
      {value}
      {suffix}
    </span>
  </div>
);

const BaggageList = () => {
  const { flightId } = useParams();
  const [passengers, setPassengers] = useState([]);
  const [flightDetails, setFlightDetails] = useState(null);
  const [error, setError] = useState(null);
  const [selectedBaggageType, setSelectedBaggageType] = useState('ALL');
  const [summary, setSummary] = useState({
    totalWeight: 0,
    regularCount: 0,
    daaCount: 0,
    totalCount: 0
  });

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

        // Calculate summary
        const summaryData = response.data.reduce((acc, passenger) => {
          if (passenger.baggageList && passenger.baggageList.length > 0) {
            passenger.baggageList.forEach(baggage => {
              acc.totalWeight += parseFloat(baggage.weight) || 0;
              acc.totalCount++;
              if (baggage.type === 'DAA') {
                acc.daaCount++;
              } else {
                acc.regularCount++;
              }
            });
          }
          return acc;
        }, {
          totalWeight: 0,
          regularCount: 0,
          daaCount: 0,
          totalCount: 0
        });

        setSummary(summaryData);
      } catch (error) {
        console.error('Error fetching passengers:', error);
        setError('Failed to fetch passengers.');
      }
    };

    const fetchFlightDetails = async () => {
      try {
        const response = await axiosInstance.get(`/api/flights/${flightId}`);
        setFlightDetails(response.data);
      } catch (error) {
        console.error('Error fetching flight details:', error);
      }
    };

    fetchPassengers();
    fetchFlightDetails();
  }, [flightId]);

  const baggageList = useMemo(() => {
    const list = [];

    passengers.forEach(passenger => {
      const title = passenger.gender === 'M' ? 'MR' : passenger.gender === 'F' ? 'MRS' : 'CHLD';
      const fullName = `${passenger.name} ${passenger.surname}`;

      if (passenger.baggageList && passenger.baggageList.length > 0) {
        passenger.baggageList.forEach(baggage => {
          if (selectedBaggageType === 'ALL' || baggage.type === selectedBaggageType) {
            list.push({
              passenger: `${title} ${fullName}`,
              baggageId: baggage.id || 'N/A',
              weight: baggage.weight || 'N/A',
              type: baggage.type || 'N/A'
            });
          }
        });
      }
    });

    return list;
  }, [passengers, selectedBaggageType]);

  const handleDownload = () => {
    const content = baggageList.map(item =>
      `${item.passenger} | ${item.baggageId} | ${item.weight} | ${item.type}`
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const suffix = flightDetails?.flightNumber ? `_${flightDetails.flightNumber}` : '';
    a.download = `baggage_list${suffix}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const gate = flightDetails?.boardingGate || flightDetails?.gate || '—';
  const radioNumber = flightDetails?.radioNumber || flightDetails?.radio || '—';
  const planeModel = flightDetails?.plane?.model || flightDetails?.aircraftId || '—';

  return (
    <section className="passengers-page baggage-page">
      <div className="passengers-body center flex">


        <div className="passengers-right full-width">
          <div className="passengers-overview">
            <SummaryCard label="Total Weight" value={summary.totalWeight} suffix="kg" />
            <SummaryCard label="Total Bags" value={summary.totalCount} />
            <SummaryCard label="Regular Bags" value={summary.regularCount} />
            <SummaryCard label="DAA Bags" value={summary.daaCount} />
          </div>

          <div className="passenger-table-card baggage-card">
            <div className="table-toolbar">
              <div className="toolbar-search">
                <select
                  value={selectedBaggageType}
                  onChange={(e) => setSelectedBaggageType(e.target.value)}
                  className="search-input"
                >
                  <option value="ALL">All Types</option>
                  <option value="BAG">BAG</option>
                  <option value="DAA">DAA</option>
                  <option value="HAND_LUGGAGE">HAND LUGGAGE</option>
                  <option value="SPORT_EQUIPMENT">SPORT EQUIPMENT</option>
                  <option value="WHEELCHAIR">WHEELCHAIR</option>
                </select>
              </div>
              <div className="toolbar-actions">
                <button type="button" className="primary-button" onClick={handleDownload}>
                  Download List
                </button>
              </div>
            </div>

            <ErrorMessage error={error} />

            <div className="baggage-list-content">
              {baggageList.length === 0 ? (
                <div className="panel-placeholder">No baggage found for this filter.</div>
              ) : (
                baggageList.map((item, index) => (
                  <div key={`${item.baggageId}-${index}`} className="baggage-item">
                    <span className="passenger">{item.passenger}</span>
                    <span className="baggage-id">{item.baggageId}</span>
                    <span className="weight">{item.weight} kg</span>
                    <span className="type">{item.type}</span>
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

export default BaggageList;