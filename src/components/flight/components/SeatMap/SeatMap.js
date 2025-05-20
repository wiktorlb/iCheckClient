import React, { useEffect, useState } from 'react';
import axiosInstance from '../../../../api/axiosConfig';
import './style.css';

const SeatMap = ({ flightId, seatMap, occupiedSeats = [], onSeatClick, selectedPassenger }) => {
    const [passengers, setPassengers] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPassengers = async () => {
            if (!flightId) return;

            try {
                const response = await axiosInstance.get(`/api/passengers/flights/${flightId}/passengers-with-srr`);
                console.log('Passengers response:', response.data);
                setPassengers(response.data);
            } catch (error) {
                console.error('Error fetching passengers:', error);
                setError('Błąd podczas pobierania danych pasażerów');
            }
        };

        fetchPassengers();
    }, [flightId]);

    useEffect(() => {
        console.log('SeatMap props:', {
            seatMap,
            occupiedSeats,
            selectedPassenger,
            passengers
        });
    }, [seatMap, occupiedSeats, selectedPassenger, passengers]);

    useEffect(() => {
        if (!seatMap) {
            console.error('seatMap is undefined');
        } else if (!Array.isArray(seatMap)) {
            console.error('seatMap is not an array:', seatMap);
        }
    }, [seatMap]);

    if (!Array.isArray(seatMap)) {
        console.error('seatMap is not an array:', seatMap);
        return <div className="error">Błąd: Nieprawidłowe dane miejsc</div>;
    }

    // Funkcja sprawdzająca, czy miejsce jest zajęte
    const isSeatOccupied = (seatNumber) => {
        return occupiedSeats.includes(seatNumber);
    };

    // Funkcja zwracająca pasażera przypisanego do danego miejsca
    const getPassengerForSeat = (seatNumber) => {
        return passengers.find(passenger => passenger.seatNumber === seatNumber);
    };

    // Funkcja sprawdzająca, czy pasażer jest zboardowany
    const isPassengerBoarded = (seatNumber) => {
        const passenger = getPassengerForSeat(seatNumber);
        return passenger && passenger.status === 'BOARDED';
    };

    // Funkcja generująca tooltip dla miejsca
    const getSeatTooltip = (seatNumber) => {
        const passenger = getPassengerForSeat(seatNumber);
        if (passenger) {
            const srrCodes = passenger.srrcodes || passenger.srrCodes || [];
            return `${passenger.name} ${passenger.surname}\nStatus: ${passenger.status}\nKody SSR: ${srrCodes.length > 0 ? srrCodes.join(', ') : 'brak'}`;
        }
        return isSeatOccupied(seatNumber) ? 'Zajęte' : 'Wolne';
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

    if (error) {
        return <div className="error">{error}</div>;
    }

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
                    const isBoarded = isPassengerBoarded(seat);
                    const tooltip = getSeatTooltip(seat);

                    return (
                        <span
                            key={seat}
                            className={`seat ${isOccupied ? (isBoarded ? 'boarded' : 'occupied') : 'available'}`}
                            title={tooltip}
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
                    const isBoarded = isPassengerBoarded(seat);
                    const tooltip = getSeatTooltip(seat);

                    return (
                        <span
                            key={seat}
                            className={`seat ${isOccupied ? (isBoarded ? 'boarded' : 'occupied') : 'available'}`}
                            title={tooltip}
                            onClick={() => handleSeatClick(seat)}
                        >
                            {seatLetter}
                        </span>
                    );
                });

                return (
                    <div key={rowIndex} className="seat-row">
                       {/*  <span className="row-number">{rowNumber}</span> */}
                        <div className="seat-name-group">
                            <div className="seat-group">{firstGroupSeats}</div>
                            <span className="row-number">{rowNumber}</span>
                            <div className="seat-group">{secondGroupSeats}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SeatMap;




