import React, { useState, useEffect } from 'react';
import { X, FileText, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import caregiverService from '../../services/caregiverService';

export const DailyReportsModal = ({ isOpen, onClose, caregiver = null }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newReport, setNewReport] = useState({
    elderly_id: '',
    report_date: new Date().toISOString().split('T')[0],
    blood_pressure: '120/80',
    heart_rate: 72,
    temperature: 98.6,
    meal_notes: 'Meals consumed normally.',
    medication_administered: true,
    general_observations: 'Patient is stable and responsive.'
  });

  useEffect(() => {
    if (isOpen && caregiver) {
      fetchReports();
      if (caregiver.assigned_elderly_ids && caregiver.assigned_elderly_ids.length > 0) {
        setNewReport(prev => ({ ...prev, elderly_id: caregiver.assigned_elderly_ids[0] }));
      }
    }
  }, [isOpen, caregiver]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await caregiverService.getDailyReports(caregiver.id);
      setReports(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !caregiver) return null;

  const displayName = caregiver.name || caregiver.full_name || 'Caregiver';

  const handleCreateReport = async (e) => {
    e.preventDefault();
    if (!newReport.elderly_id) {
      alert('Please select an elderly patient for the report.');
      return;
    }

    try {
      setSubmitting(true);
      await caregiverService.addDailyReport(caregiver.id, newReport);
      setShowAddForm(false);
      fetchReports();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit daily report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '640px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        backgroundColor: '#ffffff'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={22} color="var(--primary)" />
              <span>Daily Care Reports: {displayName}</span>
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Historical daily logs & vital sign recordings
            </span>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Action Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Total Reports ({reports.length})</span>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Plus size={16} />
            <span>{showAddForm ? 'Cancel New Report' : 'Submit Daily Report'}</span>
          </button>
        </div>

        {/* ADD REPORT FORM */}
        {showAddForm && (
          <form onSubmit={handleCreateReport} style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '18px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>New Daily Care Entry</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Elderly Resident *</label>
                <select
                  className="form-select"
                  value={newReport.elderly_id}
                  onChange={(e) => setNewReport({ ...newReport, elderly_id: e.target.value })}
                  required
                >
                  <option value="">-- Select Patient --</option>
                  {caregiver.assigned_elderly_ids && caregiver.assigned_elderly_ids.map((eid, idx) => (
                    <option key={eid} value={eid}>
                      {caregiver.assigned_elderly_names[idx] || `Patient ID: ${eid}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Report Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={newReport.report_date}
                  onChange={(e) => setNewReport({ ...newReport, report_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Blood Pressure</label>
                <input
                  type="text"
                  className="form-input"
                  value={newReport.blood_pressure}
                  onChange={(e) => setNewReport({ ...newReport, blood_pressure: e.target.value })}
                  placeholder="120/80"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Heart Rate (bpm)</label>
                <input
                  type="number"
                  className="form-input"
                  value={newReport.heart_rate}
                  onChange={(e) => setNewReport({ ...newReport, heart_rate: parseInt(e.target.value, 10) || 72 })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Temp (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={newReport.temperature}
                  onChange={(e) => setNewReport({ ...newReport, temperature: parseFloat(e.target.value) || 98.6 })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Meal & Diet Notes</label>
              <input
                type="text"
                className="form-input"
                value={newReport.meal_notes}
                onChange={(e) => setNewReport({ ...newReport, meal_notes: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="med_admin"
                checked={newReport.medication_administered}
                onChange={(e) => setNewReport({ ...newReport, medication_administered: e.target.checked })}
              />
              <label htmlFor="med_admin" style={{ fontSize: '0.88rem', cursor: 'pointer' }}>
                All scheduled medications administered as prescribed
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">General Observations & Notes</label>
              <textarea
                className="form-input"
                rows={2}
                value={newReport.general_observations}
                onChange={(e) => setNewReport({ ...newReport, general_observations: e.target.value })}
              />
            </div>

            <div style={{ textAlign: 'right' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Save Report Log'}
              </button>
            </div>
          </form>
        )}

        {/* REPORTS LIST */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            Loading report logs...
          </div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
            No daily care reports submitted yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reports.map((r) => (
              <div key={r.id} style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px',
                backgroundColor: '#ffffff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)' }}>
                    {r.elderly_name}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {r.report_date}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '6px' }}>
                  <span>BP: <strong>{r.blood_pressure}</strong></span>
                  <span>Heart Rate: <strong>{r.heart_rate} bpm</strong></span>
                  <span>Temp: <strong>{r.temperature}°F</strong></span>
                  <span>Medications: <strong style={{ color: r.medication_administered ? '#047857' : '#b91c1c' }}>{r.medication_administered ? 'Given' : 'Missed'}</strong></span>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <strong>Meals:</strong> {r.meal_notes}
                </div>

                {r.general_observations && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic' }}>
                    "{r.general_observations}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'right', marginTop: '24px' }}>
          <button className="btn btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default DailyReportsModal;
