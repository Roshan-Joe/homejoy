import React, { useState, useEffect } from 'react';
import { User, Save } from 'lucide-react';
import elderlyClientService from '../../services/elderlyClientService';

const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];

export const ElderlyProfilePage = ({ onBack }) => {
  const [form, setForm] = useState({ full_name: '', phone: '', date_of_birth: '', gender: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    elderlyClientService.getProfile()
      .then(data => {
        setProfile(data);
        setForm({
          full_name: data.full_name || '',
          phone: data.phone || '',
          date_of_birth: data.date_of_birth || '',
          gender: data.gender || '',
          address: data.address || '',
        });
      })
      .catch(() => setError('Could not load profile. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (field, value) => {
    setForm(f => ({ ...f, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await elderlyClientService.updateProfile(form);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading profile...</div>;

  return (
    <div className="animate-fade-in">
      <PageHeader icon={<User size={22} />} title="My Profile" subtitle="Update your personal information" onBack={onBack} />

      {/* Profile summary card */}
      {profile && (
        <div className="glass-card" style={{ padding: '20px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px', background: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)', border: '1px solid rgba(13,148,136,0.2)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>
            {(profile.full_name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{profile.full_name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{profile.email}</div>
            {profile.age && <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Age: {profile.age} years</div>}
          </div>
        </div>
      )}

      <div className="glass-card" style={{ padding: '28px' }}>
        {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: '20px' }}>✓ {success}</div>}

        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>Full Name</label>
              <input className="form-input" value={form.full_name} onChange={e => handleChange('full_name', e.target.value)} placeholder="Your full name" required minLength={2} style={{ fontSize: '1rem', minHeight: '52px' }} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>Phone Number</label>
              <input className="form-input" value={form.phone} onChange={e => handleChange('phone', e.target.value)} placeholder="+60 12-345 6789" type="tel" style={{ fontSize: '1rem', minHeight: '52px' }} />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>Date of Birth</label>
              <input className="form-input" type="date" value={form.date_of_birth} onChange={e => handleChange('date_of_birth', e.target.value)} max={new Date().toISOString().split('T')[0]} style={{ fontSize: '1rem', minHeight: '52px' }} />
              {form.date_of_birth && <div style={{ fontSize: '0.88rem', color: '#0d9488', marginTop: '6px', fontWeight: 600 }}>
                Your age: {calculateAge(form.date_of_birth)} years old
              </div>}
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>Gender</label>
              <select className="form-select" value={form.gender} onChange={e => handleChange('gender', e.target.value)} style={{ fontSize: '1rem', minHeight: '52px' }}>
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>Home Address</label>
              <textarea className="form-input" value={form.address} onChange={e => handleChange('address', e.target.value)} rows={3} placeholder="Your full home address" style={{ resize: 'vertical', fontSize: '1rem' }} />
            </div>
          </div>

          <div style={{ marginTop: '28px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', minHeight: '60px', fontSize: '1.1rem', fontWeight: 800, borderRadius: '14px' }}>
              {saving ? 'Saving…' : '💾  Save My Profile'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

function calculateAge(dobStr) {
  if (!dobStr) return '—';
  const dob = new Date(dobStr);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

export const PageHeader = ({ icon, title, subtitle, onBack }) => (
  <div style={{ marginBottom: '24px' }}>
    {onBack && (
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '12px 20px', borderRadius: '12px',
          border: '1.5px solid #e2e8f0', background: '#f8fafc',
          color: '#475569', fontWeight: 700, fontSize: '1rem',
          cursor: 'pointer', marginBottom: '18px', minHeight: '48px',
          transition: 'all 0.18s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; }}
      >
        ← Back to Home
      </button>
    )}
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{
        padding: '12px', background: 'var(--primary-light, #ccfbf1)',
        borderRadius: '14px', flexShrink: 0,
      }}>
        {React.cloneElement(icon, { color: 'var(--primary, #0d9488)', size: 24 })}
      </div>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>{title}</h1>
        {subtitle && <p style={{ color: '#64748b', fontSize: '0.92rem', marginTop: '4px' }}>{subtitle}</p>}
      </div>
    </div>
  </div>
);

