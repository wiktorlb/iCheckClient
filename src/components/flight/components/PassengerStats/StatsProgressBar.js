import React from 'react';

export const StatsProgressBar = ({ stats, totalPassengers }) => (
    <div className="stats-progress-bar">
        <div className="progress-segment none"
            style={{ width: `${(stats.none / totalPassengers) * 100}%` }} />
        <div className="progress-segment boarded"
            style={{ width: `${(stats.boarded / totalPassengers) * 100}%` }} />
        <div className="progress-segment accepted"
            style={{ width: `${(stats.accepted / totalPassengers) * 100}%` }} />
        <div className="progress-segment booked"
            style={{ width: `${(stats.booked / totalPassengers) * 100}%` }} />
        <div className="progress-segment allowed"
            style={{ width: `${(stats.allowed / totalPassengers) * 100}%` }} />
        <div className="progress-segment standby"
            style={{ width: `${(stats.standby / totalPassengers) * 100}%` }} />
        <div className="progress-segment off"
            style={{ width: `${(stats.off / totalPassengers) * 100}%` }} />
    </div>
);