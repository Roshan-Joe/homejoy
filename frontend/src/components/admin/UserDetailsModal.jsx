import React from 'react';
import { X, User, Mail, Phone, Calendar, Shield, CheckCircle2, XCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';

export const UserDetailsModal = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  const displayName = user.name || user.full_name || 'User Profile';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '28px', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>User Profile Details</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt={displayName}
              style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.4rem'
            }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{displayName}</h4>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>MongoDB ID: {user.id}</div>
            <div style={{ marginTop: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)'
              }}>
                {user.role}
              </span>
              <StatusBadge status={user.status} isActive={user.is_active} interactive={false} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.92rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Mail size={18} style={{ color: 'var(--text-muted)' }} />
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>Email Address</span>
              <strong>{user.email}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Phone size={18} style={{ color: 'var(--text-muted)' }} />
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>Phone Number</span>
              <strong>{user.phone || 'Not provided'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={18} style={{ color: 'var(--text-muted)' }} />
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>Authentication Method</span>
              <strong>{user.googleId ? 'Google OAuth 2.0' : 'Email & Password (JWT)'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>Account Created</span>
              <strong>{user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}</strong>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', marginTop: '24px' }}>
          <button className="btn btn-primary" onClick={onClose}>Close Profile</button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
