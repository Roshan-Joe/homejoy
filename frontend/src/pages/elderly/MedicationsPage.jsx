import React, { useState, useEffect } from 'react';
import { Pill, Plus, Pencil, Trash2, X, Bell } from 'lucide-react';
import elderlyClientService from '../../services/elderlyClientService';
import { PageHeader } from './ElderlyProfilePage';
import { MedicationAlarmModal } from '../../components/elderly/MedicationAlarmModal';

const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Four times daily', 'Every 8 hours', 'Every 12 hours', 'Weekly', 'As needed'];

const getDoseCount = (frequency) => {
  switch (frequency) {
    case 'Twice daily':
    case 'Every 12 hours':
      return 2;
    case 'Three times daily':
    case 'Every 8 hours':
      return 3;
    case 'Four times daily':
      return 4;
    default:
      return 1;
  }
};

const parseTimesToArray = (timeStr, count) => {
  if (!timeStr) return Array(count).fill('');
  const parts = timeStr.split(/[,;]/).map(s => s.trim());
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(parts[i] || '');
  }
  return result;
};

const emptyForm = {
  medicine_name: '',
  dosage: '',
  frequency: 'Once daily',
  intake_times: [''],
  before_food: true,
  prescribed_by: '',
  start_date: new Date().toISOString().split('T')[0],
  end_date: ''
};

