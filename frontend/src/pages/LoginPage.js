import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

const LoginPage = ({ initialMode = 'login' }) => {
  const isSignupMode = initialMode === 'signup';
  const [isLogin, setIsLogin] = useState(!isSignupMode);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signUp, configError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e, mode) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn({ email, password });
        // Auth route guard handles redirect automatically
      } else {
        const data = await signUp({ email, password, fullName });
        const hasSession = Boolean(data?.session);
        if (!hasSession) {
          setMessage('Signup successful. Please verify your email, then sign in.');
          setIsLogin(true); // switch back to login mode
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
      <div className={`neu-container ${!isLogin ? 'right-panel-active' : ''}`}>
        
        {/* SIGN UP FORM */}
        <div className="form-container sign-up-container">
          <form className="neu-form" onSubmit={(e) => handleSubmit(e, 'signup')}>
            <h1 className="neu-title">Create Account</h1>
            <div className="social-container">
              <div className="social">G</div>
              <div className="social">f</div>
              <div className="social">in</div>
            </div>
            <span className="neu-subtitle">or use your email for registration</span>
            
            <input 
              className="neu-input" 
              type="text" 
              placeholder="Name" 
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required 
            />
            <input 
              className="neu-input" 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
            <input 
              className="neu-input" 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
            />
            
            <button className="neu-button" type="submit" disabled={loading}>
              {loading && !isLogin ? 'Processing...' : 'SIGN UP'}
            </button>
            
            <div className="auth-messages">
              {error && !isLogin && <div className="neu-error">{error}</div>}
              {message && !isLogin && <div className="neu-success">{message}</div>}
              {configError && <div className="neu-error">{configError}</div>}
            </div>
          </form>
        </div>

        {/* SIGN IN FORM */}
        <div className="form-container sign-in-container">
          <form className="neu-form" onSubmit={(e) => handleSubmit(e, 'login')}>
            <h1 className="neu-title">Welcome Back!</h1>
            <div className="social-container">
              <div className="social">G</div>
              <div className="social">f</div>
              <div className="social">in</div>
            </div>
            <span className="neu-subtitle">or use your email account</span>
            
            <input 
              className="neu-input" 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
            <input 
              className="neu-input" 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
            />
            
            <button className="neu-button" type="submit" disabled={loading}>
              {loading && isLogin ? 'Processing...' : 'SIGN IN'}
            </button>

            <div className="auth-messages">
              {error && isLogin && <div className="neu-error">{error}</div>}
              {message && isLogin && <div className="neu-success">{message}</div>}
              {configError && <div className="neu-error">{configError}</div>}
            </div>
          </form>
        </div>

        {/* OVERLAY for Animation */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1 className="neu-overlay-title">Welcome Back!</h1>
              <p className="neu-overlay-text">To keep connected with us please login with your personal info</p>
              <button className="neu-button ghost" onClick={() => {
                setError(''); setMessage('');
                setIsLogin(true);
              }} type="button">SIGN IN</button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1 className="neu-overlay-title">Hello, Friend!</h1>
              <p className="neu-overlay-text">Enter your personal details and start your journey with us</p>
              <button className="neu-button ghost" onClick={() => {
                setError(''); setMessage('');
                setIsLogin(false);
              }} type="button">SIGN UP</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
