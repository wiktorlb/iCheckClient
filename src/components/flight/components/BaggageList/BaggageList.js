import React from 'react';
import './style.css';

const BaggageList = ({ passengers }) => {
  const generateBaggageList = () => {
    const baggageList = [];

    passengers.forEach(passenger => {
      const title = passenger.gender === 'M' ? 'MR' : passenger.gender === 'F' ? 'MRS' : 'CHLD';
      const fullName = `${passenger.name} ${passenger.surname}`;

      if (passenger.baggageList && passenger.baggageList.length > 0) {
        passenger.baggageList.forEach(baggage => {
          baggageList.push({
            passenger: `${title} ${fullName}`,
            baggageId: baggage.id || 'N/A',
            weight: baggage.weight || 'N/A',
            type: baggage.type || 'N/A'
          });
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
    a.download = 'baggage_list.txt';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="baggage-list-container">
      <button onClick={handleDownload} className="download-button">
        Generate Baggage List
      </button>
    </div>
  );
};

export default BaggageList;