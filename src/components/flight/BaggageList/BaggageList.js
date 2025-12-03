import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../../api/axiosConfig';
import FlightInfo from '../components/FlightInfo/FlightInfo';
import './style.css';

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

  const generateBaggageList = () => {
    const baggageList = [];

    passengers.forEach(passenger => {
      const title = passenger.gender === 'M' ? 'MR' : passenger.gender === 'F' ? 'MRS' : 'CHLD';
      const fullName = `${passenger.name} ${passenger.surname}`;

      if (passenger.baggageList && passenger.baggageList.length > 0) {
        passenger.baggageList.forEach(baggage => {
          // Filter by selected baggage type
          if (selectedBaggageType === 'ALL' || baggage.type === selectedBaggageType) {
            baggageList.push({
              passenger: `${title} ${fullName}`,
              baggageId: baggage.id || 'N/A',
              weight: baggage.weight || 'N/A',
              type: baggage.type || 'N/A'
            });
          }
        });
      }
    });

    return baggageList;
  };

  const handleDownload = () => {
    const baggageList = generateBaggageList();
    const content = baggageList.map(item =>
      `${item.passenger} | ${item.baggageId} | ${item.weight} | ${item.type}`
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `baggage_list_${flightDetails.flightNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <section>
      <div className="content-wrapper">
        <div className="main-container-flightData --bagList">{/* main-container-flightData */}
          {flightDetails && (
            <FlightInfo
              flightNumber={flightDetails.flightNumber}
              departureTime={flightDetails.departureTime}
              route={flightDetails.route}
              status={flightDetails.status || flightDetails.state}
            />
          )}
          <div className="baggage-summary">
            <div className="summary-item">
              <span className="summary-label">Total Weight:</span>
              <span className="summary-value">{summary.totalWeight}kg</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Bags:</span>
              <span className="summary-value">{summary.totalCount}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Regular Bags:</span>
              <span className="summary-value">{summary.regularCount}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">DAA Bags:</span>
              <span className="summary-value">{summary.daaCount}</span>
            </div>
          </div>
        </div>
        <div className="main-container">
          <div className="baggage-list-header">
            <h2>Baggage List</h2>
            <div className="baggage-list-controls">
              <select 
                value={selectedBaggageType} 
                onChange={(e) => setSelectedBaggageType(e.target.value)}
                className="baggage-type-filter"
              >
                <option value="ALL">All Types</option>
                <option value="BAG">BAG</option>
                <option value="DAA">DAA</option>
                <option value="HAND_LUGGAGE">HAND_LUGGAGE</option>
                <option value="SPORT_EQUIPMENT">SPORT_EQUIPMENT</option>
                <option value="WHEELCHAIR">WHEELCHAIR</option>
              </select>
              <button onClick={handleDownload} className="download-button">
                Download List
              </button>
            </div>
          </div>
          <div className="baggage-list-content">
            {generateBaggageList().map((item, index) => (
              <div key={index} className="baggage-item">
                <span className="passenger">{item.passenger}</span>
                <span className="baggage-id">{item.baggageId}</span>
                <span className="weight">{item.weight} kg</span>
                <span className="type">{item.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BaggageList;