import axiosInstance from '../../../api/axiosConfig';
/**
 * Aktualizuje status wybranych pasażerów
 * @param {Array} selectedPassengers - Lista ID wybranych pasażerów
 * @param {string} newStatus - Nowy status
 * @param {string} jwt - Token JWT
 */
export const updatePassengersStatus = async (selectedPassengers, newStatus, jwt) => {
    return Promise.all(selectedPassengers.map(passengerId =>
        axiosInstance.put(
            `/api/passengers/${passengerId}/status`,
            newStatus,
            {
                headers: {
                    Authorization: `Bearer ${jwt}`,
                    "Content-Type": "text/plain"
                }
            }
        )
    ));
};

export const releasePassengerSeat = async ({ flightId, passengerId, seatNumber }) => {
    if (!flightId || !passengerId || !seatNumber) {
        return;
    }

    return axiosInstance.post('/api/passengers/release-seat', {
        flightId,
        passengerId,
        seatNumber
    }).catch((error) => {
        console.error('Failed to release seat', error);
        throw error;
    });
};

/**
 * Pobiera szczegóły wybranych pasażerów
 */
/* export const getSelectedPassengerDetails = (passengers, selectedPassengers, newStatus) => {
    return passengers
        .filter(passenger => selectedPassengers.includes(passenger.id))
        .map(passenger => ({
            ...passenger,
            status: newStatus || passenger.status
        }));
}; */

export const getSelectedPassengerDetails = (passengers, selectedIds, status) => {
    return passengers
        .filter(p => selectedIds.includes(p.id))
        .map(p => ({
            id: p.id,
            name: p.name,
            surname: p.surname,
            status: status || p.status,
            flightId: p.flightId  // Dodane flightId!
        }));
};

export default updatePassengersStatus;