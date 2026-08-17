import React from 'react';
import { X, HeartPulse, ShieldAlert, UserCheck, Stethoscope, Phone, Calendar, Pill, AlertTriangle } from 'lucide-react';

export const MedicalProfileModal = ({ isOpen, onClose, elderly }) => {
  if (!isOpen || !elderly) return null;

  const displayName = elderly.name || elderly.full_name || 'Elderly Patient';
  const riskLevel = (elderly.risk_level || 'low').toLowerCase();

  let riskBg = '#ecfdf5';
  let riskColor = '#047857';
  if (riskLevel === 'high') { riskBg = '#fef2f2'; riskColor = '#b91c1c'; }
  else if (riskLevel === 'medium') { riskBg = '#fffbeb'; riskColor = '#b45309'; }

  const history = elderly.wellness_history || [];

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        backgroundColor: '#ffffff'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HeartPulse size={22} color="var(--primary)" />
              <span>Medical Profile & Wellness History</span>
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Comprehensive patient health overview & AI risk assessment
            </span>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Top Summary Card */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '18px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          justify: 'space-between',
          alignItems: 'center',
          gap: '14px'
        }}>
          <div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{displayName}</h4>
            <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              {elderly.age} Years • {elderly.gender} • Blood Group: <strong style={{ color: 'var(--primary)' }}>{elderly.blood_group}</strong>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              DOB: {elderly.date_of_birth} • Phone: {elderly.phone || 'N/A'}
            </div>
          </div>

          <div style={{
            backgroundColor: riskBg,
            color: riskColor,
            padding: '10px 16px',
            borderRadius: '12px',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              AI RISK LEVEL
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
              {(elderly.risk_level || 'Low').toUpperCase()} ({(elderly.ai_risk_score * 100).toFixed(0)}%)
            </div>
          </div>
        </div>

        {/* Assigned Staff Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', backgroundColor: '#ffffff' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={16} color="#15803d" />
              <span>Assigned Caregiver</span>
            </span>
            <div style={{ fontSize: '0.98rem', fontWeight: 700, marginTop: '6px', color: 'var(--text-main)' }}>
              {elderly.assigned_caregiver_name}
            </div>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', backgroundColor: '#ffffff' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Stethoscope size={16} color="#6b21a8" />
              <span>Assigned Doctor</span>
            </span>
            <div style={{ fontSize: '0.98rem', fontWeight: 700, marginTop: '6px', color: 'var(--text-main)' }}>
              {elderly.assigned_doctor_name}
            </div>
          </div>
        </div>

        {/* Medical Profile Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h5 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px' }}>Medical Conditions</h5>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {elderly.medical_conditions && elderly.medical_conditions.length > 0 ? (
                elderly.medical_conditions.map((cond, i) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, backgroundColor: '#fef3c7', color: '#b45309' }}>
                    {cond}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No medical conditions recorded</span>
              )}
            </div>
          </div>

          <div>
            <h5 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px' }}>Known Allergies</h5>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {elderly.allergies && elderly.allergies.length > 0 ? (
                elderly.allergies.map((all, i) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, backgroundColor: '#fce7f3', color: '#be185d' }}>
                    {all}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No known allergies</span>
              )}
            </div>
          </div>

          <div>
            <h5 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '8px' }}>Active Medications</h5>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {elderly.medications && elderly.medications.length > 0 ? (
                elderly.medications.map((med, i) => (
                  <span key={i} style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, backgroundColor: '#e0f2fe', color: '#0369a1', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Pill size={12} />
                    <span>{med}</span>
                  </span>
                ))
              ) : (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No active prescriptions</span>
              )}
            </div>
          </div>

          <div>
            <h5 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '4px' }}>Emergency Contact</h5>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
              <strong>{elderly.emergency_contact_name || 'Not provided'}</strong> • {elderly.emergency_contact_phone || 'No phone'}
            </div>
          </div>
        </div>

        {/* Wellness Check-in History */}
        <div>
          <h5 style={{ fontSize: '0.98rem', fontWeight: 700, marginBottom: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
            Wellness Check-in History ({history.length})
          </h5>

          {history.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
              No check-in logs recorded yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.map((log, index) => (
                <div key={index} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', backgroundColor: '#f8fafc' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>
                    <span>Date: {log.date}</span>
                    <span>Mood: {log.mood}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                    BP: <strong>{log.blood_pressure}</strong> • Heart Rate: <strong>{log.heart_rate} bpm</strong>
                  </div>
                  {log.notes && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      "{log.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'right', marginTop: '24px' }}>
          <button className="btn btn-primary" onClick={onClose}>Close Medical Profile</button>
        </div>
      </div>
    </div>
  );
};

export default MedicalProfileModal;
