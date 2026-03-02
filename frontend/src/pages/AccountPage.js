import React from 'react';
import Sidebar from '../components/layout/Sidebar';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import SeverityBadge from '../components/ui/SeverityBadge';
import './AccountPage.css';

const AccountPage = () => {
  const historyData = [
    {
      id: 1,
      date: '2026-03-02',
      drugA: 'Aspirin',
      drugB: 'Ibuprofen',
      severity: 'Moderate'
    },
    {
      id: 2,
      date: '2026-03-01',
      drugA: 'Warfarin',
      drugB: 'Vitamin K',
      severity: 'Severe'
    },
    {
      id: 3,
      date: '2026-02-28',
      drugA: 'Metformin',
      drugB: 'Alcohol',
      severity: 'Moderate'
    },
    {
      id: 4,
      date: '2026-02-27',
      drugA: 'Lisinopril',
      drugB: 'Potassium',
      severity: 'Mild'
    }
  ];

  return (
    <div className="account-layout">
      <Sidebar />
      
      <main className="account-main">
        <div className="account-container">
          <Card borderLeft={true} borderColor="primary" className="profile-card">
            <div className="profile-content">
              <div className="profile-left">
                <Avatar name="John Doe" size={80} />
              </div>
              
              <div className="profile-right">
                <h2 className="profile-name">John Doe</h2>
                <p className="profile-email text-muted">john.doe@example.com</p>
                <span className="account-badge">Premium Member</span>
              </div>
            </div>
            
            <div className="profile-actions">
              <Button variant="outline">Edit Profile</Button>
              <Button variant="outline-pink">Export History</Button>
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
                  {historyData.map((item) => (
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
                  ))}
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
