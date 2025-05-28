import React from 'react';
import './style.css';

/**
 * Baggage List Component
 *
 * Displays a comprehensive list of passenger baggage items.
 * Features include:
 * - Baggage item selection
 * - Status-based highlighting
 * - Detailed baggage information display
 * - Integration with passenger information
 *
 * @component
 * @param {Object} props
 * @param {Array} props.baggageItems - List of baggage items to display
 * @param {Array} props.selectedItems - Array of selected baggage item IDs
 * @param {Function} props.onToggleSelection - Handler for baggage item selection
 * @param {Function} props.getSrrTooltip - Function to generate tooltips for SSR codes
 */

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