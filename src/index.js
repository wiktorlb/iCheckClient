import React from 'react';
import ReactDOM from 'react-dom';
import './index.css'; // Jeśli masz plik CSS
import App from './App'; // Import głównego komponentu aplikacji
import { BrowserRouter as Router } from 'react-router-dom'; // Import Routera do obsługi routingu

// Użyj createRoot zamiast render
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Router>
    <App />
  </Router>,
);