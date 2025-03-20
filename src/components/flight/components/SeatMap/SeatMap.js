import React from 'react';
import './style.css';

import { useEffect, useState } from "react";

const SeatMap = ({ seatMap }) => {
/*
zmienic na axios

 */
    const [occupiedSeats, setOccupiedSeats] = useState([]);

    useEffect(() => {
        fetch(`http://localhost:8080/flights/12345/occupied-seats`)
            .then(response => response.json())
            .then(data => setOccupiedSeats(data))
            .catch(error => console.error("Error fetching occupied seats:", error));
    }, []);

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

                return (
                    <div key={rowIndex} className="seat-row">
                        <span className="row-number">{rowNumber}</span>
                        <div className="seat-name-group">
                            {seats.map((seat, seatIndex) => {
                                const seatLabel = seat.trim();
                                const isOccupied = occupiedSeats.includes(seatLabel);

                                return (
                                    <span key={seatIndex} className={`seat ${isOccupied ? 'occupied' : ''}`}>
                                        {seatLabel}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SeatMap;




