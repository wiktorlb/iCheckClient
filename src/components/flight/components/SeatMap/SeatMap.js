import React, { useEffect } from 'react';
import './style.css';

const SeatMap = ({ seatMap, occupiedSeats = [], onSeatClick, selectedPassenger }) => {
    useEffect(() => {
        if (!seatMap) {
            console.error('seatMap is undefined');
        } else if (!Array.isArray(seatMap)) {
            console.error('seatMap is not an array:', seatMap);
        }
    }, [seatMap]);

    if (!Array.isArray(seatMap)) {
        return <div className="error">Błąd: Nieprawidłowe dane miejsc</div>;
    }

    // Funkcja sprawdzająca, czy miejsce jest zajęte
    const isSeatOccupied = (seatNumber) => {
        return occupiedSeats.includes(seatNumber);
    };

    // Funkcja obsługująca kliknięcie na miejsce
    const handleSeatClick = (seat) => {
        if (isSeatOccupied(seat)) {
            return; // Nie reaguj na kliknięcie zajętego miejsca
        }

        if (selectedPassenger && onSeatClick) {
            onSeatClick(seat);
        }
    };

    return (
        <div className="seatmap-container">
            {seatMap.map((row, rowIndex) => {
                // Sprawdzamy, czy wiersz jest stringiem
                if (typeof row !== 'string') {
                    return <div key={rowIndex} className="seat-row error">Nieprawidłowy format wiersza</div>;
                }

                // Podział miejsc po przecinku
                const seats = row.split(',');

                if (seats.length !== 6) {
                    return <div key={rowIndex} className="seat-row error">Nieprawidłowa liczba miejsc w wierszu</div>;
                }

                // Pobieranie numeru rzędu z pierwszego miejsca
                const rowNumber = seats[0].replace(/[A-Z]/g, '');

                // Przetwarzanie pierwszej grupy miejsc (3 miejsca)
                const firstGroupSeats = seats.slice(0, 3).map(seat => {
                    const seatLetter = seat.replace(/\d+/g, '');
                    const isOccupied = isSeatOccupied(seat);
                    return (
                        <span
                            key={seat}
                            className={`seat ${isOccupied ? 'occupied' : 'available'}`}
                            title={isOccupied ? 'Zajęte' : 'Wolne'}
                            onClick={() => handleSeatClick(seat)}
                        >
                            {seatLetter}
                        </span>
                    );
                });

                // Przetwarzanie drugiej grupy miejsc (3 miejsca)
                const secondGroupSeats = seats.slice(3, 6).map(seat => {
                    const seatLetter = seat.replace(/\d+/g, '');
                    const isOccupied = isSeatOccupied(seat);
                    return (
                        <span
                            key={seat}
                            className={`seat ${isOccupied ? 'occupied' : 'available'}`}
                            title={isOccupied ? 'Zajęte' : 'Wolne'}
                            onClick={() => handleSeatClick(seat)}
                        >
                            {seatLetter}
                        </span>
                    );
                });

                return (
                    <div key={rowIndex} className="seat-row">
                        <span className="row-number">{rowNumber}</span>
                        <div className="seat-name-group">
                            <div className="seat-group">{firstGroupSeats}</div>
                            <div className="seat-group">{secondGroupSeats}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SeatMap;




