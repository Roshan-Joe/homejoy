import React from 'react';
import { FileText, CheckCircle2, AlertCircle, Heart, Wind, Pill, Smile, Moon, Activity, X } from 'lucide-react';

export const DailyReportModal = ({ isOpen, onClose, report }) => {
  if (!isOpen || !report) return null;

  const isComplete = report.status === 'Complete';

  return (
    <div className="carer-modal-backdrop" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2500, padding: '20px'
    }}>
      <div className="card glass-card animate-fade-in" style={{
        width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto',
        borderRadius: '24px', padding: '32px', backgroundColor: '#ffffff',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18)', position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
        >
          <X size={22} />
        </button>

        {/* Report Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#eff6ff', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={26} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                DAILY WELLNESS REPORT
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                {report.elderly_name} — {report.date}
              </p>
            </div>
          </div>

          <span style={{
            padding: '6px 14px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 800,
            backgroundColor: isComplete ? '#dcfce7' : '#fef3c7',
            color: isComplete ? '#15803d' : '#b45309'
          }}>
            {isComplete ? '✓ Report Completed' : '⏳ Pending Entries'}
          </span>
        </div>

        {/* Overview Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Medication</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>{report.medication_adherence || 'N/A'}</div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Blood Pressure</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: report.vitals_data ? 'var(--text-main)' : '#94a3b8' }}>
              {report.vitals_data ? `${report.vitals_data.systolic} / ${report.vitals_data.diastolic} mmHg` : 'Pending'}
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Oxygen Saturation</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: report.vitals_data ? 'var(--text-main)' : '#94a3b8' }}>
              {report.vitals_data ? `${report.vitals_data.oxygen_saturation} % SpO₂` : 'Pending'}
            </div>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Wellness Risk</div>
            <div style={{
              fontSize: '1.05rem', fontWeight: 800,
              color: report.wellness_risk === 'High' ? '#e11d48' : report.wellness_risk === 'Moderate' ? '#d97706' : '#16a34a'
            }}>
              {report.wellness_risk || 'Low'}
            </div>
          </div>
        </div>

        {/* Detailed Check-in Metrics */}
        {report.checkin_data && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 14px 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Daily Wellness Check-in Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.9rem' }}>
              <div><strong style={{ color: '#475569' }}>Mood:</strong> {report.checkin_data.mood || 'N/A'}</div>
              <div><strong style={{ color: '#475569' }}>Sleep Quality:</strong> {report.checkin_data.sleep_quality || 'N/A'}</div>
              <div><strong style={{ color: '#475569' }}>Appetite:</strong> {report.checkin_data.appetite || 'N/A'}</div>
              <div><strong style={{ color: '#475569' }}>Mobility:</strong> {report.checkin_data.mobility_difficulty || 'N/A'}</div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong style={{ color: '#475569' }}>Symptoms Logged:</strong> {report.checkin_data.symptoms || 'None reported'}
              </div>
            </div>
          </div>
        )}

        {/* Explainable AI Risk Factor Breakdown */}
        {report.explainable_risk && (
          <div style={{ backgroundColor: '#fff8f6', borderRadius: '16px', border: '1px solid #ffedd5', padding: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#9a3412', margin: 0 }}>
                Explainable Risk Breakdown
              </h3>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ea580c' }}>
                Confidence: {report.explainable_risk.confidence_score || '88'}%
              </span>
            </div>

            <p style={{ fontSize: '0.86rem', color: '#7c2d12', margin: '0 0 12px 0' }}>
              {report.explainable_risk.summary}
            </p>

            {report.explainable_risk.risk_factors && report.explainable_risk.risk_factors.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: '#7c2d12' }}>
                {report.explainable_risk.risk_factors.map((rf, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>
                    <strong>{rf.factor_name}:</strong> {rf.description}
                  </li>
                ))}
              </ul>
            )}

            <div style={{ marginTop: '12px', fontSize: '0.76rem', color: '#9a3412', fontStyle: 'italic' }}>
              {report.explainable_risk.safety_disclaimer}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 700 }}>
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
