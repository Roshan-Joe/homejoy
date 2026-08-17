import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Award, Clock, Star, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import caregiverPortalService from '../../services/caregiverPortalService';

export const CaregiverProfileView = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    qualification: '',
    shift: 'Day',
    profileImage: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await caregiverPortalService.getProfile();
        setProfile(res);
        setFormData({
          name: res.name || res.full_name || '',
          phone: res.phone || '',
          qualification: res.qualification || 'Certified Nursing Assistant (CNA)',
          shift: res.shift || 'Day',
          profileImage: res.profileImage || ''
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setMsg('');
      setError('');
      const updated = await caregiverPortalService.updateProfile(formData);
      setProfile(updated);
      setMsg('Your caregiver profile was updated successfully.');
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
        Loading caregiver profile...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-card" style={{ padding: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 4px 0' }}>Caregiver Staff Profile</h1>
        <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
          Manage your contact details, qualification, shift preference, and avatar. Account roles and assignments are managed by System Admin.
        </p>
      </div>

      {msg && (
        <div className="alert alert-success animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} />
          <span>{msg}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-error animate-fade-in">
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* Profile Card Summary */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            width: '90px', height: '90px', borderRadius: '50%', background: 'var(--primary-light)',
            color: 'var(--primary)', fontWeight: 700, fontSize: '2.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '16px', overflow: 'hidden'
          }}>
            {formData.profileImage ? (
              <img src={formData.profileImage} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              (profile?.name || 'C').charAt(0)
            )}
          </div>

          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: '0 0 4px 0', color: '#1e293b' }}>
            {profile?.name}
          </h2>
          <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '16px' }}>
            Role: Caregiver Staff
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', fontSize: '0.88rem', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Account Status:</span>
              <span style={{ fontWeight: 600, color: '#047857' }}>{profile?.status || 'Active'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Shift:</span>
              <span style={{ fontWeight: 600 }}>{profile?.shift}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Performance Rating:</span>
              <span style={{ fontWeight: 600, color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Star size={14} fill="#f59e0b" /> {profile?.performance_rating || 4.8} / 5.0
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Assigned Elderly Count:</span>
              <span style={{ fontWeight: 600 }}>{profile?.assigned_elderly_ids?.length || 0} clients</span>
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px 0' }}>Edit Profile Information</h3>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address (Read-only)</label>
              <input
                type="email"
                className="form-input"
                value={profile?.email || ''}
                disabled
                style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Qualification / Certification</label>
              <input
                type="text"
                className="form-input"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Shift Preference</label>
              <select
                className="form-input"
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
              >
                <option value="Day">Day Shift</option>
                <option value="Night">Night Shift</option>
                <option value="Rotational">Rotational Shift</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Profile Image URL (Optional)</label>
              <input
                type="url"
                className="form-input"
                value={formData.profileImage}
                onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ marginTop: '12px' }}>
              {submitting ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
