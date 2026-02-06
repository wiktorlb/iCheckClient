import axiosInstance from '../../../api/axiosConfig';
/**
 * Updates the status of selected passengers.
 * @param {Array} selectedPassengers - List of passenger IDs
 * @param {string} newStatus - Target status value
 * @param {string} jwt - JWT token
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
 * Returns details for selected passengers with optional status override.
 */
export const getSelectedPassengerDetails = (passengers, selectedIds, status) => {
    return passengers
        .filter(p => selectedIds.includes(p.id))
        .map(p => ({
            id: p.id,
            name: p.name,
            surname: p.surname,
            status: status || p.status,
            flightId: p.flightId
        }));
};

export default updatePassengersStatus;