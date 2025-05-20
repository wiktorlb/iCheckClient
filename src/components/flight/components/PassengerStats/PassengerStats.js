import React, { memo, useMemo } from 'react';
import './style.css';
import { StatsInfo } from './StatsInfo';
import { StatsProgressBar } from './StatsProgressBar';

/**
 * Komponent wyświetlający statystyki pasażerów
 * @component
 * @param {Object} props
 * @param {Array} [props.passengers] - Lista pasażerów
 * @param {Object} [props.stats] - Pre-calculated stats object
 */
export const PassengerStats = ({ passengers, stats: providedStats }) => {
    const stats = useMemo(() => {
        if (providedStats) {
            return providedStats;
        }

        if (!passengers) {
            return {
                boarded: 0,
                accepted: 0,
                booked: 0,
                allowed: 0,
                standby: 0,
                none: 0,
                off: 0
            };
        }

        return passengers.reduce((acc, passenger) => {
            const status = passenger.status?.toLowerCase() || 'none';
            switch (status) {
                case 'boarded': acc.boarded++; break;
                case 'acc': acc.accepted++; break;
                case 'booked': acc.booked++; break;
                case 'allowed': acc.allowed++; break;
                case 'stby': acc.standby++; break;
                case 'none': acc.none++; break;
                case 'off': acc.off++; break;
                default: break;
            }
            return acc;
        }, {
            boarded: 0,
            accepted: 0,
            booked: 0,
            allowed: 0,
            standby: 0,
            none: 0,
            off: 0
        });
    }, [passengers, providedStats]);

    return (
        <>
            <StatsInfo stats={stats} />
            <StatsProgressBar stats={stats} totalPassengers={passengers?.length || 0} />
        </>
    );
};

export default memo(PassengerStats);