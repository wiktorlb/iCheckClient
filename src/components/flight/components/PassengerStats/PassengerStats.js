import React, { memo, useMemo } from 'react';
import './style.css';

/**
 * Komponent wyświetlający statystyki pasażerów
 * @component
 * @param {Object} props
 * @param {Array} props.passengers - Lista pasażerów
 */
export const PassengerStats = ({ passengers }) => {
    // Obliczanie statystyk z memoizacją
    const stats = useMemo(() => {
        const initialStats = { none: 0, acc: 0, stby: 0, off: 0 };
        const counts = passengers.reduce((acc, passenger) => {
            const status = passenger.status?.toLowerCase() || 'none';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, initialStats);

        const total = passengers.length || 1;
        return Object.entries(counts).reduce((acc, [key, count]) => {
            acc[key] = {
                count,
                percentage: (count / total) * 100
            };
            return acc;
        }, {});
    }, [passengers]);

    return (
        <div className="stats-container">
            <div className="stats-header">
                <div className="stats-title">
                    <h3>Total Passengers: {passengers.length}</h3>
                </div>
                <StatsLegend stats={stats} />
            </div>
            <ProgressBar stats={stats} />
        </div>
    );
};

/**
 * Komponent wyświetlający legendę statystyk
 */
const StatsLegend = ({ stats }) => (
    <div className="stats-legend">
        {Object.entries(stats).map(([status, data]) => (
            <div key={status} className="legend-item">
                <span className={`legend-color ${status}`}></span>
                <span>{getStatusLabel(status)} ({data.count})</span>
            </div>
        ))}
    </div>
);

/**
 * Komponent wyświetlający pasek postępu
 */
const ProgressBar = ({ stats }) => (
    <div className="single-progress-bar">
        {Object.entries(stats).map(([status, data]) => (
            <div
                key={status}
                className={`progress-segment ${status}`}
                style={{ width: `${data.percentage}%` }}
                title={`${getStatusLabel(status)}: ${data.count}`}
            >
                {data.percentage > 10 && data.count}
            </div>
        ))}
    </div>
);

const getStatusLabel = (status) => {
    switch (status) {
        case 'none':
            return 'Not Checked';
        case 'acc':
            return 'Accepted';
        case 'stby':
            return 'Standby';
        case 'off':
            return 'Offloaded';
        default:
            return status.toUpperCase();
    }
};

export default PassengerStats;