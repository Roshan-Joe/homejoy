import React, { useState, useEffect } from 'react';
import { Activity, Save } from 'lucide-react';
import elderlyClientService from '../../services/elderlyClientService';
import { PageHeader } from './ElderlyProfilePage';

const CONDITIONS = ['Diabetes', 'Blood Pressure', 'Heart Problem', 'Arthritis', 'Asthma', 'Thyroid', 'Kidney Problem', 'Other', 'None'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];

export const HealthInfoPage = ({ onBack }) => {
  const [form, setForm] = useState({
    conditions: [],
    other_condition: '',
    blood_group: '',
    allergies: '',          // stored as comma-separated in UI, sent as array
    previous_conditions: '',
    medical_notes: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    elderlyClientService.getHealthInfo()
      .then(data => {
        setForm({
          conditions: data.conditions || [],
          other_condition: data.other_condition || '',
          blood_group: data.blood_group || '',
          allergies: (data.allergies || []).join(', '),
          previous_conditions: data.previous_conditions || '',
          medical_notes: data.medical_notes || '',
        });
      })
      .catch(() => setError('Could not load health information. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const toggleCondition = (cond) => {
    setError(''); setSuccess('');
    setForm(f => {
      let next = [...(f.conditions || [])];
      if (cond === 'None') {
        next = next.includes('None') ? [] : ['None'];
      } else {
        next = next.filter(c => c !== 'None');
        if (next.includes(cond)) next = next.filter(c => c !== cond);
        else next = [...next, cond];
      }
      return { ...f, conditions: next };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const allergies = form.allergies.split(',').map(a => a.trim()).filter(Boolean);
      await elderlyClientService.updateHealthInfo({ ...form, allergies });
      setSuccess('Health information saved successfully!');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading health information...</div>;

  const hasOther = form.conditions.includes('Other');

  return (
    <div className="animate-fade-in">
      <PageHeader icon={<Activity size={22} />} title="Health Information" subtitle="Your self-reported health information — not a medical record or diagnosis" onBack={onBack} />
      <div className="glass-card" style={{ padding: '28px' }}>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">✓ {success}</div>}

        <form onSubmit={handleSave}>
          {/* Conditions */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '1.05rem', fontWeight: 700 }}>Do you have any of these health conditions?</label>
            <p style={{ fontSize: '0.92rem', color: '#64748b', marginBottom: '14px' }}>Tap each one that applies to you. Tap again to deselect.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              {CONDITIONS.map(cond => {
                const selected = (form.conditions || []).includes(cond);
                return (
                  <button key={cond} type="button" onClick={() => toggleCondition(cond)}
                    style={{
                      padding: '12px 22px', borderRadius: '14px',
                      border: `2.5px solid ${selected ? '#0d9488' : '#e2e8f0'}`,
                      background: selected ? '#ccfbf1' : '#fff',
                      color: selected ? '#0d9488' : '#475569',
                      fontWeight: selected ? 800 : 600, fontSize: '1rem', cursor: 'pointer',
                      transition: 'all 0.2s', minHeight: '52px',
                    }}>
                    {selected ? '✓ ' : ''}{cond}
                  </button>
                );
              })}
            </div>
          </div>

          {hasOther && (
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>Please tell us about your other condition</label>
              <input className="form-input" value={form.other_condition} onChange={e => setForm(f => ({ ...f, other_condition: e.target.value }))} placeholder="Describe your condition" maxLength={200} style={{ fontSize: '1rem', minHeight: '52px' }} />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>Blood Group</label>
              <select className="form-select" value={form.blood_group} onChange={e => setForm(f => ({ ...f, blood_group: e.target.value }))} style={{ fontSize: '1rem', minHeight: '52px' }}>
                <option value="">Select blood group</option>
                {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>Any Allergies?</label>
              <input className="form-input" value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))} placeholder="e.g. Penicillin, Peanuts" style={{ fontSize: '1rem', minHeight: '52px' }} />
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Separate multiple allergies with a comma</span>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>Past Health Problems</label>
              <textarea className="form-input" value={form.previous_conditions} onChange={e => setForm(f => ({ ...f, previous_conditions: e.target.value }))} rows={3} placeholder="Any past illnesses, surgeries, or resolved conditions" style={{ resize: 'vertical', fontSize: '1rem' }} maxLength={500} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>Other Notes for Your Caregiver</label>
              <textarea className="form-input" value={form.medical_notes} onChange={e => setForm(f => ({ ...f, medical_notes: e.target.value }))} rows={4} placeholder="Any other health information you'd like to share" style={{ resize: 'vertical', fontSize: '1rem' }} maxLength={1000} />
            </div>
          </div>

          <div style={{ marginTop: '28px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%', minHeight: '60px', fontSize: '1.1rem', fontWeight: 800, borderRadius: '14px' }}>
              {saving ? 'Saving…' : '💾  Save Health Information'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
