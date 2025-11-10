import React from 'react';

export const StatsInfo = ({ stats }) => (
    <div className="flight-stats-info">
        <div className="stat-item">
            <span>BOARDED</span>
            <span>{stats.boarded}</span>
        </div>
        <div className="stat-item">
            <span>ACCEPTED</span>
            <span>{stats.acc}</span>
        </div>
        <div className="stat-item">
            <span>BOOKED</span>
            <span>{stats.booked}</span>
        </div>
        <div className="stat-item">
            <span>ALLOWED</span>
            <span>{stats.allowed || 0}</span>
        </div>
        <div className="stat-item">
            <span>STANDBY</span>
            <span>{stats.stby}</span>
        </div>
        <div className="stat-item">
            <span>BAGS</span>
            <span>{stats.bags}</span>
        </div>
        <div className="stat-item">
            <span>SBAGS</span>
            <span>{stats.sbags}</span>
        </div>
    </div>
);