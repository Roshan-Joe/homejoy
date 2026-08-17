import React, { useState, useEffect } from 'react';
import { Stethoscope } from 'lucide-react';
import elderlyClientService from '../../services/elderlyClientService';
import { PageHeader } from './ElderlyProfilePage';

export const DoctorInfoPage = ({ onBack }) => {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    elderlyClientService.getDoctorInfo()
      .then(setDoctor)
      .catch(() => setError('Could not load doctor information.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>;

  return (
    <div className="animate-fade-in">
      <PageHeader icon={<Stethoscope size={22} />} title="Doctor Information" subtitle="Your assigned doctor set by your care administrator" onBack={onBack} />
      {error && <div className="alert alert-error">{error}</div>}

      {doctor?.is_assigned ? (
        <div className="glass-card" style={{ padding: '28px', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>
              {(doctor.doctor_name || 'D').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Dr. {doctor.doctor_name}</h2>
              {doctor.specialization && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{doctor.specialization}</p>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {doctor.hospital && <InfoRow label="Hospital / Clinic" value={doctor.hospital} />}
            {doctor.contact_number && <InfoRow label="Contact Number" value={doctor.contact_number} />}
          </div>
          <div className="alert alert-success" style={{ marginTop: '20px', fontSize: '0.85rem' }}>
            ✓ A doctor has been assigned to your care plan. Contact your care administrator to make any changes.
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🩺</div>
          <h2 style={{ fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>No Doctor Assigned Yet</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Your care administrator will assign a doctor to your profile. Please contact them if you need assistance.</p>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div>
    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</span>
    <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>{value || '—'}</span>
  </div>
);
