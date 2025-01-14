// import React, { useState, useEffect } from 'react';
// import axios from '../../api/axiosConfig';

// const AddFlightForm = () => {
//     const [flightData, setFlightData] = useState({
//         flightNumber: '',
//         destination: '',
//         departureDate: '',
//         departureTime: '',
//     });
//     const [destinations, setDestinations] = useState([]);
//     const [successMessage, setSuccessMessage] = useState('');
//     const [errorMessage, setErrorMessage] = useState('');

//     useEffect(() => {
//         const fetchDestinations = async () => {
//             try {
//                 const response = await axios.get('/api/destinations');
//                 setDestinations(response.data);
//             } catch (error) {
//                 console.error('Error fetching destinations:', error);
//             }
//         };

//         fetchDestinations();
//     }, []);

//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setFlightData({ ...flightData, [name]: value });
//     };

//     const handleSubmit = async (e) => {
//         e.preventDefault();

//         const jwt = localStorage.getItem('jwt');
//         if (!jwt || typeof jwt !== 'string') {
//             setErrorMessage('No JWT token found. Please login again.');
//             return;
//         }

//         const config = {
//             headers: { Authorization: `Bearer ${jwt}` },
//         };

//         const flightPayload = {
//             flightNumber: flightData.flightNumber,
//             route: `KTW - ${flightData.destination}`,
//             state: 'Prepare',
//             departureDate: flightData.departureDate,
//             departureTime: flightData.departureTime,
//         };

//         try {
//             const response = await axios.post('/api/flights', flightPayload, config);
//             if (response.status === 200) {
//                 setSuccessMessage('Flight added successfully!');
//                 setFlightData({ flightNumber: '', destination: '', departureDate: '', departureTime: '' });
//             }
//         } catch (error) {
//             setErrorMessage('An error occurred while adding the flight.');
//             console.error(error);
//         }
//     };

//     return (
//         <div>
//             <h2>Add Flight</h2>
//             <form onSubmit={handleSubmit}>
//                 <div>
//                     <label>Flight Number</label>
//                     <input
//                         type="text"
//                         name="flightNumber"
//                         value={flightData.flightNumber}
//                         onChange={handleChange}
//                         required
//                     />
//                 </div>
//                 <div>
//                     <label>Destination</label>
//                     <select
//                         name="destination"
//                         value={flightData.destination}
//                         onChange={handleChange}
//                         required
//                     >
//                         <option value="" disabled>Select a destination</option>
//                         {destinations.map((dest) => (
//                             <option key={dest._id} value={dest._id}>
//                                 {dest.name} ({dest._id})
//                             </option>
//                         ))}
//                     </select>
//                 </div>
//                 <div>
//                     <label>Departure Date</label>
//                     <input
//                         type="date"
//                         name="departureDate"
//                         value={flightData.departureDate}
//                         onChange={handleChange}
//                         required
//                     />
//                 </div>
//                 <div>
//                     <label>Departure Time</label>
//                     <input
//                         type="time"
//                         name="departureTime"
//                         value={flightData.departureTime}
//                         onChange={handleChange}
//                         required
//                     />
//                 </div>
//                 <button type="submit">Add Flight</button>
//             </form>
//             {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
//             {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
//         </div>
//     );
// };

// export default AddFlightForm;

import React, { useState, useEffect } from 'react';
import axios from '../../api/axiosConfig';

const AddFlightForm = () => {
    const [flightData, setFlightData] = useState({
        flightNumber: '',
        destination: '',
        departureDate: '',
        departureTime: '',
    });
    const [destinations, setDestinations] = useState([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const fetchDestinations = async () => {
            try {
                const response = await axios.get('/api/flights/destinations');
                console.log('Destinations:', response.data);  // Logowanie odpowiedzi z backendu
                setDestinations(response.data);
            } catch (error) {
                console.error('Error fetching destinations:', error);
            }
        };

        fetchDestinations();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFlightData({ ...flightData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const jwt = localStorage.getItem('jwt');
        if (!jwt || typeof jwt !== 'string') {
            setErrorMessage('No JWT token found. Please login again.');
            return;
        }

        const config = {
            headers: { Authorization: `Bearer ${jwt}` },
        };

        // Sprawdzanie, czy destination zawiera prawidłowe ID (np. AYT)
        if (!flightData.destination) {
            setErrorMessage('Please select a valid destination.');
            return;
        }

        const flightPayload = {
            flightNumber: flightData.flightNumber,
            route: `KTW - ${flightData.destination}`, // Teraz przesyłasz ID destynacji
            state: 'Prepare',
            departureDate: flightData.departureDate,
            departureTime: flightData.departureTime,
        };

        console.log("Flight payload:", flightPayload); // Logowanie danych przed wysłaniem

        try {
            const response = await axios.post('/api/flights', flightPayload, config);
            if (response.status === 200) {
                setSuccessMessage('Flight added successfully!');
                setFlightData({ flightNumber: '', destination: '', departureDate: '', departureTime: '' });
            }
        } catch (error) {
            setErrorMessage('An error occurred while adding the flight.');
            console.error('Error details:', error.response ? error.response.data : error.message);
        }
    };

    return (
        <div>
            <h2>Add Flight</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Flight Number</label>
                    <input
                        type="text"
                        name="flightNumber"
                        value={flightData.flightNumber}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Destination</label>
                    <select
                        name="destination"
                        value={flightData.destination}
                        onChange={handleChange}
                        required
                    >
                        <option value="" disabled>Select a destination</option>
                        {destinations.map((dest) => (
                            <option key={dest._id} value={dest._id}>
                                {dest.name} ({dest._id})  {/* Wartość to ID destynacji, np. AYT */}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Departure Date</label>
                    <input
                        type="date"
                        name="departureDate"
                        value={flightData.departureDate}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div>
                    <label>Departure Time</label>
                    <input
                        type="time"
                        name="departureTime"
                        value={flightData.departureTime}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit">Add Flight</button>
            </form>
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
        </div>
    );
};

export default AddFlightForm;