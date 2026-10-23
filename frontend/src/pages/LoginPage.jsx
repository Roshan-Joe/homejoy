import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Mail, Lock, AlertCircle, Check, Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

// Simple format check (server handles strict verification)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginPage = () => {
  const { login, googleLogin, sessionExpiredNotice, clearExpiredNotice } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  // Client validation for login:
  // - Email: not empty, valid format
  // - Password: not empty (Do NOT check length or strength, and NEVER show the rules)
  const validate = (data = formData) => {
    const errors = {};

    const cleanEmail = (data.email || '').trim().toLowerCase();
    if (!cleanEmail) {
      errors.email = 'Please enter your email address.';
    } else if (cleanEmail.length > 254 || !EMAIL_REGEX.test(cleanEmail)) {
      errors.email = 'Please enter a valid email address (e.g. name@example.com).';
    }

    if (!data.password) {
      errors.password = 'Please enter your password.';
    }

    return errors;
  };

  const currentErrors = validate(formData);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (serverError) setServerError('');
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'password') {
      setIsCapsLockOn(false);
    }
  };

  // Caps Lock detection on password field
  const handlePasswordKey = (e) => {
    if (e.getModifierState) {
      const isCaps = e.getModifierState('CapsLock');
      setIsCapsLockOn(Boolean(isCaps));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    // Mark every field as touched
    setTouched({
      email: true,
      password: true
    });

    const validationErrors = validate(formData);
    const hasErrors = Object.keys(validationErrors).length > 0;

    if (hasErrors) {
      // Focus the first invalid field
      if (validationErrors.email && emailRef.current) {
        emailRef.current.focus();
      } else if (validationErrors.password && passwordRef.current) {
        passwordRef.current.focus();
      }
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      };

      const loggedUser = await login(payload);
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
      console.error('Login error:', err);
      if (!err.response) {
        const apiTarget = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
        setServerError(`Cannot connect to backend server. Please verify the service is running on ${apiTarget}.`);
      } else if (err.response.status === 429) {
        // Handle 429 rate limit with friendly text
        setServerError('Too many attempts, try again in a minute.');
      } else if (err.response.status === 403) {
        setServerError(err.response.data?.detail || 'Your account is deactivated. Please contact support.');
      } else {
        // Exactly one generic message for invalid credentials, never revealing which one failed
        setServerError('Email or password is incorrect');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credential) => {
    try {
      setSubmitting(true);
      setServerError('');
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
      console.error('Google login error:', err);
      if (!err.response) {
        const apiTarget = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
        setServerError(`Cannot connect to backend server. Please verify the service is running on ${apiTarget}.`);
      } else {
        setServerError(err.response?.data?.detail || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderFieldError = (fieldKey, errorText) => {
    if (!touched[fieldKey] || !errorText) return null;
    return (
      <div
        id={`${fieldKey}-error`}
        role="alert"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '6px',
          color: '#b91c1c',
          fontSize: '1rem',
          fontWeight: 600,
          lineHeight: 1.4
        }}
      >
        <AlertCircle size={18} style={{ flexShrink: 0, color: '#dc2626' }} />
        <span>{errorText}</span>
      </div>
    );
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
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#00685b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.98rem', fontWeight: 600, color: '#0b1f28' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e6f4f1', color: '#00685b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={15} />
              </div>
              <span>Simple enough for every day</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.98rem', fontWeight: 600, color: '#0b1f28' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e6f4f1', color: '#00685b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={15} />
              </div>
              <span>Built around each person's own pattern</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.98rem', fontWeight: 600, color: '#0b1f28' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e6f4f1', color: '#00685b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={15} />
              </div>
              <span>Role-based access for the whole care circle</span>
            </div>
          </div>
        </div>

        {/* Right Section (Auth Card) */}
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
                fontSize: '0.92rem',
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
                fontSize: '0.92rem',
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
                fontSize: '0.95rem',
                fontWeight: 600,
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>Session timed out after 30 minutes of inactivity.</span>
                <button
                  type="button"
                  onClick={clearExpiredNotice}
                  aria-label="Dismiss notification"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c2410c', fontSize: '1rem', fontWeight: 700 }}
                >
                  ✕
                </button>
              </div>
            )}

            {serverError && (
              <div
                role="alert"
                style={{
                  padding: '14px 16px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '12px',
                  color: '#b91c1c',
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <AlertCircle size={20} style={{ flexShrink: 0 }} />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Email */}
              <div>
                <label
                  htmlFor="login-email"
                  style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#0b1f28', marginBottom: '6px' }}
                >
                  Email
                </label>
                <input
                  ref={emailRef}
                  id="login-email"
                  type="email"
                  name="email"
                  autoComplete="username"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  aria-invalid={touched.email && Boolean(currentErrors.email)}
                  aria-describedby={touched.email && currentErrors.email ? 'email-error' : undefined}
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    borderRadius: '9999px',
                    border: touched.email && currentErrors.email ? '2px solid #dc2626' : '1px solid #cbd5e1',
                    fontSize: '1rem',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                />
                {renderFieldError('email', currentErrors.email)}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="login-password"
                  style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#0b1f28', marginBottom: '6px' }}
                >
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    ref={passwordRef}
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('password')}
                    onKeyDown={handlePasswordKey}
                    onKeyUp={handlePasswordKey}
                    onFocus={handlePasswordKey}
                    aria-invalid={touched.password && Boolean(currentErrors.password)}
                    aria-describedby={touched.password && currentErrors.password ? 'password-error' : undefined}
                    style={{
                      width: '100%',
                      padding: '12px 48px 12px 18px',
                      borderRadius: '9999px',
                      border: touched.password && currentErrors.password ? '2px solid #dc2626' : '1px solid #cbd5e1',
                      fontSize: '1rem',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {renderFieldError('password', currentErrors.password)}

                {/* Caps Lock warning */}
                {isCapsLockOn && (
                  <div
                    role="alert"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fef3c7',
                      borderRadius: '8px',
                      color: '#b45309',
                      fontSize: '0.92rem',
                      fontWeight: 600
                    }}
                  >
                    <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0 }} />
                    <span>Caps Lock is on</span>
                  </div>
                )}
              </div>

              {/* Submit Button (Never silently disabled before submit; disabled only while submitting to prevent double clicks) */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  backgroundColor: '#00685b',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '1rem',
                  padding: '14px 24px',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.75 : 1,
                  marginTop: '8px',
                  boxShadow: '0 4px 12px rgba(0, 104, 91, 0.25)',
                  transition: 'background-color 0.15s ease'
                }}
              >
                {submitting ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0 20px 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
              <span style={{ padding: '0 12px', fontWeight: 600 }}>or</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
            </div>

            {/* Google Sign-in */}
            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              onError={(msg) => setServerError(msg)}
              disabled={submitting}
            />

            {/* Privacy Disclaimer Footer */}
            <div style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem',
              color: '#64748b',
              lineHeight: 1.4
            }}>
              <Shield size={16} style={{ color: '#00685b', flexShrink: 0 }} />
              <span>Your wellness information is visible only to you and your linked care circle.</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
