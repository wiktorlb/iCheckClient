import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://localhost:8080',
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    },
});

// Interceptor request do dodawania tokenu JWT
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('jwt'); // Pobierz token z localStorage
        if (token) {
            config.headers.Authorization = `Bearer ${token}`; // Dodaj nagłówek Authorization
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default axiosInstance;