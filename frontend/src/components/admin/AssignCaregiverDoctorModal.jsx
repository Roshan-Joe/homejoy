import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserCheck, Stethoscope } from 'lucide-react';
import userService from '../../services/userService';

export const AssignCaregiverDoctorModal = ({
  isOpen,
  onClose,
  elderly = null,
  onAssignCaregiver,
  onAssignDoctor
}) => {
  const [caregivers, setCaregivers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedCaregiverId, setSelectedCaregiverId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && elderly) {
      setSelectedCaregiverId(elderly.assigned_caregiver_id || '');
      setSelectedDoctorId(elderly.assigned_doctor_id || '');
      fetchStaffList();
    }
  }, [isOpen, elderly]);

  const fetchStaffList = async () => {
    try {
      setLoadingStaff(true);
      const [cgRes, docRes] = await Promise.all([
        userService.getUsers({ role: 'Caregiver', limit: 100 }),
        userService.getUsers({ role: 'Doctor', limit: 100 })
      ]);
      setCaregivers(cgRes.users || []);
      setDoctors(docRes.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStaff(false);
    }
  };

  if (!isOpen || !elderly) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (selectedCaregiverId !== (elderly.assigned_caregiver_id || '')) {
        await onAssignCaregiver(elderly.id, selectedCaregiverId);
      }
      if (selectedDoctorId !== (elderly.assigned_doctor_id || '')) {
        await onAssignDoctor(elderly.id, selectedDoctorId);
      }
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update assignments.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayName = elderly.name || elderly.full_name || 'Elderly Patient';

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '28px', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} color="var(--primary)" />
            <span>Assign Caregiver & Doctor</span>
          </h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ marginBottom: '16px', fontSize: '0.92rem' }}>
          Assigning care staff for: <strong>{displayName}</strong>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={16} color="#15803d" />
              <span>Assigned Caregiver</span>
            </label>
            {loadingStaff ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading caregivers...</div>
            ) : (
              <select
                className="form-select"
                value={selectedCaregiverId}
                onChange={(e) => setSelectedCaregiverId(e.target.value)}
                style={{ padding: '10px 12px' }}
              >
                <option value="">-- Unassigned (No Caregiver) --</option>
                {caregivers.map((cg) => (
                  <option key={cg.id} value={cg.id}>
                    {cg.name || cg.full_name} ({cg.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Stethoscope size={16} color="#6b21a8" />
              <span>Assigned Doctor</span>
            </label>
            {loadingStaff ? (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading doctors...</div>
            ) : (
              <select
                className="form-select"
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                style={{ padding: '10px 12px' }}
              >
                <option value="">-- Unassigned (No Doctor) --</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name || doc.full_name} ({doc.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Assignments'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignCaregiverDoctorModal;
