import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, User, Mail, Lock, Shield, AlertCircle, Check, ArrowRight } from 'lucide-react';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'Elderly',
    guardian_name: '',
    guardian_relationship: 'Son',
    guardian_phone: '',
    guardian_email: '',
    guardian_report_consent: false,
    guardian_report_enabled: true
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData(prev => ({
      ...prev,
      [e.target.name]: value
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

    // Enforce guardian requirement for Elderly registration
    if (formData.role === 'Elderly') {
      const gEmail = formData.guardian_email ? formData.guardian_email.trim() : '';
      const gName = formData.guardian_name ? formData.guardian_name.trim() : '';
      const gPhone = formData.guardian_phone ? formData.guardian_phone.trim() : '';
      const hasEmail = Boolean(gEmail);
      const hasNameAndPhone = Boolean(gName && gPhone);
      if (!hasEmail && !hasNameAndPhone) {
        setError('Registration must include at least one guardian contact method: either (a) Guardian Email, or (b) Guardian Name and Guardian Phone.');
        return;
      }
      if (hasEmail && !formData.guardian_report_consent) {
        setError('The guardian has agreed to receive wellness reports (guardian consent must be confirmed when guardian email is provided).');
        return;
      }
    }

    try {
      setSubmitting(true);
      const registeredUser = await register(formData);
      const role = (registeredUser?.role || '').trim().toLowerCase();
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'caregiver') {
        navigate('/caregiver');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
      if (!err.response) {
        const apiTarget = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
        setError(`Cannot connect to backend server. Please make sure the backend server is running on ${apiTarget}.`);
      } else {
        const msg = err.response?.data?.detail || 'Registration failed. Please check your details and try again.';
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
              JOIN THE CARE CIRCLE
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
            Connecting seniors, families, and care teams.
          </h1>

          <p style={{
            fontSize: '1.05rem',
            color: '#4a6068',
            lineHeight: 1.6,
            marginBottom: '28px'
          }}>
            Register your account to access daily wellness check-ins, medication logs, and care circle connections.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', fontWeight: 600, color: '#0b1f28' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e6f4f1', color: '#00685b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={14} />
              </div>
              <span>Role-tailored dashboards for every user</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', fontWeight: 600, color: '#0b1f28' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e6f4f1', color: '#00685b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={14} />
              </div>
              <span>Secure, encrypted health data handling</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', fontWeight: 600, color: '#0b1f28' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e6f4f1', color: '#00685b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={14} />
              </div>
              <span>24/7 care monitoring and triage</span>
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
                fontWeight: 600,
                color: '#64748b',
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
                fontWeight: 700,
                color: '#0b1f28',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                textDecoration: 'none'
              }}>
                Create account
              </Link>
            </div>

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
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  placeholder="e.g. Eleanor Vance"
                  value={formData.full_name}
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
                  Email Address
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
                  placeholder="At least 6 characters"
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

              {/* Guardian / Family Contact Fields (Mandatory for Elderly registration) */}
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '16px',
                  border: '1px solid #bbf7d0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={16} color="#15803d" />
                    <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#14532d' }}>
                      Designated Guardian / Family Contact
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#166534' }}>
                    Caregivers email daily wellness reports to this contact. Please provide (a) Guardian Email with consent, or (b) Guardian Name & Phone.
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#14532d', marginBottom: '4px' }}>
                        Guardian Name
                      </label>
                      <input
                        type="text"
                        name="guardian_name"
                        placeholder="e.g. Robert Vance"
                        value={formData.guardian_name}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '9999px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.9rem',
                          outline: 'none',
                          backgroundColor: '#ffffff'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#14532d', marginBottom: '4px' }}>
                        Relationship
                      </label>
                      <select
                        name="guardian_relationship"
                        value={formData.guardian_relationship}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '9999px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.9rem',
                          outline: 'none',
                          backgroundColor: '#ffffff'
                        }}
                      >
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Neighbour">Neighbour</option>
                        <option value="Local Guardian">Local Guardian</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#14532d', marginBottom: '4px' }}>
                        Guardian Phone
                      </label>
                      <input
                        type="tel"
                        name="guardian_phone"
                        placeholder="+1 (555) 987-6543"
                        value={formData.guardian_phone}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '9999px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.9rem',
                          outline: 'none',
                          backgroundColor: '#ffffff'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#14532d', marginBottom: '4px' }}>
                        Guardian Email
                      </label>
                      <input
                        type="email"
                        name="guardian_email"
                        placeholder="guardian@example.com"
                        value={formData.guardian_email}
                        onChange={handleChange}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '9999px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.9rem',
                          outline: 'none',
                          backgroundColor: '#ffffff'
                        }}
                      />
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem', color: '#166534', cursor: 'pointer', marginTop: '4px' }}>
                    <input
                      type="checkbox"
                      name="guardian_report_consent"
                      checked={formData.guardian_report_consent}
                      onChange={handleChange}
                      style={{ marginTop: '2px', accentColor: '#15803d' }}
                    />
                    <span style={{ fontWeight: 600 }}>
                      The guardian has agreed to receive daily wellness reports via email
                    </span>
                  </label>
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
                {submitting ? 'Creating Account...' : 'Create Account'}
              </button>

              <div style={{
                fontSize: '0.78rem',
                color: '#64748b',
                textAlign: 'center',
                marginTop: '4px'
              }}>
                * Caregiver and clinical staff accounts are provisioned exclusively by facility administrators.
              </div>
            </form>

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
              <span>Your account privacy is protected under HomeJoy security guidelines.</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
