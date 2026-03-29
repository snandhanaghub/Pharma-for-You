import React from 'react';
import Sidebar from '../components/layout/Sidebar';
import Avatar from '../components/ui/Avatar';
import StatsCard from '../components/ui/StatsCard';
import { useAuth } from '../context/AuthContext';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user, profile } = useAuth();
  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'User';
  return (
    <div className="dashboard-layout">
      <Sidebar />
      
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <Avatar name={displayName} size={48} />
        </div>
        
        <div className="stats-grid">
          <StatsCard 
            title="Total Checks"
            value="0"
            icon="🔍"
          />
          <StatsCard 
            title="Interactions Found"
            value="0"
            icon="⚠️"
          />
          <StatsCard 
            title="Prescriptions Scanned"
            value="0"
            icon="📄"
          />
        </div>
        
        <div className="dashboard-section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            <div className="activity-item empty-state">
              <p className="text-muted" style={{ padding: '2rem', textAlign: 'center', width: '100%' }}>No recent activity found.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
