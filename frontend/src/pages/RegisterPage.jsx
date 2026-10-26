import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Mail, Lock, Shield, AlertCircle, Check, Eye, EyeOff, Info, MapPin } from 'lucide-react';
import { KERALA_DISTRICTS } from '../constants/districts';

const COMMON_PASSWORDS = new Set([
  'password', '12345678', '123456789', 'qwerty123', 'password123', 'admin123',
  'homejoy123', 'welcome123', 'letmein123', 'iloveyou', 'secret123'
]);

// Validates full name: 2-100 characters, letters (including Malayalam & international via \p{L}\p{M}), spaces, . ' -
const NAME_REGEX = /^[\p{L}\p{M}\s.'-]+$/u;
// Simple format check: not a clever regex; server's EmailStr handles strict verification
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Phone: optional +, digits, spaces, and dashes
const PHONE_REGEX = /^\+?[\d\s-]+$/;

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    district: 'Ernakulam',
    password: '',
    confirm_password: '',
    role: 'Elderly',
    guardian_name: '',
    guardian_relationship: 'Son',
    guardian_phone: '',
    guardian_email: '',
    guardian_report_consent: false,
    consent: false
  });

  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Field element refs to focus first invalid field on submit
  const fullNameRef = useRef(null);
  const emailRef = useRef(null);
  const districtRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const guardianNameRef = useRef(null);
  const guardianPhoneRef = useRef(null);
  const guardianEmailRef = useRef(null);
  const guardianConsentRef = useRef(null);
  const consentRef = useRef(null);

  // Derive email local part for password checklist
  const emailLocal = formData.email.includes('@')
    ? formData.email.split('@')[0].trim().toLowerCase()
    : formData.email.trim().toLowerCase();

  // Password checklist rules (live from the first keystroke)
  const passwordRules = {
    length: formData.password.length >= 8 && formData.password.length <= 72,
    hasLetter: /\p{L}/u.test(formData.password) || /[a-zA-Z]/.test(formData.password),
    hasDigit: /\d/.test(formData.password),
    notCommon: formData.password.length > 0 && !COMMON_PASSWORDS.has(formData.password.toLowerCase()),
    noEmailName: emailLocal.length < 3 || !formData.password.toLowerCase().includes(emailLocal)
  };

  // Validation function returning an error map
  const validate = (data = formData) => {
    const errors = {};

    // 1. Full name: Trim first. 2-100 characters. Letters, spaces, . ' - only (\p{L}\p{M})
    const trimmedName = (data.full_name || '').trim();
    if (!trimmedName) {
      errors.full_name = 'Please enter your full name.';
    } else if (trimmedName.length < 2 || trimmedName.length > 100) {
      errors.full_name = 'Full name must be between 2 and 100 characters.';
    } else if (!NAME_REGEX.test(trimmedName)) {
      errors.full_name = 'Full name can only contain letters, spaces, hyphens, periods, and apostrophes.';
    }

    // 2. Email: Trim, lowercase, max 254, simple format check
    const trimmedEmail = (data.email || '').trim().toLowerCase();
    if (!trimmedEmail) {
      errors.email = 'Please enter your email address.';
    } else if (trimmedEmail.length > 254) {
      errors.email = 'Email address cannot exceed 254 characters.';
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address (e.g. name@example.com).';
    }

    // 2b. District: Required Kerala district for caregiver allocation
    if (!data.district || !data.district.trim()) {
      errors.district = 'Please select your Kerala district for caregiver allocation.';
    }

    // 3. Password: 8-72 characters, >=1 letter, >=1 digit, not common, doesn't contain email name
    const pwd = data.password || '';
    if (!pwd) {
      errors.password = 'Please enter a password.';
    } else if (pwd.length < 8) {
      errors.password = 'Add at least 8 characters to your password.';
    } else if (pwd.length > 72) {
      errors.password = 'Password cannot exceed 72 characters.';
    } else if (!passwordRules.hasLetter) {
      errors.password = 'Add at least one letter.';
    } else if (!passwordRules.hasDigit) {
      errors.password = 'Add at least one number.';
    } else if (!passwordRules.notCommon) {
      errors.password = 'This password is too common. Please choose a more secure password.';
    } else if (!passwordRules.noEmailName) {
      errors.password = 'Password cannot contain your email username.';
    }

    // 4. Confirm password: Must match the password
    if (!data.confirm_password) {
      errors.confirm_password = 'Please confirm your password.';
    } else if (data.confirm_password !== data.password) {
      errors.confirm_password = 'Passwords do not match.';
    }

    // 5. Guardian Contact: Elderly accounts require (a) Guardian Email with consent, or (b) Guardian Name & Phone
    const gEmail = (data.guardian_email || '').trim().toLowerCase();
    const gName = (data.guardian_name || '').trim();
    const gPhone = (data.guardian_phone || '').trim();

    if (gPhone) {
      const digitsOnly = gPhone.replace(/\D/g, '');
      if (!PHONE_REGEX.test(gPhone) || digitsOnly.length < 7 || digitsOnly.length > 15) {
        errors.guardian_phone = 'Phone number must contain between 7 and 15 digits.';
      }
    }

    if (gEmail) {
      if (gEmail.length > 254 || !EMAIL_REGEX.test(gEmail)) {
        errors.guardian_email = 'Please enter a valid guardian email address.';
      } else if (!data.guardian_report_consent) {
        errors.guardian_report_consent = 'Please confirm the guardian agrees to receive daily wellness reports.';
      }
    }

    const hasValidEmailContact = Boolean(gEmail && !errors.guardian_email && data.guardian_report_consent);
    const hasValidPhoneContact = Boolean(gName && gPhone && !errors.guardian_phone);

    if (!hasValidEmailContact && !hasValidPhoneContact) {
      if (!gEmail && !gPhone && !gName) {
        errors.guardian_general = 'Please provide a guardian email (with consent) or guardian name with phone number.';
      }
    }

    // 6. Consent checkbox: Required to agree to terms & health data usage
    if (!data.consent) {
      errors.consent = 'You must agree to the Terms of Service and health data consent to register.';
    }

    return errors;
  };

  const currentErrors = validate(formData);

  // Handle field change: updates value and clears errors on keystroke if field was touched
  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: val
    }));

    if (serverError) setServerError('');
  };

  // Mark field as touched on blur so live validation begins
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    // Mark all fields touched
    const allTouched = {
      full_name: true,
      email: true,
      district: true,
      password: true,
      confirm_password: true,
      guardian_name: true,
      guardian_phone: true,
      guardian_email: true,
      guardian_report_consent: true,
      consent: true
    };
    setTouched(allTouched);

    const validationErrors = validate(formData);
    const hasErrors = Object.keys(validationErrors).length > 0;

    if (hasErrors) {
      // Focus the first invalid element for accessibility
      if (validationErrors.full_name && fullNameRef.current) {
        fullNameRef.current.focus();
      } else if (validationErrors.email && emailRef.current) {
        emailRef.current.focus();
      } else if (validationErrors.district && districtRef.current) {
        districtRef.current.focus();
      } else if (validationErrors.password && passwordRef.current) {
        passwordRef.current.focus();
      } else if (validationErrors.confirm_password && confirmPasswordRef.current) {
        confirmPasswordRef.current.focus();
      } else if (validationErrors.guardian_phone && guardianPhoneRef.current) {
        guardianPhoneRef.current.focus();
      } else if (validationErrors.guardian_email && guardianEmailRef.current) {
        guardianEmailRef.current.focus();
      } else if (validationErrors.guardian_report_consent && guardianConsentRef.current) {
        guardianConsentRef.current.focus();
      } else if (validationErrors.guardian_general && (guardianEmailRef.current || guardianNameRef.current)) {
        (guardianEmailRef.current || guardianNameRef.current).focus();
      } else if (validationErrors.consent && consentRef.current) {
        consentRef.current.focus();
      }
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        district: formData.district || 'Ernakulam',
        password: formData.password,
        role: 'Elderly', // Public self-registration is strictly restricted to Elderly
        guardian_name: formData.guardian_name.trim() || null,
        guardian_relationship: formData.guardian_relationship || 'Guardian',
        guardian_phone: formData.guardian_phone.trim() || null,
        guardian_email: formData.guardian_email.trim().toLowerCase() || null,
        guardian_report_consent: Boolean(formData.guardian_report_consent),
        guardian_report_enabled: Boolean(formData.guardian_email.trim())
      };

      const registeredUser = await register(payload);
      const role = (registeredUser?.role || '').trim().toLowerCase();
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'caregiver') {
        navigate('/caregiver/dashboard');
      } else {
        navigate('/elderly/dashboard');
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (!err.response) {
        const apiTarget = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
        setServerError(`Cannot connect to backend server. Please verify the service is running on ${apiTarget}.`);
      } else if (err.response.status === 409) {
        // Show server's 409 Conflict without leaking beforehand
        setServerError('This email address is already registered. Please sign in or use a different email.');
        if (emailRef.current) emailRef.current.focus();
      } else {
        const msg = err.response?.data?.detail || 'Registration failed. Please check your details and try again.';
        setServerError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Reusable inline accessible error message
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
              JOIN HOMEJOY CARE CIRCLE
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
            Register your elderly account to access daily wellness check-ins, smart medication routines, and stay connected with your care circle.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.98rem', fontWeight: 600, color: '#0b1f28' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e6f4f1', color: '#00685b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={15} />
              </div>
              <span>Reassuring daily wellness & medication companion</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.98rem', fontWeight: 600, color: '#0b1f28' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e6f4f1', color: '#00685b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={15} />
              </div>
              <span>Encrypted health data handling & patient privacy</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.98rem', fontWeight: 600, color: '#0b1f28' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e6f4f1', color: '#00685b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Check size={15} />
              </div>
              <span>Automated daily wellness reports to your family guardian</span>
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
                fontSize: '0.92rem',
                fontWeight: 700,
                color: '#0b1f28',
                backgroundColor: '#ffffff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                textDecoration: 'none'
              }}>
                Create account
              </Link>
            </div>

            {/* Role Notice: Public signup is always Elderly */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: '#f0fdfa',
              border: '1px solid #ccfbf1',
              borderRadius: '12px',
              marginBottom: '20px',
              fontSize: '0.88rem',
              color: '#0f766e',
              fontWeight: 600
            }}>
              <Info size={16} style={{ flexShrink: 0 }} />
              <span>Public registration creates an <strong>Elderly Resident</strong> account. Caregiver accounts are provisioned by an administrator.</span>
            </div>

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
              
              {/* Full Name */}
              <div>
                <label
                  htmlFor="register-full-name"
                  style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#0b1f28', marginBottom: '6px' }}
                >
                  Full Name <span style={{ color: '#b91c1c' }}>*</span>
                </label>
                <input
                  ref={fullNameRef}
                  id="register-full-name"
                  type="text"
                  name="full_name"
                  autoComplete="name"
                  placeholder="e.g. John Doe or രാഹുൽ കുമാർ"
                  value={formData.full_name}
                  onChange={handleChange}
                  onBlur={() => handleBlur('full_name')}
                  aria-invalid={touched.full_name && Boolean(currentErrors.full_name)}
                  aria-describedby={touched.full_name && currentErrors.full_name ? 'full_name-error' : undefined}
                  style={{
                    width: '100%',
                    padding: '12px 18px',
                    borderRadius: '9999px',
                    border: touched.full_name && currentErrors.full_name ? '2px solid #dc2626' : '1px solid #cbd5e1',
                    fontSize: '1rem',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                />
                {renderFieldError('full_name', currentErrors.full_name)}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="register-email"
                  style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#0b1f28', marginBottom: '6px' }}
                >
                  Email Address <span style={{ color: '#b91c1c' }}>*</span>
                </label>
                <input
                  ref={emailRef}
                  id="register-email"
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

              {/* District (Kerala) for Caregiver Allocation */}
              <div>
                <label
                  htmlFor="register-district"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700, color: '#0b1f28', marginBottom: '6px' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={16} style={{ color: '#00685b' }} />
                    District (Kerala) <span style={{ color: '#b91c1c' }}>*</span>
                  </span>
                  <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 500 }}>For local caregiver assignment</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    ref={districtRef}
                    id="register-district"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    onBlur={() => handleBlur('district')}
                    aria-invalid={touched.district && Boolean(currentErrors.district)}
                    aria-describedby={touched.district && currentErrors.district ? 'district-error' : undefined}
                    style={{
                      width: '100%',
                      padding: '12px 18px',
                      borderRadius: '9999px',
                      border: touched.district && currentErrors.district ? '2px solid #dc2626' : '1px solid #cbd5e1',
                      fontSize: '1rem',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      cursor: 'pointer',
                      appearance: 'auto'
                    }}
                  >
                    <option value="" disabled>Select your Kerala district</option>
                    {KERALA_DISTRICTS.map((dist) => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
                {renderFieldError('district', currentErrors.district)}
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="register-password"
                  style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#0b1f28', marginBottom: '6px' }}
                >
                  Password <span style={{ color: '#b91c1c' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    ref={passwordRef}
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('password')}
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

                {/* Password Live Checklist (Guidance from the first keystroke) */}
                <div style={{
                  marginTop: '10px',
                  padding: '12px 16px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Password Requirements:
                  </span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: passwordRules.length ? '#15803d' : '#64748b' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: passwordRules.length ? '#dcfce7' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={11} color={passwordRules.length ? '#15803d' : '#94a3b8'} strokeWidth={3} />
                    </div>
                    <span>8 to 72 characters</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: passwordRules.hasLetter ? '#15803d' : '#64748b' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: passwordRules.hasLetter ? '#dcfce7' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={11} color={passwordRules.hasLetter ? '#15803d' : '#94a3b8'} strokeWidth={3} />
                    </div>
                    <span>At least one letter</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: passwordRules.hasDigit ? '#15803d' : '#64748b' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: passwordRules.hasDigit ? '#dcfce7' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={11} color={passwordRules.hasDigit ? '#15803d' : '#94a3b8'} strokeWidth={3} />
                    </div>
                    <span>At least one number</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: passwordRules.noEmailName ? '#15803d' : '#64748b' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: passwordRules.noEmailName ? '#dcfce7' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={11} color={passwordRules.noEmailName ? '#15803d' : '#94a3b8'} strokeWidth={3} />
                    </div>
                    <span>Does not contain your email username</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: passwordRules.notCommon ? '#15803d' : '#64748b' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: passwordRules.notCommon ? '#dcfce7' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check size={11} color={passwordRules.notCommon ? '#15803d' : '#94a3b8'} strokeWidth={3} />
                    </div>
                    <span>Not in a common password list</span>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="register-confirm-password"
                  style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#0b1f28', marginBottom: '6px' }}
                >
                  Confirm Password <span style={{ color: '#b91c1c' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    ref={confirmPasswordRef}
                    id="register-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirm_password"
                    autoComplete="new-password"
                    placeholder="Re-enter password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('confirm_password')}
                    aria-invalid={touched.confirm_password && Boolean(currentErrors.confirm_password)}
                    aria-describedby={touched.confirm_password && currentErrors.confirm_password ? 'confirm_password-error' : undefined}
                    style={{
                      width: '100%',
                      padding: '12px 48px 12px 18px',
                      borderRadius: '9999px',
                      border: touched.confirm_password && currentErrors.confirm_password ? '2px solid #dc2626' : '1px solid #cbd5e1',
                      fontSize: '1rem',
                      outline: 'none',
                      backgroundColor: '#ffffff'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
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
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {renderFieldError('confirm_password', currentErrors.confirm_password)}
              </div>

              {/* Guardian / Family Contact Fields */}
              <div style={{
                padding: '20px',
                backgroundColor: '#f0fdf4',
                borderRadius: '16px',
                border: '1px solid #bbf7d0',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Shield size={18} color="#15803d" />
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#14532d' }}>
                    Designated Guardian / Family Contact
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#166534', lineHeight: 1.5 }}>
                  Caregivers email daily wellness reports to this contact. Please provide (a) Guardian Email with consent, or (b) Guardian Name & Phone number (7-15 digits).
                </div>

                {renderFieldError('guardian_general', currentErrors.guardian_general)}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <label
                      htmlFor="guardian-name"
                      style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#14532d', marginBottom: '4px' }}
                    >
                      Guardian Name
                    </label>
                    <input
                      ref={guardianNameRef}
                      id="guardian-name"
                      type="text"
                      name="guardian_name"
                      placeholder="e.g. Robert Vance"
                      value={formData.guardian_name}
                      onChange={handleChange}
                      onBlur={() => handleBlur('guardian_name')}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: '9999px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.95rem',
                        outline: 'none',
                        backgroundColor: '#ffffff'
                      }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="guardian-relationship"
                      style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#14532d', marginBottom: '4px' }}
                    >
                      Relationship
                    </label>
                    <select
                      id="guardian-relationship"
                      name="guardian_relationship"
                      value={formData.guardian_relationship}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: '9999px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.95rem',
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <label
                      htmlFor="guardian-phone"
                      style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#14532d', marginBottom: '4px' }}
                    >
                      Guardian Phone
                    </label>
                    <input
                      ref={guardianPhoneRef}
                      id="guardian-phone"
                      type="tel"
                      name="guardian_phone"
                      placeholder="+91 98765 43210"
                      value={formData.guardian_phone}
                      onChange={handleChange}
                      onBlur={() => handleBlur('guardian_phone')}
                      aria-invalid={touched.guardian_phone && Boolean(currentErrors.guardian_phone)}
                      aria-describedby={touched.guardian_phone && currentErrors.guardian_phone ? 'guardian_phone-error' : undefined}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: '9999px',
                        border: touched.guardian_phone && currentErrors.guardian_phone ? '2px solid #dc2626' : '1px solid #cbd5e1',
                        fontSize: '0.95rem',
                        outline: 'none',
                        backgroundColor: '#ffffff'
                      }}
                    />
                    {renderFieldError('guardian_phone', currentErrors.guardian_phone)}
                  </div>

                  <div>
                    <label
                      htmlFor="guardian-email"
                      style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#14532d', marginBottom: '4px' }}
                    >
                      Guardian Email
                    </label>
                    <input
                      ref={guardianEmailRef}
                      id="guardian-email"
                      type="email"
                      name="guardian_email"
                      placeholder="guardian@example.com"
                      value={formData.guardian_email}
                      onChange={handleChange}
                      onBlur={() => handleBlur('guardian_email')}
                      aria-invalid={touched.guardian_email && Boolean(currentErrors.guardian_email)}
                      aria-describedby={touched.guardian_email && currentErrors.guardian_email ? 'guardian_email-error' : undefined}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        borderRadius: '9999px',
                        border: touched.guardian_email && currentErrors.guardian_email ? '2px solid #dc2626' : '1px solid #cbd5e1',
                        fontSize: '0.95rem',
                        outline: 'none',
                        backgroundColor: '#ffffff'
                      }}
                    />
                    {renderFieldError('guardian_email', currentErrors.guardian_email)}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.88rem', color: '#166534', cursor: 'pointer', marginTop: '4px' }}>
                    <input
                      ref={guardianConsentRef}
                      type="checkbox"
                      name="guardian_report_consent"
                      checked={formData.guardian_report_consent}
                      onChange={handleChange}
                      onBlur={() => handleBlur('guardian_report_consent')}
                      style={{ marginTop: '3px', width: '18px', height: '18px', accentColor: '#15803d', cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: 600 }}>
                      The guardian has agreed to receive daily wellness reports via email
                    </span>
                  </label>
                  {renderFieldError('guardian_report_consent', currentErrors.guardian_report_consent)}
                </div>
              </div>

              {/* Consent Checkbox */}
              <div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.92rem', color: '#0b1f28', cursor: 'pointer' }}>
                  <input
                    ref={consentRef}
                    id="register-consent"
                    type="checkbox"
                    name="consent"
                    checked={formData.consent}
                    onChange={handleChange}
                    onBlur={() => handleBlur('consent')}
                    aria-invalid={touched.consent && Boolean(currentErrors.consent)}
                    aria-describedby={touched.consent && currentErrors.consent ? 'consent-error' : undefined}
                    style={{ marginTop: '3px', width: '20px', height: '20px', accentColor: '#00685b', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 600 }}>
                    I agree to the Terms of Service and consent to the secure collection and use of health data. <span style={{ color: '#b91c1c' }}>*</span>
                  </span>
                </label>
                {renderFieldError('consent', currentErrors.consent)}
              </div>

              {/* Submit Button (Never silently disabled before submit; disabled only while submitting) */}
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
                {submitting ? 'Creating account...' : 'Create Elderly Account'}
              </button>
            </form>

            <div style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.85rem',
              color: '#64748b'
            }}>
              <Shield size={16} style={{ color: '#00685b', flexShrink: 0 }} />
              <span>Your personal health information is encrypted and never shared without consent.</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
