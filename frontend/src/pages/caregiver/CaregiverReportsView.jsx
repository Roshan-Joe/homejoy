import React, { useState } from 'react';
import { FileText, Calendar, Download, Users, CheckCircle2, Activity } from 'lucide-react';
import caregiverPortalService from '../../services/caregiverPortalService';

export const CaregiverReportsView = ({ assignedElderly = [] }) => {
  const [selectedElderlyId, setSelectedElderlyId] = useState(assignedElderly[0]?.id || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    if (!selectedElderlyId) return;

    try {
      setLoading(true);
      setError('');
      const res = await caregiverPortalService.getCareReport({
        elderlyId: selectedElderlyId,
        startDate,
        endDate
      });
      setReport(res);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to generate care report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Controls */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 4px 0' }}>Care Summary Reports</h1>
        <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 20px 0' }}>
          Select an assigned elderly client and custom date range to review wellness telemetry, medication adherence rates, and alert logs.
        </p>

        <form onSubmit={handleGenerateReport} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'flex-end' }}>
          <div style={{ minWidth: '220px', flex: 1 }}>
            <label className="form-label">Assigned Elderly Patient</label>
            <select
              className="form-input"
              value={selectedElderlyId}
              onChange={(e) => setSelectedElderlyId(e.target.value)}
              required
            >
              {assignedElderly.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: '150px' }}>
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '150px' }}>
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || !selectedElderlyId}>
            {loading ? 'Generating...' : 'Generate Care Report'}
          </button>
        </form>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* Report Summary Display */}
      {report && (
        <div className="glass-card animate-fade-in" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                Care Summary Report: {report.elderly_name}
              </h2>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                Period: <strong>{report.start_date}</strong> to <strong>{report.end_date}</strong>
              </div>
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => window.print()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={16} />
              <span>Print / View PDF</span>
            </button>
          </div>

          {/* Metric Badges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Total Check-ins</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1e293b' }}>{report.total_checkins}</div>
            </div>

            <div style={{ padding: '16px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Medication Adherence</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#047857' }}>{report.medication_adherence_rate}%</div>
            </div>

            <div style={{ padding: '16px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Total Alerts Triggered</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#b91c1c' }}>{report.total_alerts}</div>
            </div>

            <div style={{ padding: '16px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Resolved Alerts</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#2563eb' }}>{report.resolved_alerts}</div>
            </div>
          </div>

          {/* Risk Distribution */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 12px 0', color: '#334155' }}>
              Wellness Risk Distribution
            </h3>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ padding: '10px 16px', borderRadius: '8px', background: '#d1fae5', color: '#047857', fontWeight: 600, fontSize: '0.9rem' }}>
                Low Risk: {report.risk_distribution.Low || 0} days
              </div>
              <div style={{ padding: '10px 16px', borderRadius: '8px', background: '#fef3c7', color: '#b45309', fontWeight: 600, fontSize: '0.9rem' }}>
                Moderate Risk: {report.risk_distribution.Moderate || 0} days
              </div>
              <div style={{ padding: '10px 16px', borderRadius: '8px', background: '#fee2e2', color: '#b91c1c', fontWeight: 600, fontSize: '0.9rem' }}>
                High Risk: {report.risk_distribution.High || 0} days
              </div>
            </div>
          </div>

          {/* Summary Notes */}
          <div style={{ padding: '16px', borderRadius: '10px', background: '#f1f5f9', border: '1px solid #cbd5e1' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>Summary & Observations</h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: '1.5' }}>
              {report.summary_notes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
