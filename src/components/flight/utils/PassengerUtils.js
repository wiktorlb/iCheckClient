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

/**
 * Pobiera szczegóły wybranych pasażerów
 */
export const getSelectedPassengerDetails = (passengers, selectedPassengers, newStatus) => {
    return passengers
        .filter(passenger => selectedPassengers.includes(passenger.id))
        .map(passenger => ({
            ...passenger,
            status: newStatus || passenger.status
        }));
};

export default updatePassengersStatus;