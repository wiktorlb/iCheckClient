import React, { useEffect, useState } from 'react';
import axiosInstance from '../../../../api/axiosConfig';
import './style.css';

/**
 * Seat Map Component
 *
 * Interactive seat map visualization for aircraft cabin layout.
 * Features include:
 * - Visual representation of seat layout
 * - Occupancy status display
 * - Seat selection functionality
 * - Responsive design
 *
 * @component
 * @param {Object} props
 * @param {string} props.flightId - Unique identifier for the flight
 * @param {Object} props.seatMap - Seat map configuration data
 * @param {Array} props.occupiedSeats - List of occupied seat numbers
 */
const SeatMap = ({ flightId, seatMap, occupiedSeats = [], onSeatClick, selectedPassenger, passengers: passengersProp }) => {
    const [passengers, setPassengers] = useState([]);
    const [error, setError] = useState(null);

    // Use passengers from props if provided, otherwise fetch them
    useEffect(() => {
        if (passengersProp) {
            setPassengers(passengersProp);
        } else {
            const fetchPassengers = async () => {
                if (!flightId) return;

                try {
                    const response = await axiosInstance.get(`/api/passengers/flights/${flightId}/passengers-with-srr`);
                    setPassengers(response.data);
                } catch (error) {
                    console.error('Error fetching passengers:', error);
                    setError('Błąd podczas pobierania danych pasażerów');
                }
            };

            fetchPassengers();
        }
    }, [flightId, passengersProp]);

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
        return passenger && passenger.status && passenger.status.toUpperCase() === 'BOARDED';
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

    const renderSeatGroup = (groupSeats) => groupSeats.map(seat => {
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

    const determineLayout = (seats) => {
        switch (seats.length) {
            case 4:
                return [[0, 2], [2, 4]];
            case 6:
                return [[0, 3], [3, 6]];
            case 7:
                return [[0, 3], [3, 4], [4, 7]];
            case 10:
                return [[0, 3], [3, 7], [7, 10]];
            case 12:
                return [[0, 3], [3, 7], [7, 10], [10, 12]];
            default:
                return null;
        }
    };

    return (
        <div className="seatmap-container">
            {seatMap.map((row, rowIndex) => {
                if (typeof row !== 'string') {
                    return <div key={rowIndex} className="seat-row error">Nieprawidłowy format wiersza</div>;
                }

                const seats = row.split(',');
                const layout = determineLayout(seats);

                if (!layout) {
                    return <div key={rowIndex} className="seat-row error">Nieprawidłowa liczba miejsc w wierszu</div>;
                }

                const rowNumber = seats[0].replace(/[A-Z]/g, '');

                const rowSegments = layout.flatMap(([start, end], groupIndex) => {
                    const group = (
                        <div key={`${rowIndex}-${groupIndex}`} className="seat-group">
                            {renderSeatGroup(seats.slice(start, end))}
                        </div>
                    );

                    const separator = groupIndex < layout.length - 1
                        ? <span key={`${rowIndex}-separator-${groupIndex}`} className="row-number">{rowNumber}</span>
                        : null;

                    return separator ? [group, separator] : [group];
                });

                return (
                    <div key={rowIndex} className="seat-row">
                        <div className="seat-name-group seat-layout">
                            {rowSegments}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SeatMap;




