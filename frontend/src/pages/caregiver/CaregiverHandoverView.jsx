import React, { useState, useEffect, useCallback } from 'react';
import {
  ClipboardList, Plus, AlertCircle, Clock, CheckCircle2,
  Calendar, ShieldAlert, ArrowRight, Filter, Search, User
} from 'lucide-react';
import caregiverPortalService from '../../services/caregiverPortalService';

export const CaregiverHandoverView = ({ assignedElderly = [] }) => {
  const [handoverNotes, setHandoverNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterShift, setFilterShift] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [shift, setShift] = useState('Morning');
  const [selectedElderlyId, setSelectedElderlyId] = useState('');
  const [notes, setNotes] = useState('');
  const [criticalObservations, setCriticalObservations] = useState('');
  const [pendingFollowupsText, setPendingFollowupsText] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const fetchHandoverNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await caregiverPortalService.getHandoverNotes({
        limit: 30,
        shift: filterShift !== 'all' ? filterShift : ''
      });
      setHandoverNotes(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch handover logs. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [filterShift]);

  useEffect(() => {
    fetchHandoverNotes();
  }, [fetchHandoverNotes]);

  const handleCreateHandover = async (e) => {
    e.preventDefault();
    if (!notes.trim()) return;

    try {
      setSubmitting(true);
      const pendingFollowups = pendingFollowupsText
        .split('\n')
        .map(item => item.trim())
        .filter(Boolean);

      const residentHighlights = [];
      if (selectedElderlyId) {
        const found = assignedElderly.find(e => e.id === selectedElderlyId);
        if (found) {
          residentHighlights.push({
            elderly_id: found.id,
            elderly_name: found.name,
            notes: criticalObservations || notes.substring(0, 80)
          });
        }
      }

      await caregiverPortalService.createHandoverNote({
        shift,
        notes: notes.trim(),
        critical_observations: criticalObservations.trim(),
        pending_followups: pendingFollowups,
        resident_highlights: residentHighlights,
        is_urgent: isUrgent
      });

      setSuccessToast(`Handover note for ${shift} shift published successfully!`);
      setShowCreateModal(false);
      setNotes('');
      setCriticalObservations('');
      setPendingFollowupsText('');
      setIsUrgent(false);
      setSelectedElderlyId('');
      fetchHandoverNotes();

      setTimeout(() => setSuccessToast(''), 5000);
    } catch (err) {
      console.error(err);
      alert('Failed to log handover note. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredNotes = handoverNotes.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const notesMatch = item.notes?.toLowerCase().includes(q);
    const caregiverMatch = item.caregiver_name?.toLowerCase().includes(q);
    const obsMatch = item.critical_observations?.toLowerCase().includes(q);
    return notesMatch || caregiverMatch || obsMatch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast Alert */}
      {successToast && (
        <div
          className="animate-fade-in"
          style={{
            padding: '16px 20px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#ffffff',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 8px 24px rgba(4, 120, 87, 0.25)'
          }}
        >
          <CheckCircle2 size={24} />
          <span style={{ flex: 1 }}>{successToast}</span>
          <button
            onClick={() => setSuccessToast('')}
            style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div
        className="glass-card"
        style={{
          padding: '28px',
          borderRadius: '20px',
          background: 'linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%)',
          border: '1.5px solid #bbf7d0'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: '#059669', color: '#ffffff' }}>
                <ClipboardList size={22} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#065f46', margin: 0 }}>
                Caregiver Shift Handover & Continuity Notes
              </h2>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#475569', margin: '6px 0 0 0', maxWidth: '640px' }}>
              Ensure zero gaps in care delivery. Log critical observations, medication follow-ups, and urgent updates for the incoming shift team.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              fontWeight: 800,
              padding: '12px 20px',
              borderRadius: '12px',
              boxShadow: '0 4px 14px rgba(5, 150, 105, 0.28)'
            }}
          >
            <Plus size={18} />
            <span>Log Shift Handover</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '24px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '220px' }}>
            <Search size={16} style={{ color: '#94a3b8' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search shift handover notes, caregiver, or resident..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: '#ffffff', borderColor: '#d1d5db' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} style={{ color: '#94a3b8' }} />
            <select
              className="form-input"
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              style={{ background: '#ffffff', borderColor: '#d1d5db', minWidth: '150px' }}
            >
              <option value="all">All Shifts</option>
              <option value="Morning">Morning Shift</option>
              <option value="Afternoon">Afternoon Shift</option>
              <option value="Night">Night Shift</option>
              <option value="General">General Handover</option>
            </select>
          </div>
        </div>
      </div>

      {/* Handover Feed */}
      {loading ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <Clock className="animate-spin" size={28} style={{ margin: '0 auto 10px', color: '#059669' }} />
          <div>Loading handover logs...</div>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
          <ClipboardList size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px 0', color: '#1e293b' }}>No Handover Notes Yet</h3>
          <p style={{ fontSize: '0.88rem', margin: 0 }}>
            {filterShift !== 'all' ? `No notes recorded for the ${filterShift} shift.` : 'Click "Log Shift Handover" above to record notes for the incoming team.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredNotes.map((note) => {
            const shiftColors = {
              Morning: { bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
              Afternoon: { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
              Night: { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe' },
              General: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' }
            };
            const theme = shiftColors[note.shift] || shiftColors.General;

            return (
              <div
                key={note.id}
                className="glass-card animate-fade-in"
                style={{
                  padding: '22px 26px',
                  borderRadius: '16px',
                  border: note.is_urgent ? '2px solid #f87171' : '1px solid #e2e8f0',
                  background: note.is_urgent ? '#fff5f5' : '#ffffff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        background: theme.bg,
                        color: theme.text,
                        border: `1px solid ${theme.border}`
                      }}
                    >
                      {note.shift} Shift
                    </span>

                    {note.is_urgent && (
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          background: '#fee2e2',
                          color: '#b91c1c',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <ShieldAlert size={14} /> Urgent Attention Required
                      </span>
                    )}

                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      Logged by <strong>{note.caregiver_name}</strong>
                    </span>
                  </div>

                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} />
                    {new Date(note.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {/* Handover Main Text */}
                <p style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                  {note.notes}
                </p>

                {/* Critical Observations */}
                {note.critical_observations && (
                  <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#fef2f2', border: '1px solid #fecaca', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                      Clinical Observation
                    </span>
                    <span style={{ fontSize: '0.88rem', color: '#7f1d1d' }}>{note.critical_observations}</span>
                  </div>
                )}

                {/* Pending Followups */}
                {note.pending_followups && note.pending_followups.length > 0 && (
                  <div style={{ marginTop: '12px', padding: '12px 16px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      Incoming Shift Action Items & Reminders
                    </span>
                    <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.88rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {note.pending_followups.map((task, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ArrowRight size={14} style={{ color: '#059669', flexShrink: 0 }} />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Handover Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            className="glass-card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '620px',
              background: '#ffffff',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ClipboardList size={24} style={{ color: '#059669' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                  Log Shift Handover Notes
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateHandover} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Shift Interval</label>
                  <select
                    className="form-input"
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    required
                  >
                    <option value="Morning">Morning Shift (7:00 AM – 3:00 PM)</option>
                    <option value="Afternoon">Afternoon Shift (3:00 PM – 11:00 PM)</option>
                    <option value="Night">Night Shift (11:00 PM – 7:00 AM)</option>
                    <option value="General">General / Specialty Handover</option>
                  </select>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700 }}>Primary Resident (Optional)</label>
                  <select
                    className="form-input"
                    value={selectedElderlyId}
                    onChange={(e) => setSelectedElderlyId(e.target.value)}
                  >
                    <option value="">All / General Overview</option>
                    {assignedElderly.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Shift Summary & Status *</label>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder="Summarize the shift events, resident morale, dietary notes, and overall state..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>Critical Observations & Clinical Nuances</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Mild dizziness observed after 2 PM medication; BP checked at 130/85."
                  value={criticalObservations}
                  onChange={(e) => setCriticalObservations(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 700 }}>
                  Incoming Shift Action Items (One per line)
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder={`Confirm evening dose of Metformin at 8:00 PM\nAssist with walking exercise in garden if clear\nEnsure hydration bottle refilled before bedtime`}
                  value={pendingFollowupsText}
                  onChange={(e) => setPendingFollowupsText(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca' }}>
                <input
                  type="checkbox"
                  id="urgentHandover"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="urgentHandover" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#991b1b', cursor: 'pointer', margin: 0 }}>
                  Mark as Urgent Alert for Incoming Shift
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', fontWeight: 800 }}
                >
                  {submitting ? 'Publishing...' : 'Publish Handover'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaregiverHandoverView;
