import React, { useState, useEffect } from 'react';
import { X, HeartPulse, UserCheck } from 'lucide-react';

export const ElderlyFormModal = ({ isOpen, onClose, onSubmit, elderly = null, loading = false }) => {
  const isEdit = !!elderly;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    age: 72,
    date_of_birth: '1954-04-12',
    gender: 'Female',
    blood_group: 'O+',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medical_conditions: 'Hypertension',
    allergies: 'Penicillin',
    medications: 'Lisinopril 10mg'
  });

  useEffect(() => {
    if (elderly) {
      setFormData({
        name: elderly.name || elderly.full_name || '',
        email: elderly.email || '',
        phone: elderly.phone || '',
        password: '',
        age: elderly.age || 72,
        date_of_birth: elderly.date_of_birth || '1954-04-12',
        gender: elderly.gender || 'Female',
        blood_group: elderly.blood_group || 'O+',
        address: elderly.address || '',
        emergency_contact_name: elderly.emergency_contact_name || '',
        emergency_contact_phone: elderly.emergency_contact_phone || '',
        medical_conditions: Array.isArray(elderly.medical_conditions) ? elderly.medical_conditions.join(', ') : elderly.medical_conditions || '',
        allergies: Array.isArray(elderly.allergies) ? elderly.allergies.join(', ') : elderly.allergies || '',
        medications: Array.isArray(elderly.medications) ? elderly.medications.join(', ') : elderly.medications || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        age: 72,
        date_of_birth: '1954-04-12',
        gender: 'Female',
        blood_group: 'O+',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        medical_conditions: 'Hypertension',
        allergies: 'Penicillin',
        medications: 'Lisinopril 10mg'
      });
    }
  }, [elderly, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      age: parseInt(formData.age, 10) || 70,
      medical_conditions: formData.medical_conditions ? formData.medical_conditions.split(',').map(s => s.trim()).filter(Boolean) : [],
      allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
      medications: formData.medications ? formData.medications.split(',').map(s => s.trim()).filter(Boolean) : []
    };
    onSubmit(payload);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '620px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        backgroundColor: '#ffffff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HeartPulse size={22} color="var(--primary)" />
            <span>{isEdit ? 'Edit Elderly Profile' : 'Add New Elderly Patient'}</span>
          </h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Eleanor Vance"
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
                placeholder="e.g. eleanor@homejoy.com"
                required
                disabled={isEdit}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Age *</label>
              <input
                type="number"
                className="form-input"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                min={50}
                max={120}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                className="form-select"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Blood Group</label>
              <select
                className="form-select"
                value={formData.blood_group}
                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="text"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 234-5678"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                className="form-input"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Emergency Contact Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                placeholder="e.g. Robert Vance (Son)"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Emergency Contact Phone</label>
              <input
                type="text"
                className="form-input"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                placeholder="+1 (555) 987-6543"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Medical Conditions (Comma separated)</label>
            <input
              type="text"
              className="form-input"
              value={formData.medical_conditions}
              onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
              placeholder="e.g. Hypertension, Diabetes Type 2"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Known Allergies (Comma separated)</label>
            <input
              type="text"
              className="form-input"
              value={formData.allergies}
              onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
              placeholder="e.g. Penicillin, Peanuts"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Active Prescriptions / Medications</label>
            <input
              type="text"
              className="form-input"
              value={formData.medications}
              onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
              placeholder="e.g. Lisinopril 10mg, Metformin 500mg"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Save Profile Changes' : 'Create Elderly Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ElderlyFormModal;
