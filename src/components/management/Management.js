import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom'; // Zaimportuj useNavigate
import axiosInstance from '../../api/axiosConfig'; // Instancja axios
import AddFlightForm from '../../components/flightBoard/AddFlightForm';
import RegisterForm from '../../components/RegisterForm'; // Formularz rejestracji

const Management = () => {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [userRoles, setUserRoles] = useState([]);
    const navigate = useNavigate(); // Inicjalizacja navigate

    useEffect(() => {
        const checkAuthorization = async () => {
            try {
                // Pobierz dane użytkownika z backendu
                const response = await axiosInstance.get('/api/auth/userinfo', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('jwt')}` },
                });
                setUserRoles(response.data.roles); // Zakładamy, że backend zwraca role użytkownika jako tablicę

                // Sprawdź, czy użytkownik ma rolę admin
                if (response.data.roles.includes('admin')) {
                    setIsAuthorized(true);
                } else {
                    setErrorMessage('You do not have permission to access this page.');
                }
            } catch (error) {
                console.error('Authorization error:', error);
                setErrorMessage('An error occurred while checking permissions.');
            }
        };

        checkAuthorization();
    }, []);

    if (!isAuthorized) {
        return <Navigate to="/" />; // Przekierowanie na stronę główną, jeśli nie jest autoryzowany
    }

    return (
        <div>
            <h1>Management</h1>
            <p>Welcome to the admin management page. Select an action:</p>
            <div>
                <button onClick={() => navigate('/add-flight')}>Add Flight</button>
                <button onClick={() => navigate('/register-user')}>Register User</button>
            </div>
        </div>
    );
};

export default Management;