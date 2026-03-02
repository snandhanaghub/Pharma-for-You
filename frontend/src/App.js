import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CheckInteractionPage from './pages/CheckInteractionPage';
import CheckOCRPage from './pages/CheckOCRPage';
import ResultPage from './pages/ResultPage';
import AccountPage from './pages/AccountPage';

// Layout
import Navbar from './components/layout/Navbar';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Landing Page - No Navbar needed, it has its own */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Login Page - No layout */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Dashboard Routes - With Navbar */}
          <Route path="/dashboard" element={
            <>
              <Navbar variant="dashboard" />
              <DashboardPage />
            </>
          } />
          
          <Route path="/check-interaction" element={
            <>
              <Navbar variant="dashboard" />
              <CheckInteractionPage />
            </>
          } />
          
          <Route path="/check-ocr" element={
            <>
              <Navbar variant="dashboard" />
              <CheckOCRPage />
            </>
          } />
          
          <Route path="/result" element={
            <>
              <Navbar variant="dashboard" />
              <ResultPage />
            </>
          } />
          
          <Route path="/account" element={
            <>
              <Navbar variant="dashboard" />
              <AccountPage />
            </>
          } />
          
          {/* Redirect unknown routes to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
