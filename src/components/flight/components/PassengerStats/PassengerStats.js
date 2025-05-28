import React, { memo, useMemo } from 'react';
import './style.css';
import { StatsInfo } from './StatsInfo';
import { StatsProgressBar } from './StatsProgressBar';

/**
 * Passenger Statistics Component
 *
 * Displays comprehensive statistics about passengers on a flight.
 * Shows key metrics including boarded, accepted, booked, and standby passengers,
 * as well as baggage information.
 *
 * @component
 * @param {Object} props
 * @param {Object} props.stats - Statistics object containing passenger counts
 * @param {number} props.stats.boarded - Number of boarded passengers
 * @param {number} props.stats.acc - Number of accepted passengers
 * @param {number} props.stats.booked - Total number of booked passengers
 * @param {number} props.stats.stby - Number of standby passengers
 * @param {number} props.stats.bags - Total number of bags
 * @param {number} props.stats.sbags - Number of standby bags
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