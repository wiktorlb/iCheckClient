// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import axiosInstance from '../../api/axiosConfig';
// import './style.css';

// const FlightBoard = () => {
//   const [flights, setFlights] = useState([]);
//   const [selectedDate, setSelectedDate] = useState('');
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(false); // Dodano loading state
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 10;

//   useEffect(() => {
//     const jwt = localStorage.getItem('jwt');

//     if (jwt) {
//       axiosInstance
//         .get('/api/flights', { headers: { Authorization: `Bearer ${jwt}` } })
//         .then((response) => {
//           if (Array.isArray(response.data)) {
//             setFlights(response.data);
//           } else {
//             setFlights([]);
//             setError(response.data);
//           }
//         })
//         .catch((error) => {
//           console.error('Error fetching flights:', error);
//           setError('Failed to fetch flights.');
//         });
//     } else {
//       window.location.href = '/login';
//     }
//   }, []);

//   const deleteFlight = async (flightId) => {
//     const jwt = localStorage.getItem('jwt');
//     if (!jwt) return window.location.href = '/login';

//     setLoading(true); // Aktywacja ekranu ładowania
//     try {
//       const response = await axiosInstance.delete(`/api/flights/${flightId}`, {
//         headers: { Authorization: `Bearer ${jwt}` },
//       });

//       setFlights(flights.filter((flight) => flight.id !== flightId));
//     } catch (error) {
//       console.error('Error deleting flight:', error);
//       alert('Failed to delete flight.');
//     } finally {
//       setLoading(false); // Dezaktywacja ekranu ładowania
//     }
//   };

//   const filteredFlights = flights.filter((flight) =>
//     !selectedDate || flight.departureDate === selectedDate
//   );

//   const totalItems = filteredFlights.length;
//   const totalPages = Math.ceil(totalItems / itemsPerPage);
//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const currentFlights = filteredFlights.slice(startIndex, startIndex + itemsPerPage);

//   return (
//     <section>
//       {/* Pełnoekranowy ekran ładowania */}
//       {loading && (
//         <div className="loading-screen">
//           <div className="spinner"></div>
//         </div>
//       )}

//       <main className="main">
//         {error && <div className="error-message">{error}</div>}

//         <div className="date-picker">
//           <label htmlFor="date">Filter by Date</label>
//           <input type="date" id="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
//         </div>

//         {currentFlights.length > 0 ? (
//           <table className="flight-table">
//             <thead>
//               <tr className="flightBoard-title">
//                 <th>No.</th>
//                 <th>Flight</th>
//                 <th>Route</th>
//                 <th>State</th>
//                 <th>Departure</th>
//                 <th>Action</th>
//               </tr>
//             </thead>
//             <tbody>
//               {currentFlights.map((flight, index) => (
//                 <tr key={flight.id}>
//                   <td>{startIndex + index + 1}</td>
//                   <td>
//                     <span className={`flight ${flight.state.toLowerCase()}`}>
//                       <Link to={`/flights/${flight.id}/passengers`} className="action-link">
//                         {flight.flightNumber}
//                       </Link>
//                     </span>
//                   </td>
//                   <td>{flight.route}</td>
//                   <td>{flight.state}</td>
//                   <td>{flight.departureTime}</td>
//                   <td>
//                     <Link to={`/flights/${flight.id}/passengers`} className="action-link">ENTER</Link>
//                     <button
//                       onClick={() => deleteFlight(flight.id)}
//                       className="delete-button"
//                       disabled={loading} // Dezaktywacja przycisku podczas usuwania
//                     >
//                       DELETE
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         ) : (
//           <div>No flights available for the selected date.</div>
//         )}

//         {/* Paginacja */}
//         {totalPages > 1 && (
//           <div className="pagination">
//             {Array.from({ length: totalPages }, (_, index) => (
//               <button
//                 key={index + 1}
//                 className={`page-button ${currentPage === index + 1 ? 'active' : ''}`}
//                 onClick={() => setCurrentPage(index + 1)}
//               >
//                 {index + 1}
//               </button>
//             ))}
//           </div>
//         )}

//         <div className="add-flight-button">
//           <Link to="/add-flight"><button>Add New Flight</button></Link>
//         </div>
//         <div className="add-flight-button">
//           <Link to="/register"><button>Add New User</button></Link>
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
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const jwt = localStorage.getItem('jwt');

    if (jwt) {
      axiosInstance
        .get('/api/flights', { headers: { Authorization: `Bearer ${jwt}` } })
        .then((response) => {
          if (Array.isArray(response.data)) {
            setFlights(response.data);
          } else {
            setFlights([]);
            setError(response.data);
          }
        })
        .catch((error) => {
          console.error('Error fetching flights:', error);
          setError('Failed to fetch flights.');
        });
    } else {
      window.location.href = '/login';
    }
  }, []);

  const deleteFlight = async (flightId) => {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) return window.location.href = '/login';

    setLoading(true);
    try {
      const response = await axiosInstance.delete(`/api/flights/${flightId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });

      setFlights(flights.filter((flight) => flight.id !== flightId));
    } catch (error) {
      console.error('Error deleting flight:', error);
      alert('Failed to delete flight.');
    } finally {
      setLoading(false);
    }
  };

  const filteredFlights = flights.filter((flight) =>
    !selectedDate || flight.departureDate === selectedDate
  );

  const totalItems = filteredFlights.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentFlights = filteredFlights.slice(startIndex, startIndex + itemsPerPage);

  return (
    <section>
      {loading && (
        <div className="loading-screen">
          <div className="spinner"></div>
        </div>
      )}

      <main className="main">
        {error && <div className="error-message">{error}</div>}

        <div className="date-picker">
          <label htmlFor="date">Filter by Date</label>
          <input type="date" id="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>

        {currentFlights.length > 0 ? (
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
              {currentFlights.map((flight, index) => (
                <tr key={flight.id}>
                  <td>{startIndex + index + 1}</td>
                  <td>
                    <span className={flight.state.toLowerCase()}>
                      <Link to={`/flights/${flight.id}/passengers`} className="action-link">
                        {flight.flightNumber}
                      </Link>
                    </span>
                  </td>
                  <td>{flight.route}</td>
                  <td>{flight.state}</td>
                  <td>{flight.departureTime}</td>
                  <td>
                    <Link to={`/flights/${flight.id}/passengers`} className="action-link">ENTER</Link>
                    <button
                      onClick={() => deleteFlight(flight.id)}
                      className="delete-button"
                      disabled={loading}
                    >
                      DELETE
                    </button>
                    <Link to={`/flights/${flight.id}/upload-passengers`} className="action-link">
                      <button className="add-passengers-btn">Add Passengers</button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div>No flights available for the selected date.</div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                className={`page-button ${currentPage === index + 1 ? 'active' : ''}`}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}

        <div className="add-flight-button">
          <Link to="/add-flight"><button>Add New Flight</button></Link>
        </div>
        <div className="add-flight-button">
          <Link to="/register"><button>Add New User</button></Link>
        </div>
      </main>
    </section>
  );
};

export default FlightBoard;