import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHeart, FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/authService';
import Button from '../components/ui/Button';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide staff email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await loginUser({ email, password });
      login(res.data, res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail, quickPass) => {
    setEmail(quickEmail);
    setPassword(quickPass);
  };

  return (
    <div className="auth-wrapper">
      {/* Background ECG Graphic */}
      <div className="auth-ecg-bg">
        <svg viewBox="0 0 1000 100" style={{ width: '100%', stroke: '#2F6BFF', fill: 'none', strokeWidth: 2 }}>
          <path d="M0,50 L250,50 L270,10 L290,90 L310,50 L450,50 L470,20 L490,80 L510,50 L750,50 L770,0 L790,100 L810,50 L1000,50" />
        </svg>
      </div>

      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-logo-badge">
            <FiHeart />
          </div>
          <h1 className="auth-title">MedGuardian</h1>
          <p className="auth-subtitle">IoT Healthcare & Clinical Monitoring Portal</p>
        </div>

        {error && (
          <div className="form-error-msg" style={{ backgroundColor: 'var(--status-critical-bg)', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: 16, border: '1px solid var(--status-critical-border)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label className="form-label">Healthcare Staff Email</label>
            <div style={{ position: 'relative' }}>
              <FiMail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                className="form-input"
                style={{ paddingLeft: 38 }}
                placeholder="staff@medguardian.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Secure Access Password</label>
            <div className="password-input-wrapper">
              <FiLock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="form-input"
                style={{ paddingLeft: 38, paddingRight: 38 }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            style={{ width: '100%', marginTop: 8 }}
          >
            Authenticate & Access Portal
          </Button>
        </form>

        {/* Demo Credentials Section */}
        <div className="auth-quick-accounts">
          <div className="quick-accounts-title">Quick Demo Login (Pre-Configured)</div>
          <div className="quick-accounts-btns">
            <button
              type="button"
              className="quick-acc-btn"
              onClick={() => handleQuickLogin('admin@medguardian.io', 'admin123')}
            >
              Chief Admin
            </button>
            <button
              type="button"
              className="quick-acc-btn"
              onClick={() => handleQuickLogin('doctor@medguardian.io', 'doctor123')}
            >
              Physician
            </button>
            <button
              type="button"
              className="quick-acc-btn"
              onClick={() => handleQuickLogin('nurse@medguardian.io', 'nurse123')}
            >
              Ward Nurse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
