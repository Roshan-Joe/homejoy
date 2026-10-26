import React, { useState, useEffect } from 'react';
import { UserCheck, Phone, Mail, Award, Clock, MapPin, Calendar, ShieldCheck } from 'lucide-react';
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

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading caregiver details...</div>;

  return (
    <div className="animate-fade-in">
      <PageHeader icon={<UserCheck size={22} />} title="My Caregiver" subtitle="Your assigned primary caregiver set by your care administrator" onBack={onBack} />
      {error && <div className="alert alert-error">{error}</div>}

      {caregiver?.is_assigned ? (
        <div className="glass-card" style={{ padding: '32px', background: 'linear-gradient(135deg, #f0fdfa, #e0f2fe)', border: '1.5px solid rgba(13,148,136,0.3)', borderRadius: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #0d9488, #0284c7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', fontWeight: 800, boxShadow: '0 8px 16px rgba(13,148,136,0.25)' }}>
              {(caregiver.caregiver_name || 'C').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>{caregiver.caregiver_name}</h2>
                <span className="badge badge-success" style={{ fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={13} /> Active Primary Caregiver
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '4px' }}>
                {caregiver.qualification || 'Certified Senior Care Specialist'}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {caregiver.phone && (
              <div style={{ background: 'rgba(255,255,255,0.85)', borderRadius: '14px', padding: '16px 20px', border: '1px solid rgba(226,232,240,0.8)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Phone size={14} style={{ color: 'var(--primary)' }} /> Contact Phone
                </span>
                <a href={`tel:${caregiver.phone}`} style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)', textDecoration: 'none' }}>
                  {caregiver.phone}
                </a>
              </div>
            )}

            {caregiver.shift && (
              <div style={{ background: 'rgba(255,255,255,0.85)', borderRadius: '14px', padding: '16px 20px', border: '1px solid rgba(226,232,240,0.8)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Clock size={14} style={{ color: '#0284c7' }} /> Duty Shift
                </span>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                  {caregiver.shift}
                </span>
              </div>
            )}

            {caregiver.district && (
              <div style={{ background: 'rgba(255,255,255,0.85)', borderRadius: '14px', padding: '16px 20px', border: '1px solid rgba(226,232,240,0.8)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <MapPin size={14} style={{ color: '#e11d48' }} /> Care Region / District
                </span>
                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                  {caregiver.district}
                </span>
              </div>
            )}

            {caregiver.email && (
              <div style={{ background: 'rgba(255,255,255,0.85)', borderRadius: '14px', padding: '16px 20px', border: '1px solid rgba(226,232,240,0.8)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Mail size={14} style={{ color: '#7c3aed' }} /> Email
                </span>
                <a href={`mailto:${caregiver.email}`} style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', textDecoration: 'none' }}>
                  {caregiver.email}
                </a>
              </div>
            )}

            {caregiver.assigned_date && (
              <div style={{ background: 'rgba(255,255,255,0.85)', borderRadius: '14px', padding: '16px 20px', border: '1px solid rgba(226,232,240,0.8)' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <Calendar size={14} style={{ color: '#059669' }} /> Assigned Since
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  {new Date(caregiver.assigned_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>

          <div style={{ marginTop: '24px', padding: '14px 18px', background: 'rgba(255,255,255,0.7)', borderRadius: '12px', fontSize: '0.88rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span>Your caregiver monitors your daily wellness check-ins, medication logs, and clinical alerts. To change your assignment, contact your care administrator.</span>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>⏳</div>
          <h2 style={{ fontWeight: 700, marginBottom: '8px' }}>Caregiver Assignment Pending</h2>
          <p style={{ color: 'var(--text-muted)' }}>An administrator is currently allocating a dedicated caregiver based on your district. Please check back shortly.</p>
        </div>
      )}
    </div>
  );
};
export default CaregiverViewPage;
