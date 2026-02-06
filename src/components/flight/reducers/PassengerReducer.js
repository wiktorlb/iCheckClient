/**
 * INITIAL STATE
 */
export const initialState = {
    passengers: [],
    selectedPassengers: [],
    error: null,
    searchTerm: ''
};

/**
 * Reducer managing state for the FlightPassengers component.
 * @param {Object} state - Current state
 * @param {Object} action - Action to process
 * @returns {Object} Updated state
 */
export const passengerReducer = (state, action) => {
    switch (action.type) {
        case 'SET_PASSENGERS':
            return {
                ...state,
                passengers: action.payload,
                error: null
            };

        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload
            };

        case 'SET_SEARCH_TERM':
            return {
                ...state,
                searchTerm: action.payload
            };

        case 'TOGGLE_PASSENGER_SELECTION':
            return {
                ...state,
                selectedPassengers: state.selectedPassengers.includes(action.payload)
                    ? state.selectedPassengers.filter(id => id !== action.payload)
                    : [...state.selectedPassengers, action.payload]
            };

        case 'UPDATE_PASSENGERS_STATUS':
            return {
                ...state,
                passengers: state.passengers.map(passenger =>
                    action.payload.selectedPassengers.includes(passenger.id)
                        ? { ...passenger, status: action.payload.newStatus }
                        : passenger
                )
            };

        case 'CLEAR_SELECTION':
            return {
                ...state,
                selectedPassengers: []
            };

        case 'SET_SELECTED_PASSENGERS':
            return {
                ...state,
                selectedPassengers: action.payload
            };

        default:
            return state;
    }
};

export default passengerReducer;