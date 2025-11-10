import React from 'react';
import './style.css';

/**
 * Flight Information Component
 *
 * Displays essential flight information including flight number, departure time,
 * route, and current flight status. Provides a clear overview of the flight's
 * key details in a structured format.
 *
 * @component
 * @param {Object} props
 * @param {string} props.flightNumber - The flight number/identifier
 * @param {string} props.departureTime - Scheduled departure time
 * @param {string} props.route - Flight route information
 * @param {string} props.status - Current flight status
 */
const FlightInfo = ({ flightNumber, departureTime, route, status }) => {
    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'open':
                return 'status-open';
            case 'prepare':
                return 'status-prepare';
            case 'finalized':
                return 'status-finalized';
            default:
                return '';
        }
    };

    return (
        <div className="flight-info-container">
            <div className={`status-bar ${getStatusColor(status)}`}></div>
            <div className="flight-info-content">
                <div className="flight-number"><h1>{flightNumber}</h1></div>
                <div className="flight-details">
                    <div className="departure-time">REGN. SPXQ</div>
                    <div className="departure-time">ETA: {departureTime}</div>

                </div>
            </div>
            <div className="route">{route}</div>
        </div>
    );
};

export default FlightInfo;