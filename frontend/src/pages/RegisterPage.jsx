import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Mail, Lock, Shield, AlertCircle, HeartPulse } from 'lucide-react';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'Elderly'
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

    if (!formData.full_name || !formData.email || !formData.password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setSubmitting(true);
      const registeredUser = await register(formData);
      const role = (registeredUser?.role || '').trim().toLowerCase();
      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      if (!err.response) {
        setError('Cannot connect to backend server. Please make sure the backend server is running on http://127.0.0.1:8000.');
      } else {
        const msg = err.response?.data?.detail || 'Registration failed. Please check your details and try again.';
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
      padding: '40px 20px'
    }}>

      <div className="scrim-overlay-dark" />
      <div className="glass-card animate-fade-in scrim-content" style={{
        width: '100%',
        maxWidth: '480px',
        padding: '40px 36px',
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
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginTop: '6px' }}>
            Join HomeJoy Elderly Care & Risk Monitoring Platform
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">
              <User size={16} style={{ color: 'var(--primary)' }} />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              name="full_name"
              className="form-input input-elderly-touch"
              placeholder="e.g. Eleanor Vance"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </div>

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
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Role Selection */}
          <div className="form-group">
            <label className="form-label">
              <Shield size={16} style={{ color: 'var(--primary)' }} />
              <span>Select Your Account Role</span>
            </label>
            <select
              name="role"
              className="form-select input-elderly-touch"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="Elderly">Elderly / Senior Resident</option>
              <option value="Caregiver">Caregiver / Nurse</option>
              <option value="Family Member">Family Member</option>
              <option value="Admin">Administrator</option>
            </select>
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
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Register Account</span>
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 700 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

