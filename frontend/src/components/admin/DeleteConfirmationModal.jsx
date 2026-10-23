import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  user = null,
  item = null,
  title = "Delete Confirmation",
  entityType = "Record",
  loading = false
}) => {
  const target = user || item;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !target) return null;

  const displayName = target.name || target.full_name || target.email || 'this record';

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '28px',
          backgroundColor: 'var(--surface, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.18)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              aria-hidden="true"
            >
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 id="delete-modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, color: '#dc2626', margin: 0 }}>
                {title || `Delete ${entityType}`}
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Destructive Permanent Action</span>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <p style={{ color: 'var(--text-main)', fontSize: '0.95rem', marginBottom: '22px', lineHeight: 1.5 }}>
          Are you sure you want to permanently delete <strong>{displayName}</strong>
          {target.email ? ` (${target.email})` : ''}? This action cannot be undone and will permanently remove all associated data.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Deleting...' : `Delete ${entityType}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
