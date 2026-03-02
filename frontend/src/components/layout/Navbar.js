import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import './Navbar.css';

const Navbar = ({ variant = 'landing' }) => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">Pharma4U</Link>
        
        {variant === 'landing' && (
          <div className="navbar-menu">
            <button className="navbar-link">About</button>
            <button className="navbar-link">How it Works</button>
            <Link to="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="primary">Get Started</Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
