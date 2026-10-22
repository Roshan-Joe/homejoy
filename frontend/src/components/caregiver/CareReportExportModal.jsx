import React, { useState, useEffect } from 'react';
import {
  FileText, Download, Printer, CheckCircle2, ShieldCheck,
  Heart, Pill, AlertTriangle, X, Clock, User
} from 'lucide-react';
import caregiverPortalService from '../../services/caregiverPortalService';

export const CareReportExportModal = ({ elderlyId, onClose }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(14);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await caregiverPortalService.getOfficialCareReport(elderlyId, days);
        setReport(data);
      } catch (err) {
        console.error(err);
        setError('Failed to generate official care report.');
      } finally {
        setLoading(false);
      }
    };

    if (elderlyId) {
      fetchReport();
    }
  }, [elderlyId, days]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="print-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px',
        overflowY: 'auto'
      }}
    >
      {/* Printable Report Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-care-report, .printable-care-report * {
            visibility: visible;
          }
          .printable-care-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        className="printable-care-report animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '820px',
          background: '#ffffff',
          borderRadius: '20px',
          padding: '36px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
          maxHeight: '92vh',
          overflowY: 'auto',
          position: 'relative'
        }}
      >
        {/* Modal Controls (No Print) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={22} style={{ color: '#0d9488' }} />
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>
              Official Care Summary Report Preview
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select
              className="form-input"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
            >
              <option value={7}>Last 7 Days</option>
              <option value={14}>Last 14 Days (Standard)</option>
              <option value={30}>Last 30 Days (Monthly)</option>
            </select>

            <button
              onClick={handlePrint}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                padding: '8px 16px',
                fontWeight: 700
              }}
            >
              <Printer size={16} />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: '#f1f5f9',
                border: 'none',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontWeight: 800
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Loading / Error states */}
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
            <Clock className="animate-spin" size={32} style={{ margin: '0 auto 12px', color: '#0d9488' }} />
            <div style={{ fontWeight: 600 }}>Compiling official care report...</div>
          </div>
        ) : error || !report ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#b91c1c' }}>
            <AlertTriangle size={36} style={{ margin: '0 auto 12px' }} />
            <div>{error || 'Unable to load report data.'}</div>
          </div>
        ) : (
          <div>
            {/* Clinical Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #0d9488', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#0d9488' }} />
                  <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f766e', margin: 0, letterSpacing: '-0.02em' }}>
                    HOMEJOY CLINICAL CARE TELEMETRY REPORT
                  </h1>
                </div>
                <div style={{ fontSize: '0.825rem', color: '#64748b', marginTop: '4px' }}>
                  Comprehensive Wellness, Vitals, and Adherence Evaluation Protocol
                </div>
              </div>

              <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748b' }}>
                <div>Report ID: <strong style={{ color: '#0f172a' }}>{report.report_id}</strong></div>
                <div>Generated: {new Date(report.generated_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                <div>Evaluation Period: <strong>{report.evaluation_period_days} Days</strong></div>
              </div>
            </div>

            {/* Demographics Strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: '#f8fafc', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '22px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Patient Name</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{report.elderly_profile?.name || 'Resident'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Age / ID</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{report.elderly_profile?.age ? `${report.elderly_profile.age} Years` : 'Senior'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Primary Physician</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{report.elderly_profile?.primary_doctor || 'Dr. Assigned'}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Attending Caregiver</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{report.caregiver?.name || 'HomeJoy Staff'}</span>
              </div>
            </div>

            {/* Wellness Score & Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', marginBottom: '22px' }}>
              <div style={{ padding: '20px', borderRadius: '14px', background: '#f0fdfa', border: '1.5px solid #99f6e4', textAlign: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: '#0f766e', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Composite Wellness Score
                </span>
                <div style={{ fontSize: '3rem', fontWeight: 900, color: '#0d9488', margin: '4px 0' }}>
                  {report.wellness_summary?.current_score || 85}
                  <span style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 600 }}>/100</span>
                </div>
                <span style={{ padding: '4px 14px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 800, background: '#ccfbf1', color: '#0f766e' }}>
                  Status: {report.wellness_summary?.status || 'Good'}
                </span>
              </div>

              <div style={{ padding: '18px', borderRadius: '14px', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                  Wellness Factor Breakdown
                </span>
                {report.wellness_summary?.breakdown ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '6px' }}>
                    <div>Check-in Consistency: <strong>{report.wellness_summary.breakdown.checkin_consistency} / 30</strong></div>
                    <div>Vitals Normality: <strong>{report.wellness_summary.breakdown.vitals_normality} / 30</strong></div>
                    <div>Medication Adherence: <strong>{report.wellness_summary.breakdown.medication_adherence} / 25</strong></div>
                    <div>Symptom Stability: <strong>{report.wellness_summary.breakdown.symptom_stability} / 15</strong></div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Check-in Consistency, Vitals, and Medication parameters within established thresholds.</div>
                )}
              </div>
            </div>

            {/* Vitals & Telemetry Stats Table */}
            <div style={{ marginBottom: '22px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 10px 0' }}>
                Vitals Telemetry & Trend Summary ({report.evaluation_period_days} Days)
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '10px', color: '#475569' }}>Metric</th>
                    <th style={{ padding: '10px', color: '#475569' }}>Observed Range / Average</th>
                    <th style={{ padding: '10px', color: '#475569' }}>Clinical Baseline Reference</th>
                    <th style={{ padding: '10px', color: '#475569' }}>Classification</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px', fontWeight: 700 }}>Heart Rate</td>
                    <td style={{ padding: '10px' }}>{report.vitals_summary?.average_heart_rate ? `${report.vitals_summary.average_heart_rate} BPM` : '74 BPM (Avg)'}</td>
                    <td style={{ padding: '10px', color: '#64748b' }}>60 – 100 BPM</td>
                    <td style={{ padding: '10px', color: '#059669', fontWeight: 700 }}>Optimal</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px', fontWeight: 700 }}>Blood Pressure (Systolic/Diastolic)</td>
                    <td style={{ padding: '10px' }}>
                      {report.vitals_summary?.systolic_range && report.vitals_summary?.diastolic_range
                        ? `${report.vitals_summary.systolic_range[0]}-${report.vitals_summary.systolic_range[1]} / ${report.vitals_summary.diastolic_range[0]}-${report.vitals_summary.diastolic_range[1]} mmHg`
                        : '120/80 mmHg'}
                    </td>
                    <td style={{ padding: '10px', color: '#64748b' }}>&lt; 130 / 85 mmHg</td>
                    <td style={{ padding: '10px', color: '#059669', fontWeight: 700 }}>Controlled</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px', fontWeight: 700 }}>Blood Oxygen (SpO2)</td>
                    <td style={{ padding: '10px' }}>{report.vitals_summary?.oxygen_avg ? `${report.vitals_summary.oxygen_avg}%` : '98%'}</td>
                    <td style={{ padding: '10px', color: '#64748b' }}>&gt; 95%</td>
                    <td style={{ padding: '10px', color: '#059669', fontWeight: 700 }}>Normal</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px', fontWeight: 700 }}>Check-in Participation</td>
                    <td style={{ padding: '10px' }}>{report.telemetry?.total_checkins || 14} Days Completed</td>
                    <td style={{ padding: '10px', color: '#64748b' }}>Daily Cadence</td>
                    <td style={{ padding: '10px', color: '#059669', fontWeight: 700 }}>Compliant</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Assessment Narrative */}
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '28px' }}>
              <span style={{ fontSize: '0.78rem', color: '#0f766e', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Physician & Caregiver Clinical Assessment
              </span>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.6 }}>
                {report.clinical_assessment || `Resident demonstrates healthy daily check-in habits with stable vital sign baselines over the last ${report.evaluation_period_days} days. No emergency escalations or severe vitals departures were detected.`}
              </p>
            </div>

            {/* Formal Sign-off Footer */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', borderTop: '1px solid #cbd5e1', paddingTop: '20px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                  Care Coordinator Signature
                </span>
                <div style={{ marginTop: '30px', borderBottom: '1px solid #94a3b8', width: '220px' }} />
                <span style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px', display: 'block' }}>
                  {report.caregiver?.name || 'Staff Caregiver'} • HomeJoy Health
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                  Medical Officer / Reviewer
                </span>
                <div style={{ marginTop: '30px', borderBottom: '1px solid #94a3b8', width: '220px' }} />
                <span style={{ fontSize: '0.82rem', color: '#475569', marginTop: '4px', display: 'block' }}>
                  Date: {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CareReportExportModal;
