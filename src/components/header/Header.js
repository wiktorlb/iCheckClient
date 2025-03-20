import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom'; // Import Link z react-router-dom
import Button from "react-bootstrap/Button";
import "./style.css";

const Header = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Wywołanie funkcji przekazanej jako prop (onLogout) z App.js
    onLogout();
    navigate('/'); // Po wylogowaniu przekierowanie na stronę logowania
  };

  const handleHome = () => {
    navigate('/flightBoard');
  }

  return (
    <header className="header">
      <div className="logo"><a onClick={handleHome}>iCheck</a></div>
      <nav className="nav">
        <Link to="/management">USERS</Link>
        <Link to="/flightboard">FLIGHTS</Link>
        <a href="#">CHECK-IN</a>
        <a href="#">BOARDING</a>
        <a href="#">SORTATION</a>
        <a href="#" className="logout-link" onClick={handleLogout}> LOGOUT </a>
      </nav>
    </header>
  );
};

export default Header;