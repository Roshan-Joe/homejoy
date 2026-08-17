import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Mail, Lock, AlertCircle, HeartPulse } from 'lucide-react';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

export const LoginPage = () => {
  const { login, googleLogin, sessionExpiredNotice, clearExpiredNotice } = useAuth();
  const navigate = useNavigate();


  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      setSubmitting(true);
      const loggedUser = await login(formData);
      const role = (loggedUser?.role || '').trim().toLowerCase();
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'elderly') {
        navigate('/elderly/dashboard');
      } else if (role === 'caregiver') {
        navigate('/caregiver/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      if (!err.response) {
        setError('Cannot connect to backend server. Please make sure the backend server is running on http://127.0.0.1:8000.');
      } else {
        const msg = err.response?.data?.detail || 'Invalid email or password. Please try again.';
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credential) => {
    try {
      setSubmitting(true);
      setError('');
      const loggedUser = await googleLogin(credential);
      const role = (loggedUser?.role || '').trim().toLowerCase();
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'elderly') {
        navigate('/elderly/dashboard');
      } else if (role === 'caregiver') {
        navigate('/caregiver/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      if (!err.response) {
        setError('Cannot connect to backend server. Please make sure the backend server is running on http://127.0.0.1:8000.');
      } else {
        const msg = err.response?.data?.detail || 'Google sign-in failed. Please try again.';
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="scrim-bg-wrapper page-bg-auth" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px'
    }}>

      <div className="scrim-overlay-dark" />
      <div className="glass-card animate-fade-in scrim-content" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '44px 40px',
        background: 'rgba(255, 255, 255, 0.95)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.9)',
        borderRadius: 'var(--radius-xl)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',

            boxShadow: 'var(--shadow-sm)'
          }}>
            <HeartPulse size={30} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginTop: '6px' }}>
            Sign in to your HomeJoy Care Account
          </p>
        </div>

        {sessionExpiredNotice && (
          <div className="alert alert-warning animate-fade-in" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={20} style={{ color: '#c2410c', flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#c2410c' }}>
                Your session timed out after 30 minutes of inactivity for health security compliance.
              </span>
            </div>
            <button onClick={clearExpiredNotice} className="btn-ghost" style={{ padding: '4px', fontSize: '1rem', color: '#c2410c' }}>✕</button>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}


        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="form-group">
            <label className="form-label">
              <Mail size={16} style={{ color: 'var(--primary)' }} />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              name="email"
              className="form-input input-elderly-touch"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">
              <Lock size={16} style={{ color: 'var(--primary)' }} />
              <span>Password</span>
            </label>
            <input
              type="password"
              name="password"
              className="form-input input-elderly-touch"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-elderly-touch"
            style={{ marginTop: '12px' }}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <div className="spinner spinner-sm" style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: '#fff' }} />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '24px 0 20px 0',
          color: 'var(--text-light)',
          fontSize: '0.825rem'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
          <span style={{ padding: '0 12px', fontWeight: 600, letterSpacing: '0.5px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }} />
        </div>

        {/* Google Sign-In Component */}
        <GoogleSignInButton
          onSuccess={handleGoogleSuccess}
          onError={(msg) => setError(msg)}
          disabled={submitting}
        />

        <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 700 }}>
            Register Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

