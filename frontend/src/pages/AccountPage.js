import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import SeverityBadge from '../components/ui/SeverityBadge';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import './AccountPage.css';
import '../pages/SubmitInteractionPage.css';

const AccountPage = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'User';
  const email = user?.email || 'No email available';
  const isAdmin = profile?.role === 'admin';

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const historyData = [];

  return (
    <div className="account-layout">
      <Sidebar />
      
      <main className="account-main">
        <div className="account-container">
          <Card borderLeft={true} borderColor="primary" className="profile-card">
            <div className="profile-content">
              <div className="profile-left">
                <Avatar name={displayName} size={80} />
              </div>
              
              <div className="profile-right">
                <h2 className="profile-name">{displayName}</h2>
                <p className="profile-email text-muted">{email}</p>
                <span className={`account-badge ${isAdmin ? 'admin-badge' : ''}`}>
                  {isAdmin ? '🛡️ Admin' : '⭐ Member'}
                </span>
                <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '2px' }}>
                  Role: <strong>{profile?.role || 'user'}</strong>
                </p>
              </div>
            </div>
            
            <div className="profile-actions">
              <Button variant="outline">Edit Profile</Button>
              <Button variant="outline-pink">Export History</Button>
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </div>
          </Card>


          
          <div className="history-section">
            <h2 className="history-title">Interaction History</h2>
            <div className="history-divider"></div>
            
            <Card noPadding={true} className="history-table-card">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Drug A</th>
                    <th>Drug B</th>
                    <th>Severity</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.length > 0 ? (
                    historyData.map((item) => (
                      <tr key={item.id} className="history-row">
                        <td>{item.date}</td>
                        <td>{item.drugA}</td>
                        <td>{item.drugB}</td>
                        <td>
                          <SeverityBadge severity={item.severity} />
                        </td>
                        <td>
                          <button className="view-button">View</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center text-muted" style={{ padding: '2rem' }}>
                        No interaction history found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccountPage;
