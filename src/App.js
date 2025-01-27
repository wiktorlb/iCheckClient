// import React, { useState, useEffect } from 'react';
// import { Route, Routes, Navigate } from 'react-router-dom'; // Zaktualizowane importy
// import LoginForm from './components/LoginForm';
// import FlightBoard from './components/flightBoard/FlightBoard';
// import AddFlightForm from './components/flightBoard/AddFlightForm';
// import RegisterForm from './components/RegisterForm'; // Formularz rejestracji
// import Header from './components/header/Header'; // Importowanie Header
// import 'bootstrap/dist/css/bootstrap.min.css';
// import FlightPassengers from './components/flight/FlightPassengers';
// import UploadPassengers from './components/flight/UploadPassengers';
// import UserManagement from './components/UserManagement';

// const App = () => {
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [userRole, setUserRole] = useState(null); // Dodajemy stan na rolę

//   // Sprawdzanie, czy token istnieje w localStorage i pobieranie roli z tokenu
//  useEffect(() => {
//   const token = localStorage.getItem('jwt');
//   console.log("Token from localStorage:", token); // Logowanie tokenu

//   if (token) {
//     setIsLoggedIn(true);

//     try {
//       const decodedToken = JSON.parse(atob(token.split('.')[1])); // Dekodowanie tokenu
//       console.log("Decoded Token:", decodedToken); // Debugowanie - sprawdzamy, czy rola jest poprawnie pobierana

//       if (decodedToken && decodedToken.role) {
//         setUserRole(decodedToken.role); // Ustawienie roli, jeśli jest dostępna
//       } else {
//         console.error("Token does not contain a role.");
//       }
//     } catch (error) {
//       console.error("Error decoding token:", error); // Wydrukowanie błędu dekodowania
//     }
//   } else {
//     console.log("No token found in localStorage");
//   }
// }, []); // Pusty array, żeby kod wykonywał się tylko przy załadowaniu komponentu

//   // Funkcja logowania, ustawia stan na true
//   const handleLogin = () => {
//     setIsLoggedIn(true);
//   };

//   // Funkcja wylogowania, ustawia stan na false
//   const handleLogout = () => {
//     localStorage.removeItem('jwt'); // Usuwanie tokenu z localStorage
//     setIsLoggedIn(false); // Ustawienie stanu na false
//     setUserRole(null); // Reset roli
//   };

//   console.log("isLoggedIn:", isLoggedIn); // Debugowanie, czy stan isLoggedIn jest ustawiony
//   console.log("userRole:", userRole); // Debugowanie, czy rola jest ustawiona na "ADMIN"

//   return (
//     <div>
//       {isLoggedIn && <Header onLogout={handleLogout} />} {/* Wyświetlanie Header tylko, gdy użytkownik jest zalogowany */}

//       <Routes>
//         {/* Ścieżka logowania */}
//         <Route path="/login" element={isLoggedIn ? <Navigate to="/flightboard" /> : <LoginForm onLogin={handleLogin} />} />

//         {/* Ścieżka rejestracji */}
//         <Route path="/register" element={isLoggedIn ? <RegisterForm /> : <RegisterForm />} />

//         {/* Ścieżka do FlightBoard */}
//         <Route path="/flightboard" element={isLoggedIn ? <FlightBoard onLogout={handleLogout} /> : <Navigate to="/login" />} />

//         {/* Dodanie Rejsu (dostępne tylko dla zalogowanych użytkowników) */}
//         <Route path="/add-flight" element={isLoggedIn ? <AddFlightForm /> : <Navigate to="/login" />} />

//         {/* Ścieżka dla pasażerów danego lotu */}
//         <Route path="/flights/:flightId/passengers" element={isLoggedIn ? <FlightPassengers /> : <Navigate to="/login" />} />

//         {/* Ścieżka do dodania pasażerów */}
//         <Route path="/flights/:flightId/upload-passengers" element={isLoggedIn ? <UploadPassengers /> : <Navigate to="/login" />} />

