import React from 'react';

export const StatsInfo = ({ stats }) => (
    <div className="flight-stats-info">
        <div className="stat-item">
            <span>BOARDED</span>
            <span>{stats.boarded}</span>
        </div>
        <div className="stat-item">
            <span>ACCEPTED</span>
            <span>{stats.accepted}</span>
        </div>
        <div className="stat-item">
            <span>BOOKED</span>
            <span>{stats.booked}</span>
        </div>
        <div className="stat-item">
            <span>ALLOWED</span>
            <span>{stats.allowed}</span>
        </div>
        <div className="stat-item">
            <span>STANDBY</span>
            <span>{stats.standby}</span>
        </div>
    </div>
);