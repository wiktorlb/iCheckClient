import React, { memo, useEffect, useRef, useCallback } from 'react';

import './style.css';

/**
 * Passenger Table Component
 *
 * A comprehensive table component for displaying passenger information in a flight management system.
 * Features include:
 * - Passenger selection functionality
 * - Status-based row highlighting
 * - SSR code display with tooltips
 * - Responsive design
 *
 * @component
 */
export const PassengerTable = memo(({
    passengers,
    selectedPassengers,
    onToggleSelection,
    getSrrTooltip
}) => {
    if (!passengers.length) {
        return <div>No passengers found for this flight.</div>;
    }

    return (
        <div className="passenger-container">
            <table className="passenger-table">
                <TableHeader />
                <TableBody
                    passengers={passengers}
                    selectedPassengers={selectedPassengers}
                    onToggleSelection={onToggleSelection}
                    getSrrTooltip={getSrrTooltip}
                />
            </table>
        </div>
    );
});

/**
 * Table Header Component
 *
 * Renders the header row of the passenger table with column titles.
 * Includes columns for selection, passenger number, name, seat, gender, and status.
 *
 * @component
 */
const TableHeader = () => (
    <thead className="passenger-table-header">
        <tr className="passenger-table-header-row">
            <th>Select</th>
            <th>#</th>
            <th>Passenger</th>
            <th>Seat</th>
            <th>Gender</th>
            <th>Status</th>
        </tr>
    </thead>
);

/**
 * Table Body Component
 *
 * Renders the main content of the passenger table.
 * Maps through the passenger list and renders individual passenger rows.
 *
 * @component
 */
const TableBody = memo(({
    passengers,
    selectedPassengers,
    onToggleSelection,
    getSrrTooltip
}) => (
    <tbody>
        {passengers.map((passenger, index) => (
            <PassengerRow
                key={passenger.id}
                passenger={passenger}
                index={index}
                isSelected={selectedPassengers.includes(passenger.id)}
                onToggleSelection={onToggleSelection}
                getSrrTooltip={getSrrTooltip}
            />
        ))}
    </tbody>
));

/**
 * Passenger Row Component
 *
 * Renders a single row in the passenger table.
 * Handles row selection, status-based styling, and click events.
 *
 * @component
 */
const PassengerRow = memo(({
    passenger,
    index,
    isSelected,
    onToggleSelection,
    getSrrTooltip
}) => {
    const normalizedStatus = passenger.status?.toLowerCase() || 'default';
    const rowClassName = `
        passenger-row
        ${getRowClassName(passenger.status)}
        ${isSelected ? 'row-selected' : ''}
    `.trim();

    const handleRowClick = (e) => {
        // Do not toggle selection when clicking checkbox or SSR code
        if (
            e.target.type === 'checkbox' ||
            e.target.closest('.srr-code') ||
            e.target.closest('.srr-codes')
        ) {
            return;
        }
        onToggleSelection(passenger.id);
    };

    return (
        <tr
            className={rowClassName}
            onClick={handleRowClick}
        >
            <td onClick={e => e.stopPropagation()}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelection(passenger.id)}
                />
            </td>
            <td>{index + 1}</td>
            <td>
                <PassengerName passenger={passenger} getSrrTooltip={getSrrTooltip} />
            </td>
            <td>
                <span className="seat-chip">
                    {passenger.seatNumber || '—'}
                </span>
            </td>
            <td>
                <span className="gender-chip">
                    {passenger.gender || '—'}
                </span>
            </td>
            <td>
                <span className={`status-badge status-${normalizedStatus}`}>
                    {passenger.status || '—'}
                </span>
            </td>
        </tr>
    );
});

/**
 * Passenger Name Component
 *
 * Displays passenger name and associated SSR codes.
 * Includes tooltip functionality for SSR code information.
 *
 * @component
 */
const PassengerName = memo(({ passenger, getSrrTooltip }) => {
    const activeTooltipRef = useRef(null);

    const updateTooltipPosition = useCallback((element) => {
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const horizontalPadding = 24;

        let x = rect.left + rect.width / 2;
        x = Math.min(viewportWidth - horizontalPadding, Math.max(horizontalPadding, x));

        let y = rect.top - 16;
        let placement = 'top';

        if (y < 90) {
            y = rect.bottom + 16;
            placement = 'bottom';
        }

        element.style.setProperty('--tooltip-x', `${x}px`);
        element.style.setProperty('--tooltip-y', `${y}px`);
        element.dataset.tooltipPlacement = placement;
    }, []);

    const handleTooltipEvent = useCallback((event) => {
        const element = event.currentTarget;
        activeTooltipRef.current = element;
        updateTooltipPosition(element);
    }, [updateTooltipPosition]);

    const handleTooltipLeave = useCallback(() => {
        activeTooltipRef.current = null;
    }, []);

    useEffect(() => {
        const handleViewportChange = () => {
            if (activeTooltipRef.current) {
                updateTooltipPosition(activeTooltipRef.current);
            }
        };

        document.addEventListener('scroll', handleViewportChange, true);
        window.addEventListener('resize', handleViewportChange);

        return () => {
            document.removeEventListener('scroll', handleViewportChange, true);
            window.removeEventListener('resize', handleViewportChange);
        };
    }, [updateTooltipPosition]);

    return (
        <>
            <span className="passenger-name">
                {passenger.name} {passenger.surname} {passenger.title || ''}
            </span>

            {passenger.srrCodes?.length > 0 && (
                <div className="srr-codes">
                    {passenger.srrCodes.map((code, idx) => (
                        <span
                            key={idx}
                            className={`srr-code`}
                            data-tooltip={getSrrTooltip(code, passenger)}
                            onMouseEnter={handleTooltipEvent}
                            onMouseMove={handleTooltipEvent}
                            onFocus={handleTooltipEvent}
                            onMouseLeave={handleTooltipLeave}
                            onBlur={handleTooltipLeave}
                        >
                            {code}
                        </span>
                    ))}
                </div>
            )}
        </>
    );
});

/**
 * Helper function to determine row styling based on passenger status
 *
 * @param {string} status - The passenger's current status
 * @returns {string} CSS class name for the row
 */
const getRowClassName = (status) => {
    switch (status) {
        case 'ACC': return 'row-accepted';
        case 'STBY': return 'row-standby';
        case 'OFF': return 'row-offloaded';
        case 'BOARDED': return 'row-boarded';
        default: return '';
    }
};

export default PassengerTable;