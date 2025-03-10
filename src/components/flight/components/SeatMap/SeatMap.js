/* import React, { useEffect } from 'react';
import './style.css'; // Upewnij się, że masz odpowiednie style

const SeatMap = ({ seatMap }) => {
    useEffect(() => {
        if (!seatMap) {
            console.error('seatMap is undefined');
        } else if (!Array.isArray(seatMap)) {
            console.error('seatMap is not an array:', seatMap);
        }
    }, [seatMap]);

    return (
        <div className="seatmap-container">
            {Array.isArray(seatMap) ? (
                seatMap.map((row, rowIndex) => (
                    <div key={rowIndex} className="seat-row">
                        {row.map((seat, seatIndex) => (
                            <span
                                key={seatIndex}
                                className={seat === 'X' ? 'occupied' : 'available'}
                                title={seat === 'X' ? 'Zajęte' : 'Wolne'}
                            >
                                {seat}
                            </span>
                        ))}
                    </div>
                ))
            ) : (
                <div>Error: seatMap is not valid</div>
            )}
        </div>
    );
};

export default SeatMap; */



import React from 'react';
import './style.css';

const SeatMap = ({ seatMap }) => {
    if (!Array.isArray(seatMap)) {
        console.error('seatMap is not an array:', seatMap);
        return <div>Error: Invalid seat data</div>;
    }

    return (
        <div className="seatmap-container">
            {seatMap.map((row, rowIndex) => {
                const seats = row.split(','); // Podział miejsc po przecinku

                if (seats.length !== 6) {
                    console.error(`Invalid seat row at index ${rowIndex}:`, row);
                    return <div key={rowIndex} className="seat-row error">Invalid row</div>;
                }

                const rowNumber = seats[0].match(/\d+/)[0]; // Pobiera numer rzędu
                const firstGroup = seats.slice(0, 3).map(seat => seat.replace(/\d+/, '')).join('');
                const secondGroup = seats.slice(3, 6).map(seat => seat.replace(/\d+/, '')).join('');

                return (
                    <div key={rowIndex} className="seat-row">
                        <span className="row-number">{rowNumber}</span>
                        <div className="seat-name-group">
                            <span className="seat-group">{firstGroup}</span>
                            <span className="seat-group">{secondGroup}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SeatMap;




