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

  // Admin panel state
  const [pendingInteractions, setPendingInteractions] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [medNames, setMedNames] = useState({});

  const fetchPending = useCallback(async () => {
    if (!isAdmin) return;
    setAdminLoading(true);
    try {
      const resp = await api.getPendingInteractions();
      if (resp.success) {
        const interactions = resp.interactions || [];
        setPendingInteractions(interactions);
        // Pre-resolve all medicine names using lookup-by-ID
        const seenKeys = new Set();
        const lookups = [];
        for (const item of interactions) {
          const key1 = `${item.med1_type}-${item.med1_id}`;
          const key2 = `${item.med2_type}-${item.med2_id}`;
          if (!seenKeys.has(key1)) {
            seenKeys.add(key1);
            lookups.push(
              api.lookupMedicine(item.med1_id, item.med1_type)
                .then(r => {
                  if (r.success && r.medicine) {
                    setMedNames(prev => ({ ...prev, [key1]: r.medicine.name }));
                  }
                }).catch(() => {})
            );
          }
          if (!seenKeys.has(key2)) {
            seenKeys.add(key2);
            lookups.push(
              api.lookupMedicine(item.med2_id, item.med2_type)
                .then(r => {
                  if (r.success && r.medicine) {
                    setMedNames(prev => ({ ...prev, [key2]: r.medicine.name }));
                  }
                }).catch(() => {})
            );
          }
        }
        await Promise.allSettled(lookups);
      }
    } catch (err) {
      console.error('Failed to fetch pending:', err);
    } finally {
      setAdminLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const getMedLabel = (type, id) => {
    const name = medNames[`${type}-${id}`];
    if (name) return `${name}`;
    return `${type}#${id}`;
  };

  const handleApprove = async (id) => {
    try {
      const resp = await api.approveInteraction(id, user?.id);
      if (resp.success) {
        setPendingInteractions(prev => prev.filter(i => i.id !== id));
      }
    } catch (err) {
      console.error('Approve failed:', err);
    }
  };

  const handleReject = async (id) => {
    try {
      const resp = await api.rejectInteraction(id, user?.id);
      if (resp.success) {
        setPendingInteractions(prev => prev.filter(i => i.id !== id));
      }
    } catch (err) {
      console.error('Reject failed:', err);
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

          {/* Admin Pending Review Panel */}
          {isAdmin && (
            <div className="admin-panel">
              <div className="admin-title">
                <h2 className="history-title">⚙️ Pending Interaction Reviews</h2>
                {pendingInteractions.length > 0 && (
                  <span className="pending-count">{pendingInteractions.length}</span>
                )}
              </div>
              <div className="history-divider"></div>

              {adminLoading ? (
                <Card className="pending-card"><p style={{ color: '#888' }}>Loading pending interactions...</p></Card>
              ) : pendingInteractions.length === 0 ? (
                <Card className="pending-card"><p style={{ color: '#888' }}>🎉 No pending interactions to review.</p></Card>
              ) : (
                pendingInteractions.map((item) => (
                  <Card key={item.id} className="pending-card">
                    <div className="pending-header">
                      <span className="pending-pair">
                        {getMedLabel(item.med1_type, item.med1_id)} ↔ {getMedLabel(item.med2_type, item.med2_id)}
                      </span>
                      <SeverityBadge severity={item.severity} />
                    </div>
                    <p className="pending-desc">{item.description}</p>
                    <div className="pending-meta">
                      {item.active_ingredient && <span>💊 {item.active_ingredient}</span>}
                      {item.source_link && (
                        <a href={item.source_link} target="_blank" rel="noreferrer" style={{ color: '#7c5cfc' }}>
                          🔗 Source
                        </a>
                      )}
                      <span>📅 {new Date(item.created_at).toLocaleDateString()}</span>
                      <span style={{ textTransform: 'capitalize' }}>
                        🏷️ {item.med1_type} × {item.med2_type}
                      </span>
                    </div>
                    <div className="pending-actions">
                      <button className="approve-btn" onClick={() => handleApprove(item.id)}>
                        ✓ Approve
                      </button>
                      <button className="reject-btn" onClick={() => handleReject(item.id)}>
                        ✕ Reject
                      </button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
          
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
