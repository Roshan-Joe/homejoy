import React, { useState, useEffect } from 'react';
import { UserCheck } from 'lucide-react';
import elderlyClientService from '../../services/elderlyClientService';
import { PageHeader } from './ElderlyProfilePage';

export const CaregiverViewPage = ({ onBack }) => {
  const [caregiver, setCaregiver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    elderlyClientService.getCaregiver()
      .then(setCaregiver)
      .catch(() => setError('Could not load caregiver information.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div className="animate-fade-in">
      <PageHeader icon={<UserCheck size={22} />} title="My Caregiver" subtitle="Your assigned caregiver set by your care administrator" onBack={onBack} />
      {error && <div className="alert alert-error">{error}</div>}

      {caregiver?.is_assigned ? (
        <div className="glass-card" style={{ padding: '32px', background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)', border: '1px solid rgba(2,132,199,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'var(--secondary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800 }}>
              {(caregiver.caregiver_name || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{caregiver.caregiver_name}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>Assigned Caregiver</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {caregiver.phone && (
              <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '14px 18px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Phone Number</span>
                <a href={`tel:${caregiver.phone}`} style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--secondary)', textDecoration: 'none' }}>{caregiver.phone}</a>
              </div>
            )}
            {caregiver.assigned_date && (
              <div style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '12px', padding: '14px 18px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>Assigned Since</span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{new Date(caregiver.assigned_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
              </div>
            )}
          </div>
          <div style={{ marginTop: '20px', padding: '12px 16px', background: 'rgba(255,255,255,0.5)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            To change your caregiver assignment, please contact your care administrator.
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>👤</div>
          <h2 style={{ fontWeight: 700, marginBottom: '8px' }}>No Caregiver Assigned Yet</h2>
          <p style={{ color: 'var(--text-muted)' }}>Your care administrator will assign a caregiver. Please contact them for assistance.</p>
        </div>
      )}
    </div>
  );
};
