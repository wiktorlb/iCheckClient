import React, { memo } from 'react';
import './style.css';

/**
 * Komponent tabeli pasażerów
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
 * Komponent nagłówka tabeli
 */
const TableHeader = () => (
    <thead className="passenger-table-header">
        <tr className="passenger-table-header-row">
            <th>Select</th>
            <th>No.</th>
            <th>Name</th>
            <th>Gender</th>
            <th>State</th>
        </tr>
    </thead>
);

/**
 * Komponent ciała tabeli
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
 * Komponent wiersza pasażera
 */
const PassengerRow = memo(({
    passenger,
    index,
    isSelected,
    onToggleSelection,
    getSrrTooltip
}) => {
    const rowClassName = `
        passenger-row
        ${getRowClassName(passenger.status)}
        ${isSelected ? 'row-selected' : ''}
    `.trim();

    const handleRowClick = (e) => {
        // Nie zaznaczaj wiersza, jeśli kliknięto w checkbox lub kod SSR
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
            <td>{passenger.gender}</td>
            <td>{passenger.status}</td>
        </tr>
    );
});

/**
 * Komponent wyświetlający nazwę pasażera i kody SSR
 */
const PassengerName = memo(({ passenger, getSrrTooltip }) => (
    <>
        {passenger.name} {passenger.surname} {passenger.title}
        {passenger.srrCodes?.length > 0 && (
            <div className="srr-codes">
                {passenger.srrCodes.map((code, idx) => (
                    <span
                        key={idx}
                        className={`srr-code ${code.toLowerCase()}`}
                        data-tooltip={getSrrTooltip(code, passenger)}
                    >
                        {code}
                    </span>
                ))}
            </div>
        )}
    </>
));

/**
 * Funkcja pomocnicza do określania klasy wiersza
 */
const getRowClassName = (status) => {
    switch (status) {
        case 'ACC': return 'row-accepted';
        case 'STBY': return 'row-standby';
        case 'OFF': return 'row-offloaded';
        default: return '';
    }
};

export default PassengerTable;