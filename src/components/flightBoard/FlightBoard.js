// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom'; // Importujemy Link
// import axiosInstance from '../../api/axiosConfig'; // Importujemy instancję axios
// import './style.css';

// const FlightBoard = () => {
//   const [flights, setFlights] = useState([]);
//   const [selectedDate, setSelectedDate] = useState(''); // Dodajemy stan dla filtrowanej daty

//   // Pobieranie danych lotów z API
//   useEffect(() => {
//     const jwt = localStorage.getItem('jwt');
//     console.log('JWT Token from localStorage:', jwt);

//     if (jwt) {
//       axiosInstance
//         .get('/api/flights', {
//           headers: { Authorization: `Bearer ${jwt}` },
//         })
//         .then((response) => {
//           setFlights(response.data); // Ustawienie danych lotów
//         })
//         .catch((error) => {
//           console.error('Error fetching flights:', error);
//         });
//     } else {
//       window.location.href = '/login'; // Przekierowanie do logowania
//     }
//   }, []);

//   // Obsługa zmiany daty
//   const handleDateChange = (e) => {
//     setSelectedDate(e.target.value);
//   };

//   // Filtrowanie lotów według wybranej daty
//   const filteredFlights = flights.filter((flight) =>
//     !selectedDate || flight.departureDate === selectedDate
//   );

//   return (
//     <section>
//       <main className="main">
//         {/* Filtrowanie po dacie */}
//         <div className="date-picker">
//           <label htmlFor="date">Filter by Date</label>
//           <input
//             type="date"
//             id="date"
//             value={selectedDate}
//             onChange={handleDateChange}
//           />
//         </div>

//         {/* Tabela z lotami */}
//         <table className="flight-table">
//           <thead>
//             <tr className="flightBoard-title">
//               <th>No.</th>
//               <th>Flight</th>
//               <th>Route</th>
//               <th>State</th>
//               <th>Departure</th>
//               <th>Action</th>
//             </tr>
//           </thead>
//           <tbody>
//             {filteredFlights.map((flight, index) => (
//               <tr key={flight._id}>
//                 <td>{index + 1}.</td>
//                 <td>
//                   <span className={`flight ${flight.state.toLowerCase()}`}>
//                     <a href="#" className="flight-board-link">
//                       {flight.flightNumber}
//                     </a>
//                   </span>
//                 </td>
//                 <td>{flight.route}</td>
//                 <td>{flight.state}</td>
//                 <td>{flight.departureTime}</td>
//                 <td>
//                   <a href="#" className="action-link">
//                     ENTER
//                   </a>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         {/* Przycisk dodania nowego lotu */}
//         <div className="add-flight-button">
//           <Link to="/add-flight">
//             <button>Add New Flight</button>
//           </Link>
//         </div>
//       </main>
//     </section>
//   );
// };

// export default FlightBoard;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosConfig';
import './style.css';

const FlightBoard = () => {
  const [flights, setFlights] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => {
    const jwt = localStorage.getItem('jwt');
    console.log('JWT Token from localStorage:', jwt);

    if (jwt) {
      axiosInstance
        .get('/api/flights', {
          headers: { Authorization: `Bearer ${jwt}` },
        })
        .then((response) => {
          setFlights(response.data);
        })
        .catch((error) => {
          console.error('Error fetching flights:', error);
        });
    } else {
      window.location.href = '/login';
    }
  }, []);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const filteredFlights = flights.filter((flight) =>
    !selectedDate || flight.departureDate === selectedDate
  );

  return (
    <section>
      <main className="main">
        <div className="date-picker">
          <label htmlFor="date">Filter by Date</label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={handleDateChange}
          />
        </div>

        <table className="flight-table">
          <thead>
            <tr className="flightBoard-title">
              <th>No.</th>
              <th>Flight</th>
              <th>Route</th>
              <th>State</th>
              <th>Departure</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredFlights.map((flight, index) => (
              <tr key={flight._id}>
                <td>{index + 1}.</td>
                <td>
                  <span className={`flight ${flight.state.toLowerCase()}`}>
                    <a href="#" className="flight-board-link">
                      {flight.flightNumber}
                    </a>
                  </span>
                </td>
                <td>{flight.route}</td>
                <td>{flight.state}</td>
                <td>{flight.departureDate} {flight.departureTime}</td>
                <td>
                  <a href="#" className="action-link">
                    ENTER
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="add-flight-button">
          <Link to="/add-flight">
            <button>Add New Flight</button>
          </Link>
        </div>
      </main>
    </section>
  );
};

export default FlightBoard;