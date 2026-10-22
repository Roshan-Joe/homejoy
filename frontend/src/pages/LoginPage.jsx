import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Mail, Lock, AlertCircle, Check, Shield, ArrowRight } from 'lucide-react';
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
        const apiTarget = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
        setError(`Cannot connect to backend server. Please make sure the backend server is running on ${apiTarget}.`);
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
        const apiTarget = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
        setError(`Cannot connect to backend server. Please make sure the backend server is running on ${apiTarget}.`);
      } else {
        const msg = err.response?.data?.detail || 'Google sign-in failed. Please try again.';
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 72px)',
      backgroundColor: '#f7f9f8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1000px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '48px',
        alignItems: 'center'
      }}>

        {/* Left Section (Hero Copy) */}
        <div style={{ paddingRight: '12px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#e6f4f1',
            border: '1px solid #b2e0d8',
            borderRadius: '9999px',
            padding: '6px 16px',
            marginBottom: '20px'
          }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#00685b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              A CALMER CARE ROUTINE
            </span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 4vw, 3rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            color: '#0b1f28',
            letterSpacing: '-0.03em',
            marginBottom: '16px'
          }}>
            A clear daily picture, shared with the people who care.
          </h1>

          <p style={{
            fontSize: '1.05rem',
            color: '#4a6068',
            lineHeight: 1.6,
            marginBottom: '28px'
          }}>
            Private check-ins, personal wellness patterns, and timely alerts in one reassuring place.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', fontWeight: 600, color: '#0b1f28' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e6f4f1', color: '#00685b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={14} />
              </div>
              <span>Simple enough for every day</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', fontWeight: 600, color: '#0b1f28' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e6f4f1', color: '#00685b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={14} />
              </div>
              <span>Built around each person's own pattern</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', fontWeight: 600, color: '#0b1f28' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e6f4f1', color: '#00685b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={14} />
              </div>
              <span>Role-based access for the whole care circle</span>
            </div>
          </div>
        </div>

        {/* Right Section (Auth Card matching Screenshot 2) */}
        <div>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            padding: '36px 32px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 40px -10px rgba(0, 50, 40, 0.08)'
          }}>

            {/* Top Logo Header */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#00685b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                  <Heart size={18} fill="#ffffff" stroke="none" />
                </div>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0b1f28' }}>HomeJoy</span>
              </div>
            </div>

            {/* Tab Switcher: Sign In | Create Account */}
            <div style={{
              display: 'flex',
              backgroundColor: '#f1f5f9',
              borderRadius: '9999px',
              padding: '4px',
              marginBottom: '24px'
            }}>
              <Link to="/login" style={{
                flex: 1,
                textAlign: 'center',
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#0b1f28',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                textDecoration: 'none'
              }}>
                Sign in
              </Link>
              <Link to="/register" style={{
                flex: 1,
                textAlign: 'center',
                padding: '8px 16px',
                borderRadius: '9999px',
                fontSize: '0.88rem',
                fontWeight: 600,
                color: '#64748b',
                textDecoration: 'none'
              }}>
                Create account
              </Link>
            </div>

            {sessionExpiredNotice && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#fff7ed',
                border: '1px solid #ffedd5',
                borderRadius: '12px',
                color: '#c2410c',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>Session timed out after 30 minutes of inactivity.</span>
                <button onClick={clearExpiredNotice} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c2410c' }}>✕</button>
              </div>
            )}

            {error && (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                color: '#b91c1c',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0b1f28', marginBottom: '6px' }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    borderRadius: '9999px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.95rem',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#0b1f28', marginBottom: '6px' }}>
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    borderRadius: '9999px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.95rem',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  backgroundColor: '#00685b',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  padding: '14px 24px',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  marginTop: '8px',
                  boxShadow: '0 4px 12px rgba(0, 104, 91, 0.25)'
                }}
              >
                {submitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0 20px 0', color: '#94a3b8', fontSize: '0.8rem' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
              <span style={{ padding: '0 12px', fontWeight: 600 }}>or</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            </div>

            {/* Google Sign-in */}
            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              onError={(msg) => setError(msg)}
              disabled={submitting}
            />

            {/* Privacy Disclaimer Footer */}
            <div style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              color: '#64748b',
              lineHeight: 1.4
            }}>
              <Shield size={14} style={{ color: '#00685b', flexShrink: 0 }} />
              <span>Your wellness information is visible only to you and your linked care circle.</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
