import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import InputField from '../components/ui/InputField';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const LoginPage = ({ initialMode = 'login' }) => {
  const isSignupMode = initialMode === 'signup';
  const [mode, setMode] = useState(isSignupMode ? 'signup' : 'login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, configError } = useAuth();
  const navigate = useNavigate();

  const isLogin = mode === 'login';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn({ email, password });
        // Don't navigate here - let the PublicOnlyRoute handle it once auth state updates
        // This prevents a race condition where we navigate before isAuthenticated updates
      } else {
        const data = await signUp({ email, password, fullName });
        const hasSession = Boolean(data?.session);
        if (hasSession) {
          // Don't navigate here - let the PublicOnlyRoute handle it once auth state updates
        } else {
          setMessage('Signup successful. Please verify your email, then sign in.');
          setMode('login');
        }
      }
    } catch (authError) {
      setError(authError?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <Card borderTop={true} borderColor="primary" className="login-card">
          <h2 className="login-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="login-subtitle text-muted">
            {isLogin ? 'Sign in with your email' : 'Sign up with your email to get started'}
          </p>

          <div className="auth-mode-toggle">
            <Button
              type="button"
              variant={isLogin ? 'primary' : 'outline'}
              onClick={() => setMode('login')}
            >
              Login
            </Button>
            <Button
              type="button"
              variant={!isLogin ? 'primary' : 'outline'}
              onClick={() => setMode('signup')}
            >
              Sign Up
            </Button>
          </div>

          {configError && <p className="auth-error">{configError}</p>}
          {message && <p className="auth-success">{message}</p>}
          {error && <p className="auth-error">{error}</p>}
          
          <form onSubmit={handleSubmit} className="login-form">
            {!isLogin && (
              <InputField
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            )}

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
              {isLogin ? 'Login' : 'Create Account'}
            </Button>
          </form>
          
          <p className="login-footer text-muted">
            {isLogin ? (
              <>
                Don't have an account?{' '}
                <Link to="/signup" className="login-link">Sign up</Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link to="/login" className="login-link">Login</Link>
              </>
            )}
          </p>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
