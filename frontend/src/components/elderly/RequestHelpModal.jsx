import React, { useState } from 'react';
import { AlertTriangle, Send, X, HeartHandshake, CheckCircle2 } from 'lucide-react';
import elderlyClientService from '../../services/elderlyClientService';

export const RequestHelpModal = ({ isOpen, onClose, onRequestSent, assignedCaregiver = null }) => {
  const [selectedReason, setSelectedReason] = useState('I am not feeling well');
  const [customMessage, setCustomMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const reasons = [
    { label: 'I am not feeling well', icon: '🤒' },
    { label: 'I need assistance', icon: '🤝' },
    { label: 'I missed my medication', icon: '💊' },
    { label: 'Other', icon: '💬' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setSubmitting(true);
      const res = await elderlyClientService.submitHelpRequest({
        reason: selectedReason,
        message: selectedReason === 'Other' ? customMessage : customMessage || selectedReason
      });

      setSuccess(true);
      onRequestSent && onRequestSent(res);

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Failed to send help request:', err);
      setError(err.response?.data?.detail || 'Failed to dispatch help request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="carer-modal-backdrop" style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2500,
      padding: '20px'
    }}>
      <div className="card glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '500px',
        borderRadius: '24px',
        padding: '32px',
        backgroundColor: '#ffffff',
        boxShadow: '0 20px 50px rgba(225, 29, 72, 0.25)',
        border: '2px solid #ffe4e6',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px', right: '20px',
            background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer'
          }}
        >
          <X size={22} />
        </button>

        {/* Warning Icon Badge */}
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          backgroundColor: '#ffe4e6', color: '#e11d48',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px auto',
          boxShadow: '0 8px 20px rgba(225, 29, 72, 0.2)'
        }}>
          <AlertTriangle size={32} />
        </div>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', textAlign: 'center', marginBottom: '4px' }}>
          Do you need help from your caregiver?
        </h2>
        <p style={{ fontSize: '0.88rem', color: '#64748b', textAlign: 'center', marginBottom: '20px' }}>
          Assigned Caregiver: <strong style={{ color: 'var(--primary)' }}>{assignedCaregiver?.caregiver_name || 'Assigned Staff'}</strong>
        </p>

        {success ? (
          <div style={{
            backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534',
            padding: '20px', borderRadius: '16px', textAlign: 'center', margin: '20px 0'
          }}>
            <CheckCircle2 size={40} color="#16a34a" style={{ margin: '0 auto 10px auto' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 4px 0' }}>Help Request Sent!</h3>
            <p style={{ fontSize: '0.88rem', margin: 0 }}>
              Your caregiver has been notified immediately and will contact you shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b',
                padding: '12px', borderRadius: '12px', fontSize: '0.85rem', marginBottom: '16px'
              }}>
                {error}
              </div>
            )}

            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
              What do you need help with?
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {reasons.map((item) => (
                <button
                  type="button"
                  key={item.label}
                  onClick={() => setSelectedReason(item.label)}
                  style={{
                    padding: '14px 12px',
                    borderRadius: '14px',
                    border: selectedReason === item.label ? '2px solid #e11d48' : '1px solid #e2e8f0',
                    backgroundColor: selectedReason === item.label ? '#fff1f2' : '#f8fafc',
                    color: selectedReason === item.label ? '#9f1239' : '#334155',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                  <span style={{ textAlign: 'left', lineHeight: 1.2 }}>{item.label}</span>
                </button>
              ))}
            </div>

            {(selectedReason === 'Other' || selectedReason) && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Tell your caregiver what you need..."
                  rows="3"
                  maxLength="500"
                  style={{
                    width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1',
                    fontSize: '0.9rem', outline: 'none', backgroundColor: '#ffffff'
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
                style={{ flex: 1, padding: '14px', borderRadius: '12px', fontWeight: 600 }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  flex: 1.6,
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: '#e11d48',
                  color: '#ffffff',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)'
                }}
              >
                <Send size={18} />
                <span>{submitting ? 'Sending...' : 'Yes, Request Help'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
