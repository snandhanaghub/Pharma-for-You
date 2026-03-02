import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import InputField from '../components/ui/InputField';
import Button from '../components/ui/Button';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate login
    setTimeout(() => {
      setLoading(false);
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <Card borderTop={true} borderColor="primary" className="login-card">
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle text-muted">Sign in to your account</p>
          
          <form onSubmit={handleLogin} className="login-form">
            <InputField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
            
            <InputField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            
            <Button 
              type="submit" 
              variant="primary" 
              fullWidth={true}
              loading={loading}
            >
              Login
            </Button>
          </form>
          
          <div className="login-divider">
            <span className="login-divider-text">OR</span>
          </div>
          
          <Button variant="outline-secondary" fullWidth={true}>
            Continue with Google
          </Button>
          
          <p className="login-footer text-muted">
            Don't have an account? <Link to="/signup" className="login-link">Sign up</Link>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
