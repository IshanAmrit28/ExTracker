import { useState } from 'react';
import { authApi } from '../../services/api';

const Auth = ({ setToken, setUser }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const request = isLogin ? authApi.login : authApi.register;
      const res = await request({ email, password });
      
      const userData = { email: res.data.email, isPremium: res.data.isPremium };
      if (typeof setUser === 'function') setUser(userData);
      setToken(res.data.token);
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: '800', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.25rem' }}>
          ExTracker
        </h2>
        <h3 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>
          {isLogin ? 'Welcome back! Sign in to continue.' : 'Create an account to track your expenses.'}
        </h3>
        
        {error && (
          <div style={{ color: 'var(--danger)', marginBottom: '1.25rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '0.75rem' }}>
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.875rem', transition: 'color 0.2s' }}
            onMouseEnter={(e) => e.target.style.color = 'var(--primary-color)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