export const MedicationsPage = ({ onBack }) => {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeAlarmMed, setActiveAlarmMed] = useState(null);

  const loadMeds = () => elderlyClientService.getMedications().then(setMeds).catch(() => setError('Could not load medications.')).finally(() => setLoading(false));
  useEffect(() => { loadMeds(); }, []);

  const openAdd = () => { setForm({ ...emptyForm, intake_times: [''] }); setEditId(null); setShowForm(true); setError(''); setSuccess(''); };
  const openEdit = (med) => {
    const count = getDoseCount(med.frequency || 'Once daily');
    const timesArray = parseTimesToArray(med.intake_time || '', count);
    setForm({
      medicine_name: med.medicine_name,
      dosage: med.dosage,
      frequency: med.frequency || 'Once daily',
      intake_times: timesArray,
      before_food: med.before_food,
      prescribed_by: med.prescribed_by || '',
      start_date: med.start_date,
      end_date: med.end_date || ''
    });
    setEditId(med.id);
    setShowForm(true);
    setError('');
    setSuccess('');
  };
  const closeForm = () => { setShowForm(false); setEditId(null); };

  const handleFrequencyChange = (newFreq) => {
    const newCount = getDoseCount(newFreq);
    setForm(prev => {
      const currentTimes = prev.intake_times || [];
      const newTimes = [];
      for (let i = 0; i < newCount; i++) {
        newTimes.push(currentTimes[i] || '');
      }
      return { ...prev, frequency: newFreq, intake_times: newTimes };
    });
  };

  const handleTimeChange = (index, val) => {
    setForm(prev => {
      const updated = [...(prev.intake_times || [])];
      updated[index] = val;
      return { ...prev, intake_times: updated };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const joinedTimes = (form.intake_times || [])
        .map(t => t.trim())
        .filter(Boolean)
        .join(', ');

      const payload = {
        medicine_name: form.medicine_name,
        dosage: form.dosage,
        frequency: form.frequency,
        intake_time: joinedTimes,
        before_food: form.before_food,
        prescribed_by: form.prescribed_by,
        start_date: form.start_date,
        end_date: form.end_date || null
      };

      if (editId) await elderlyClientService.updateMedication(editId, payload);
      else await elderlyClientService.addMedication(payload);
      setSuccess(editId ? 'Medication updated!' : 'Medication added! Alarm configured automatically for dosage times.');
      closeForm();
      loadMeds();
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(typeof d === 'string' ? d : 'Could not save medication. Please check the details and try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this medication from your list?')) return;
    setDeletingId(id);
    try {
      await elderlyClientService.deleteMedication(id);
      setMeds(m => m.filter(med => med.id !== id));
    } catch {
      setError('Could not remove medication.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading medications...</div>;

  const doseCount = getDoseCount(form.frequency);

  return (
    <div className="animate-fade-in">
      <PageHeader icon={<Pill size={22} />} title="My Medications" subtitle="Keep track of your regular medicines" onBack={onBack} />

      {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '16px', fontSize: '1rem', fontWeight: 600 }}>✓ {success}</div>}

      {/* Alarm Modal active when triggered */}
      {activeAlarmMed && (
        <MedicationAlarmModal
          medication={activeAlarmMed}
          onClose={() => setActiveAlarmMed(null)}
          onDoseLogged={() => loadMeds()}
        />
      )}

      {!showForm && (
        <div style={{ marginBottom: '20px' }}>
          <button className="btn btn-primary" onClick={openAdd} style={{ minHeight: '52px', fontSize: '1.05rem', fontWeight: 800 }}>
            <Plus size={20} /> Add Medication
          </button>
        </div>
      )}

      {showForm && (
        <div className="glass-card" style={{ padding: '28px', marginBottom: '24px', border: '2px solid var(--primary-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{editId ? 'Edit Medication' : 'Add New Medication'}</h3>
            <button onClick={closeForm} className="btn btn-secondary" style={{ padding: '6px' }}><X size={18} /></button>
          </div>
          <form onSubmit={handleSave}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>Medicine Name *</label>
                <input className="form-input" required value={form.medicine_name} onChange={e => setForm(f => ({ ...f, medicine_name: e.target.value }))} placeholder="e.g. Metformin" style={{ fontSize: '1rem', minHeight: '52px' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>Dosage *</label>
                <input className="form-input" required value={form.dosage} onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))} placeholder="e.g. 500mg, 1 tablet" style={{ fontSize: '1rem', minHeight: '52px' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>How often?</label>
                <select className="form-select" value={form.frequency} onChange={e => handleFrequencyChange(e.target.value)} style={{ fontSize: '1rem', minHeight: '52px' }}>
                  {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              {doseCount === 1 ? (
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>What time?</label>
                  <input
                    className="form-input"
                    value={(form.intake_times && form.intake_times[0]) || ''}
                    onChange={e => handleTimeChange(0, e.target.value)}
                    placeholder="e.g. 8:00 AM, After breakfast"
                    style={{ fontSize: '1rem', minHeight: '52px' }}
                  />
                </div>
              ) : (
                Array.from({ length: doseCount }).map((_, idx) => {
                  const ordinals = ['1st', '2nd', '3rd', '4th'];
                  const labelText = `${ordinals[idx] || (idx + 1) + 'th'} Dose Time`;
                  const placeholders = ['e.g. 8:00 AM', 'e.g. 8:00 PM', 'e.g. 2:00 PM', 'e.g. 10:00 PM'];
                  return (
                    <div key={idx} className="form-group">
                      <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>{labelText}</label>
                      <input
                        className="form-input"
                        value={(form.intake_times && form.intake_times[idx]) || ''}
                        onChange={e => handleTimeChange(idx, e.target.value)}
                        placeholder={placeholders[idx] || 'e.g. 8:00 AM'}
                        style={{ fontSize: '1rem', minHeight: '52px' }}
                      />
                    </div>
                  );
                })
              )}

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>Take with food?</label>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  {[{ val: true, label: '🍽️ Before Food' }, { val: false, label: '🍽️ After Food' }].map(({ val, label }) => (
                    <button key={label} type="button" onClick={() => setForm(f => ({ ...f, before_food: val }))}
                      style={{ flex: 1, padding: '14px 10px', borderRadius: '12px', minHeight: '52px', border: `2.5px solid ${form.before_food === val ? '#0d9488' : '#e2e8f0'}`, background: form.before_food === val ? '#ccfbf1' : '#fff', color: form.before_food === val ? '#0d9488' : '#475569', fontWeight: form.before_food === val ? 800 : 600, cursor: 'pointer', fontSize: '0.95rem', transition: 'all 0.2s' }}>
                      {form.before_food === val ? '✓ ' : ''}{label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>Prescribed By</label>
                <input className="form-input" value={form.prescribed_by} onChange={e => setForm(f => ({ ...f, prescribed_by: e.target.value }))} placeholder="Doctor's name (optional)" style={{ fontSize: '1rem', minHeight: '52px' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>Start Date *</label>
                <input className="form-input" type="date" required value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} style={{ fontSize: '1rem', minHeight: '52px' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>End Date <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 400 }}>(optional)</span></label>
                <input className="form-input" type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} min={form.start_date} style={{ fontSize: '1rem', minHeight: '52px' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn btn-secondary" onClick={closeForm} style={{ minHeight: '52px', padding: '0 22px', fontSize: '1rem' }}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1, minHeight: '52px', fontSize: '1rem', fontWeight: 800 }}>
                {saving ? 'Saving…' : `💾 ${editId ? 'Update Medicine' : 'Add Medicine'}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {meds.length === 0 && !showForm ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💊</div>
          <h3 style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>No medications added yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>Add your regular medicines to keep track of your health routine.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {meds.map(med => (
            <div key={med.id} className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Pill size={20} color="#f59e0b" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '2px' }}>{med.medicine_name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{med.dosage} · {med.frequency}</div>
                  {med.intake_time && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>⏰ {med.intake_time} · {med.before_food ? 'Before food' : 'After food'}</div>}
                  {med.prescribed_by && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>By: {med.prescribed_by}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => setActiveAlarmMed(med)}
                  style={{
                    background: '#d97706', borderColor: '#b45309', minHeight: '44px',
                    padding: '8px 16px', fontSize: '0.9rem', fontWeight: 800,
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  <Bell size={16} /> <span>Take Dose / Test Alarm</span>
                </button>
                <button className="btn btn-secondary" onClick={() => openEdit(med)} style={{ padding: '8px 14px', minHeight: '44px' }}>
                  <Pencil size={16} /> Edit
                </button>
                <button className="btn btn-danger" onClick={() => handleDelete(med.id)} disabled={deletingId === med.id} style={{ padding: '8px 14px', minHeight: '44px' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