//         {/* Ścieżka do strony zarządzania użytkownikami */}
//         <Route
//           path="/management"
//           element={
//             isLoggedIn && userRole === 'ADMIN' ? (
//               <UserManagement />
//             ) : (
//               <>
//                 <div>Access Denied: {isLoggedIn ? "User is logged in, but not an ADMIN" : "User is not logged in"}</div>
//                 <Navigate to="/flightboard" />
//               </>
//             )
//           }
//         />

//         {/* Domyślna ścieżka, przekierowuje do logowania */}
//         <Route path="/" element={<Navigate to="/login" />} />
//       </Routes>
//     </div>
//   );
// };

// export default App;
import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import FlightBoard from './components/flightBoard/FlightBoard';
import AddFlightForm from './components/flightBoard/AddFlightForm';
import RegisterForm from './components/RegisterForm';
import Header from './components/header/Header';
import 'bootstrap/dist/css/bootstrap.min.css';
import FlightPassengers from './components/flight/FlightPassengers';
import UploadPassengers from './components/flight/UploadPassengers';
import UserManagement from './components/UserManagement';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Sprawdzamy token po załadowaniu komponentu
  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (token) {
      setIsLoggedIn(true);

      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setUserRole(decodedToken.role); // Ustawiamy rolę na podstawie tokenu
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []); // Uruchamiamy tylko raz, przy pierwszym renderze

  // Funkcja logowania
  const handleLogin = () => {
    setIsLoggedIn(true);
    // Pobieranie roli z tokenu po zalogowaniu
    const token = localStorage.getItem('jwt');
    if (token) {
      try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        setUserRole(decodedToken.role);
      } catch (error) {
        console.error("Error decoding token after login:", error);
      }
    }
  };

  // Funkcja wylogowania
  const handleLogout = () => {
    localStorage.removeItem('jwt');
    setIsLoggedIn(false);
    setUserRole(null); // Reset roli po wylogowaniu
  };

  return (
    <div>
      {isLoggedIn && <Header onLogout={handleLogout} />}

      <Routes>
        {/* Ścieżka logowania */}
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/flightboard" /> : <LoginForm onLogin={handleLogin} />}
        />

        {/* Ścieżka rejestracji */}
        <Route
          path="/register"
          element={
            isLoggedIn && userRole === 'ADMIN' ? (
              <RegisterForm />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Ścieżka do FlightBoard */}
        <Route
          path="/flightboard"
          element={
            isLoggedIn && (userRole === 'ADMIN' || userRole === 'USER' || userRole === 'LEADER') ? (
              <FlightBoard />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Dodanie Rejsu (dostępne tylko dla zalogowanych użytkowników) */}
        <Route
          path="/add-flight"
          element={
            isLoggedIn && (userRole === 'ADMIN' ||  userRole === 'LEADER') ? (
              <AddFlightForm />
            ) : (
              <Navigate to="/flightboard" />
            )
          }
        />

        {/* Ścieżka do pasażerów danego lotu */}
        <Route
          path="/flights/:flightId/passengers"
          element={
            isLoggedIn && (userRole === 'ADMIN' || userRole === 'USER' || userRole === 'LEADER') ? (
              <FlightPassengers />
            ) : (
              <Navigate to="/flightboard" />
            )
          }
        />

        {/* Ścieżka do dodania pasażerów */}
        <Route
          path="/flights/:flightId/upload-passengers"
          element={
            isLoggedIn && (userRole === 'ADMIN' || userRole === 'LEADER') ? (
              <UploadPassengers />
            ) : (
              <Navigate to="/flightboard" />
            )
          }
        />

        {/* Ścieżka do strony zarządzania użytkownikami */}
        <Route
          path="/management"
          element={
            isLoggedIn && userRole === 'ADMIN' ? (
              <UserManagement />
            ) : (
              <Navigate to="/flightboard" />
            )
          }
        />

        {/* Domyślna ścieżka, przekierowuje do logowania */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
};

export default App;