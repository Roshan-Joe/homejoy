import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, user = null, loading = false }) => {
  if (!isOpen || !user) return null;

  const displayName = user.name || user.full_name || 'this user';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '28px', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--danger)' }}>
              Delete User Account
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Permanent Action</span>
          </div>
        </div>

        <p style={{ color: 'var(--text-main)', fontSize: '0.94rem', marginBottom: '20px', lineHeight: 1.5 }}>
          Are you sure you want to permanently delete user account <strong>{displayName}</strong> ({user.email})?
          This action cannot be undone and will remove all associated user data from MongoDB Atlas.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete User'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
