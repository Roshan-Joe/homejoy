import React from 'react';
import { Bell, CheckCircle2, Circle, ArrowRight, X } from 'lucide-react';

export const DailyReminderModal = ({ isOpen, onClose, pendingItems = [], onCompleteNow }) => {
  if (!isOpen) return null;

  return (
    <div className="carer-modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2500,
      padding: '20px'
    }}>
      <div className="card glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '480px',
        borderRadius: '24px',
        padding: '32px 28px',
        backgroundColor: '#ffffff',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18)',
        border: '1px solid var(--border-color)',
        textAlign: 'center',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '6px'
          }}
          aria-label="Close"
        >
          <X size={22} />
        </button>

        {/* Bell Icon Badge */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#eff6ff',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto',
          boxShadow: '0 8px 16px rgba(37, 99, 235, 0.15)'
        }}>
          <Bell size={32} className="animate-bounce" style={{ animationDuration: '2s' }} />
        </div>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
          Good Morning, Let's Complete Your Daily Check
        </h2>
        <p style={{ fontSize: '0.92rem', color: '#64748b', lineHeight: 1.5, marginBottom: '24px' }}>
          Your daily wellness information is still incomplete. Please complete your wellness check-in and enter your blood pressure and oxygen level.
        </p>

        {/* Pending Items Checklist */}
        <div style={{
          backgroundColor: '#f8fafc',
          borderRadius: '16px',
          padding: '16px 20px',
          textAlign: 'left',
          marginBottom: '28px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Pending Items Required Today:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem', fontWeight: 600, color: pendingItems.includes('Daily Wellness Check-in') ? '#e11d48' : '#10b981' }}>
              {pendingItems.includes('Daily Wellness Check-in') ? <Circle size={18} color="#e11d48" /> : <CheckCircle2 size={18} color="#10b981" />}
              <span>Daily Wellness Check-in</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem', fontWeight: 600, color: pendingItems.includes('Blood Pressure') ? '#e11d48' : '#10b981' }}>
              {pendingItems.includes('Blood Pressure') ? <Circle size={18} color="#e11d48" /> : <CheckCircle2 size={18} color="#10b981" />}
              <span>Blood Pressure</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem', fontWeight: 600, color: pendingItems.includes('Oxygen Level') ? '#e11d48' : '#10b981' }}>
              {pendingItems.includes('Oxygen Level') ? <Circle size={18} color="#e11d48" /> : <CheckCircle2 size={18} color="#10b981" />}
              <span>Oxygen Level</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {pendingItems.includes('Daily Wellness Check-in') && (
              <button
                onClick={() => {
                  onClose();
                  onCompleteNow ? onCompleteNow('checkin') : null;
                }}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  minWidth: '180px',
                  padding: '14px',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>Complete Check-in</span>
                <ArrowRight size={18} />
              </button>
            )}

            {(pendingItems.includes('Blood Pressure') || pendingItems.includes('Oxygen Level')) && (
              <button
                onClick={() => {
                  onClose();
                  onCompleteNow ? onCompleteNow('vitals') : null;
                }}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  minWidth: '180px',
                  padding: '14px',
                  borderRadius: '14px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  backgroundColor: '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>Enter Health Readings</span>
                <ArrowRight size={18} />
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '12px', borderRadius: '12px', fontWeight: 600, color: '#64748b' }}
          >
            Remind Me Later Today
          </button>
        </div>
      </div>
    </div>
  );
};

