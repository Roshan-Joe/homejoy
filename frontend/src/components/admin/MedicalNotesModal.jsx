import React, { useState, useEffect } from 'react';
import { X, FileText, Plus, Stethoscope, Pill, Calendar } from 'lucide-react';
import doctorService from '../../services/doctorService';

export const MedicalNotesModal = ({ isOpen, onClose, doctor = null }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newNote, setNewNote] = useState({
    elderly_id: '',
    note_date: new Date().toISOString().split('T')[0],
    diagnosis: 'Routine Checkup',
    clinical_notes: 'Patient exhibits stable vitals. Prescribed ongoing treatment.',
    prescriptions: 'Lisinopril 10mg once daily',
    follow_up_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  useEffect(() => {
    if (isOpen && doctor) {
      fetchNotes();
      if (doctor.assigned_patient_ids && doctor.assigned_patient_ids.length > 0) {
        setNewNote(prev => ({ ...prev, elderly_id: doctor.assigned_patient_ids[0] }));
      }
    }
  }, [isOpen, doctor]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const data = await doctorService.getMedicalNotes(doctor.id);
      setNotes(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !doctor) return null;

  const displayName = doctor.name || doctor.full_name || 'Doctor';

  const handleCreateNote = async (e) => {
    e.preventDefault();
    if (!newNote.elderly_id) {
      alert('Please select a patient for the medical note.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...newNote,
        prescriptions: newNote.prescriptions ? newNote.prescriptions.split(',').map(s => s.trim()).filter(Boolean) : []
      };
      await doctorService.createMedicalNote(doctor.id, payload);
      setShowAddForm(false);
      fetchNotes();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save medical note.');
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
              <FileText size={22} color="#6b21a8" />
              <span>Clinical Medical Notes: {displayName}</span>
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Diagnoses, treatment plans & prescription records
            </span>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Action Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Total Clinical Notes ({notes.length})</span>
          <button
            className="btn btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Plus size={16} />
            <span>{showAddForm ? 'Cancel New Note' : 'Add Clinical Note'}</span>
          </button>
        </div>

        {/* ADD NOTE FORM */}
        {showAddForm && (
          <form onSubmit={handleCreateNote} style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '18px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#6b21a8' }}>New Medical Consultation Note</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Patient Resident *</label>
                <select
                  className="form-select"
                  value={newNote.elderly_id}
                  onChange={(e) => setNewNote({ ...newNote, elderly_id: e.target.value })}
                  required
                >
                  <option value="">-- Select Patient --</option>
                  {doctor.assigned_patient_ids && doctor.assigned_patient_ids.map((pid, idx) => (
                    <option key={pid} value={pid}>
                      {doctor.assigned_patient_names[idx] || `Patient ID: ${pid}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Consultation Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={newNote.note_date}
                  onChange={(e) => setNewNote({ ...newNote, note_date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Diagnosis *</label>
              <input
                type="text"
                className="form-input"
                value={newNote.diagnosis}
                onChange={(e) => setNewNote({ ...newNote, diagnosis: e.target.value })}
                placeholder="e.g. Essential Hypertension & Mild Arthritis"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Clinical Observations & Plan *</label>
              <textarea
                className="form-input"
                rows={3}
                value={newNote.clinical_notes}
                onChange={(e) => setNewNote({ ...newNote, clinical_notes: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Prescriptions (Comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={newNote.prescriptions}
                  onChange={(e) => setNewNote({ ...newNote, prescriptions: e.target.value })}
                  placeholder="Lisinopril 10mg, Aspirin 81mg"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Follow-up Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={newNote.follow_up_date}
                  onChange={(e) => setNewNote({ ...newNote, follow_up_date: e.target.value })}
                />
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Clinical Note'}
              </button>
            </div>
          </form>
        )}

        {/* NOTES LIST */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            Loading medical notes...
          </div>
        ) : notes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
            No clinical medical notes created yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notes.map((n) => (
              <div key={n.id} style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '14px',
                backgroundColor: '#ffffff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#6b21a8' }}>
                    Patient: {n.elderly_name}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {n.note_date}
                  </span>
                </div>

                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  Diagnosis: {n.diagnosis}
                </div>

                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '6px' }}>
                  "{n.clinical_notes}"
                </div>

                {n.prescriptions && n.prescriptions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {n.prescriptions.map((rx, idx) => (
                      <span key={idx} style={{
                        padding: '2px 8px',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor: '#f3e8ff',
                        color: '#6b21a8',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Pill size={12} />
                        <span>{rx}</span>
                      </span>
                    ))}
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

export default MedicalNotesModal;
