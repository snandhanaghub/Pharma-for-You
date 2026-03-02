import React from 'react';
import Sidebar from '../components/layout/Sidebar';
import Avatar from '../components/ui/Avatar';
import StatsCard from '../components/ui/StatsCard';
import './DashboardPage.css';

const DashboardPage = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      
      <main className="dashboard-main">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <Avatar name="John Doe" size={48} />
        </div>
        
        <div className="stats-grid">
          <StatsCard 
            title="Total Checks"
            value="248"
            icon="🔍"
          />
          <StatsCard 
            title="Interactions Found"
            value="42"
            icon="⚠️"
          />
          <StatsCard 
            title="Prescriptions Scanned"
            value="156"
            icon="📄"
          />
        </div>
        
        <div className="dashboard-section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">💊</div>
              <div className="activity-content">
                <p className="activity-title">Checked interaction: Aspirin + Ibuprofen</p>
                <p className="activity-time text-muted">2 hours ago</p>
              </div>
            </div>
            
            <div className="activity-item">
              <div className="activity-icon">📄</div>
              <div className="activity-content">
                <p className="activity-title">Uploaded prescription scan</p>
                <p className="activity-time text-muted">5 hours ago</p>
              </div>
            </div>
            
            <div className="activity-item">
              <div className="activity-icon">💊</div>
              <div className="activity-content">
                <p className="activity-title">Checked interaction: Warfarin + Vitamin K</p>
                <p className="activity-time text-muted">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
