import React, { useState, useEffect } from 'react';
import { X, Award, Star, CheckCircle2, Clock, ThumbsUp, Calendar } from 'lucide-react';
import caregiverService from '../../services/caregiverService';

export const CaregiverPerformanceModal = ({ isOpen, onClose, caregiver = null }) => {
  const [perfData, setPerfData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && caregiver) {
      fetchPerformance();
    }
  }, [isOpen, caregiver]);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const data = await caregiverService.getCaregiverPerformance(caregiver.id);
      setPerfData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !caregiver) return null;

  const displayName = caregiver.name || caregiver.full_name || 'Caregiver Staff';
  const rating = perfData ? perfData.rating : (caregiver.performance_rating || 4.8);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '28px', backgroundColor: '#ffffff' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={22} color="#d97706" />
              <span>Caregiver Performance Scorecard</span>
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Staff efficiency, attendance & patient feedback evaluation
            </span>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            Loading performance analytics...
          </div>
        ) : (
          <div>
            {/* Top Score Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              color: '#ffffff',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{displayName}</h4>
                <div style={{ fontSize: '0.86rem', opacity: 0.9 }}>
                  {caregiver.qualification} • {caregiver.shift} Shift
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', opacity: 0.9 }}>
                  RATING SCORE
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={18} fill="#ffffff" />
                  <span>{rating.toFixed(1)} / 5.0</span>
                </div>
              </div>
            </div>

            {/* Metric Score Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', backgroundColor: '#f8fafc' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={16} color="var(--primary)" />
                  <span>Report On-Time Rate</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '4px' }}>
                  {perfData ? perfData.on_time_submission_rate : 96.5}%
                </div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', backgroundColor: '#f8fafc' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ThumbsUp size={16} color="#16a34a" />
                  <span>Patient Feedback</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>
                  {perfData ? perfData.patient_feedback_score : 4.9} / 5.0
                </div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', backgroundColor: '#f8fafc' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={16} color="#9333ea" />
                  <span>Shift Attendance</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#9333ea', marginTop: '4px' }}>
                  {perfData ? perfData.attendance_rate : 98.0}%
                </div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', backgroundColor: '#f8fafc' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} color="#d97706" />
                  <span>Daily Logs Submitted</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>
                  {perfData ? perfData.total_reports : caregiver.daily_reports_submitted || 0}
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'right', marginTop: '24px' }}>
          <button className="btn btn-primary" onClick={onClose}>Close Scorecard</button>
        </div>
      </div>
    </div>
  );
};

export default CaregiverPerformanceModal;
