import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const menuItems = [
    { path: '/check-interaction', label: 'Interaction Assistant', icon: '🔍' },
    { path: '/submit-interaction', label: 'Submit Interaction', icon: '📝' },
    { path: '/account', label: 'Account', icon: '👤' },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link to="/" className="sidebar-logo">Pharma4U</Link>
      </div>
      <div className="sidebar-menu">
        {menuItems.map((item) => {
          const isAssistantRoute = item.path === '/check-interaction' && (location.pathname === '/check-interaction' || location.pathname === '/check-ocr');
          const isActive = location.pathname === item.path || isAssistantRoute;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <span className="sidebar-user-email">{user?.email}</span>
        </div>
        <button 
          onClick={handleLogout}
          className="sidebar-logout"
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
