import React, { useState, useEffect } from 'react';
import { X, UserCheck, Award, MapPin, Users } from 'lucide-react';
import { KERALA_DISTRICTS } from '../../constants/districts';

export const CaregiverFormModal = ({ isOpen, onClose, onSubmit, caregiver = null, loading = false }) => {
  const isEdit = !!caregiver;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    qualification: 'Certified Nursing Assistant (CNA)',
    experience_years: 4,
    shift: 'Day',
    status: 'Active',
    district: '',
    max_patients: 8
  });

  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (caregiver) {
      setFormData({
        name: caregiver.name || caregiver.full_name || '',
        email: caregiver.email || '',
        phone: caregiver.phone || '',
        password: '',
        qualification: caregiver.qualification || 'Certified Nursing Assistant (CNA)',
        experience_years: caregiver.experience_years || 4,
        shift: caregiver.shift || 'Day',
        status: caregiver.status || 'Active',
        district: caregiver.district || '',
        max_patients: caregiver.max_patients !== undefined ? caregiver.max_patients : 8
      });
      setValidationError('');
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        qualification: 'Certified Nursing Assistant (CNA)',
        experience_years: 4,
        shift: 'Day',
        status: 'Active',
        district: '',
        max_patients: 8
      });
      setValidationError('');
    }
  }, [caregiver, isOpen]);

  if (!isOpen) return null;

  const currentAssignedCount = caregiver?.assigned_elderly_ids?.length || 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.district) {
      setValidationError('Please select an operating district.');
      return;
    }
    const maxP = parseInt(formData.max_patients, 10);
    if (isNaN(maxP) || maxP < 1 || maxP > 20) {
      setValidationError('Max clients must be a valid number between 1 and 20.');
      return;
    }
    if (isEdit && maxP < currentAssignedCount) {
      setValidationError(`Cannot lower capacity to ${maxP}. Caregiver currently has ${currentAssignedCount} assigned clients.`);
      return;
    }

    setValidationError('');
    onSubmit({
      ...formData,
      experience_years: parseInt(formData.experience_years, 10) || 0,
      max_patients: maxP
    });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '540px', padding: '28px', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserCheck size={22} color="#15803d" />
            <span>{isEdit ? 'Edit Caregiver Staff' : 'Add New Caregiver'}</span>
          </h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Sarah Connor"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. sarah@homejoy.com"
              required
              disabled={isEdit}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input
              type="text"
              className="form-input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 345-6789"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Password {isEdit ? '(Leave blank to keep unchanged)' : '*'}
            </label>
            <input
              type="password"
              className="form-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={isEdit ? '••••••••' : 'Enter account password'}
              required={!isEdit}
              minLength={6}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Qualification / Certification *</label>
              <select
                className="form-select"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              >
                <option value="Certified Nursing Assistant (CNA)">CNA (Nursing Assistant)</option>
                <option value="Registered Nurse (RN)">RN (Registered Nurse)</option>
                <option value="Licensed Practical Nurse (LPN)">LPN (Practical Nurse)</option>
                <option value="Medical Assistant (MA)">MA (Medical Assistant)</option>
                <option value="Elderly Care Specialist">Elderly Care Specialist</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Experience (Years) *</label>
              <input
                type="number"
                className="form-input"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                min={0}
                max={40}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Assigned Shift *</label>
              <select
                className="form-select"
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
              >
                <option value="Day">Day Shift</option>
                <option value="Night">Night Shift</option>
                <option value="Rotational">Rotational Shift</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Staff Status *</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} color="var(--primary)" />
                <span>Operating District *</span>
              </label>
              <select
                className="form-select"
                value={formData.district}
                onChange={(e) => {
                  setFormData({ ...formData, district: e.target.value });
                  setValidationError('');
                }}
                required
              >
                <option value="">-- Select Kerala District --</option>
                {KERALA_DISTRICTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={14} color="var(--secondary)" />
                <span>Max Client Capacity (1-20) *</span>
              </label>
              <input
                type="number"
                className="form-input"
                value={formData.max_patients}
                onChange={(e) => {
                  setFormData({ ...formData, max_patients: e.target.value });
                  setValidationError('');
                }}
                min={1}
                max={20}
                required
              />
              {isEdit && (
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                  Currently assigned: <strong>{currentAssignedCount}</strong>
                </span>
              )}
            </div>
          </div>

          {validationError && (
            <div style={{
              padding: '10px 12px',
              backgroundColor: '#fef2f2',
              color: '#b91c1c',
              borderRadius: '8px',
              fontSize: '0.84rem',
              fontWeight: 600,
              border: '1px solid #fecaca'
            }}>
              {validationError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Save Staff Changes' : 'Create Caregiver Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CaregiverFormModal;
