import React, { useState, useEffect } from 'react';
import {
  X, UserPlus, UserCheck, Stethoscope, Sparkles, MapPin, Users,
  AlertTriangle, Check, ChevronDown, ChevronUp
} from 'lucide-react';
import api from '../../services/api';
import userService from '../../services/userService';
import { useToast } from '../../context/ToastContext';

export const AssignCaregiverDoctorModal = ({
  isOpen,
  onClose,
  elderly = null,
  onAssignCaregiver,
  onAssignDoctor
}) => {
  const { toast } = useToast();
  const [suggestionData, setSuggestionData] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedCaregiverId, setSelectedCaregiverId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');
  const [showAllCaregivers, setShowAllCaregivers] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && elderly) {
      const currentCg = elderly.assigned_caregiver_id || '';
      setSelectedCaregiverId(currentCg === 'Not Assigned' ? '' : currentCg);
      setSelectedDoctorId(elderly.assigned_doctor_id || '');
      setAssignmentNote('');
      setShowAllCaregivers(false);
      fetchSuggestions();
      fetchDoctors();
    }
  }, [isOpen, elderly]);

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting, onClose]);

  const fetchSuggestions = async () => {
    try {
      setLoadingSuggestions(true);
      const res = await api.get(`/api/admin/elderly/${elderly.id}/caregiver-suggestions?top=3`);
      setSuggestionData(res.data);

      // Pre-select the recommended caregiver if currently unassigned
      if ((!elderly.assigned_caregiver_id || elderly.assigned_caregiver_id === 'Not Assigned') && res.data.suggestions?.length > 0) {
        setSelectedCaregiverId(res.data.suggestions[0].id);
      }
    } catch (err) {
      console.error('Failed to load caregiver suggestions:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const docRes = await userService.getUsers({ role: 'Doctor', limit: 100 });
      setDoctors(docRes.users || []);
    } catch (err) {
      console.error('Failed to load doctors:', err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  if (!isOpen || !elderly) return null;

  const displayName = elderly.name || elderly.full_name || 'Elderly Resident';
  const currentCgName = elderly.assigned_caregiver_name && elderly.assigned_caregiver_name !== 'Not Assigned'
    ? elderly.assigned_caregiver_name
    : null;
  const isReassigning = Boolean(currentCgName && selectedCaregiverId && selectedCaregiverId !== elderly.assigned_caregiver_id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      // 1. Update Caregiver Assignment if changed
      const originalCg = (elderly.assigned_caregiver_id === 'Not Assigned') ? '' : (elderly.assigned_caregiver_id || '');
      if (selectedCaregiverId !== originalCg) {
        if (selectedCaregiverId) {
          await api.put(`/api/admin/elderly/${elderly.id}/assign-caregiver`, {
            caregiver_id: selectedCaregiverId,
            note: assignmentNote.trim()
          });
          toast.success(`Caregiver successfully assigned to ${displayName}.`);
        } else {
          await api.post(`/api/admin/elderly/${elderly.id}/unassign-caregiver`, {
            note: assignmentNote.trim()
          });
          toast.info(`${displayName} is now unassigned.`);
        }
        if (onAssignCaregiver) onAssignCaregiver(elderly.id, selectedCaregiverId);
      }

      // 2. Update Doctor Assignment if changed
      if (selectedDoctorId !== (elderly.assigned_doctor_id || '')) {
        if (onAssignDoctor) {
          await onAssignDoctor(elderly.id, selectedDoctorId);
          toast.success(`Doctor assignment updated for ${displayName}.`);
        }
      }

      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to update caregiver assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '26px',
          backgroundColor: 'var(--surface, #ffffff)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle, #e2e8f0)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'var(--primary-light, #e0f2fe)',
              color: 'var(--primary, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UserPlus size={20} />
            </div>
            <div>
              <h3 id="assign-modal-title" style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Allocate Caregiver & Doctor
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Smart district & capacity matching
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Resident Summary Banner */}
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'var(--surface-overlay, #f8fafc)',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            borderRadius: '10px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {displayName}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <MapPin size={13} style={{ color: 'var(--primary)' }} /> District: <strong>{elderly.district || 'Other'}</strong>
              </span>
              <span>•</span>
              <span>Risk: <strong>{elderly.risk_level || 'Low'}</strong></span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
              Current Primary Caregiver
            </span>
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: currentCgName ? 'var(--text-main)' : '#dc2626' }}>
              {currentCgName || 'Unassigned'}
            </span>
          </div>
        </div>

        {/* Reassignment Warning */}
        {isReassigning && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#fffbeb',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '8px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              fontSize: '0.84rem',
              color: '#92400e'
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '1px', color: '#d97706' }} />
            <div>
              <strong>Reassignment Notice:</strong> This resident will be transferred from <strong>{currentCgName}</strong> to the newly selected caregiver. Both staff members will receive instant dashboard notifications.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Caregiver Section */}
          <div className="form-group" style={{ margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>
                <Sparkles size={16} style={{ color: 'var(--primary)' }} />
                <span>Recommended Caregivers (Rule-Based Order)</span>
              </label>

              <button
                type="button"
                onClick={() => setShowAllCaregivers(!showAllCaregivers)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>{showAllCaregivers ? 'Show Top Suggestions' : 'Show All Caregivers'}</span>
                {showAllCaregivers ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            {loadingSuggestions ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Analyzing caregiver workloads and district matches...
              </div>
            ) : showAllCaregivers ? (
              /* All Caregivers Dropdown / List */
              <div>
                <select
                  className="form-select"
                  value={selectedCaregiverId}
                  onChange={(e) => setSelectedCaregiverId(e.target.value)}
                  style={{ padding: '10px 12px', fontSize: '0.9rem' }}
                >
                  <option value="">-- Unassigned (No Caregiver) --</option>
                  {(suggestionData?.suggestions || []).concat(suggestionData?.others || []).map((cg) => {
                    const atCap = cg.at_capacity;
                    return (
                      <option key={cg.id} value={cg.id} disabled={atCap}>
                        {cg.name} • {cg.district} • ({cg.assigned_count}/{cg.max_patients} clients){atCap ? ' [AT FULL CAPACITY]' : ''}
                      </option>
                    );
                  })}
                </select>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Caregivers at full capacity are disabled according to strict workload safety rules.
                </span>
              </div>
            ) : (
              /* Top 3 Suggestion Cards */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(!suggestionData?.suggestions || suggestionData.suggestions.length === 0) ? (
                  <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '10px', textAlign: 'center', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                    No available active caregivers found with open client slots.
                  </div>
                ) : (
                  suggestionData.suggestions.map((cg) => {
                    const isSelected = selectedCaregiverId === cg.id;
                    return (
                      <div
                        key={cg.id}
                        onClick={() => setSelectedCaregiverId(cg.id)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid var(--primary, #0284c7)' : '1px solid var(--border-subtle, #e2e8f0)',
                          backgroundColor: isSelected ? 'rgba(2, 132, 199, 0.04)' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          transition: 'border-color 0.2s, background-color 0.2s'
                        }}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            setSelectedCaregiverId(cg.id);
                          }
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: isSelected ? '6px solid var(--primary)' : '2px solid var(--border-subtle)',
                            backgroundColor: '#ffffff',
                            flexShrink: 0
                          }} />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>{cg.name}</strong>
                              {cg.recommended && (
                                <span style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#ecfdf5', color: '#047857', fontWeight: 800 }}>
                                  RECOMMENDED #1
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {cg.rationale}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {cg.assigned_count}/{cg.max_patients}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>
                            {cg.available_slots} slots free
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}

                <button
                  type="button"
                  onClick={() => setSelectedCaregiverId('')}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'none',
                    border: 'none',
                    color: selectedCaregiverId === '' ? '#dc2626' : 'var(--text-muted)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <X size={14} /> Leave client unassigned
                </button>
              </div>
            )}
          </div>

          {/* Optional Assignment Note */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Allocation Note (Optional audit trail log)
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Assigned based on district proximity and day-shift coverage"
              value={assignmentNote}
              onChange={(e) => setAssignmentNote(e.target.value)}
              style={{ fontSize: '0.88rem', padding: '8px 12px' }}
            />
          </div>

          {/* Doctor Assignment Section */}
          <div className="form-group" style={{ margin: 0, borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.88rem' }}>
              <Stethoscope size={16} style={{ color: '#7c3aed' }} />
              <span>Assigned Consulting Physician</span>
            </label>
            {loadingDoctors ? (
              <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Loading doctors...</div>
            ) : (
              <select
                className="form-select"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                style={{ padding: '9px 12px', fontSize: '0.88rem' }}
              >
                <option value="">-- No Assigned Physician --</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.name || doc.full_name} ({doc.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Updating Allocation...' : 'Confirm Allocation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignCaregiverDoctorModal;
