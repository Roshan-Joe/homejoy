import React, { useState, useEffect } from 'react';
import { X, Stethoscope, Building2 } from 'lucide-react';

export const DoctorFormModal = ({ isOpen, onClose, onSubmit, doctor = null, loading = false }) => {
  const isEdit = !!doctor;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    specialization: 'Geriatrician',
    license_number: 'MD-89241',
    hospital_affiliation: 'City General Hospital',
    experience_years: 12,
    status: 'Active'
  });

  useEffect(() => {
    if (doctor) {
      setFormData({
        name: doctor.name || doctor.full_name || '',
        email: doctor.email || '',
        phone: doctor.phone || '',
        password: '',
        specialization: doctor.specialization || 'Geriatrician',
        license_number: doctor.license_number || 'MD-89241',
        hospital_affiliation: doctor.hospital_affiliation || 'City General Hospital',
        experience_years: doctor.experience_years || 12,
        status: doctor.status || 'Active'
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        specialization: 'Geriatrician',
        license_number: 'MD-89241',
        hospital_affiliation: 'City General Hospital',
        experience_years: 12,
        status: 'Active'
      });
    }
  }, [doctor, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      experience_years: parseInt(formData.experience_years, 10) || 0
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
            <Stethoscope size={22} color="#6b21a8" />
            <span>{isEdit ? 'Edit Doctor Profile' : 'Add New Doctor'}</span>
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
              placeholder="e.g. Dr. Robert Smith"
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
              placeholder="e.g. drsmith@homejoy.com"
              required
              disabled={isEdit}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Specialization *</label>
              <select
                className="form-select"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              >
                <option value="Geriatrician">Geriatrician</option>
                <option value="Cardiologist">Cardiologist</option>
                <option value="Neurologist">Neurologist</option>
                <option value="General Physician">General Physician</option>
                <option value="Endocrinologist">Endocrinologist</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Medical License Number *</label>
              <input
                type="text"
                className="form-input"
                value={formData.license_number}
                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                placeholder="e.g. MD-89241"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Hospital / Clinic Affiliation</label>
            <input
              type="text"
              className="form-input"
              value={formData.hospital_affiliation}
              onChange={(e) => setFormData({ ...formData, hospital_affiliation: e.target.value })}
              placeholder="e.g. City General Hospital"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Experience (Years) *</label>
              <input
                type="number"
                className="form-input"
                value={formData.experience_years}
                onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                min={0}
                max={50}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Doctor Status *</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="On Call">On Call</option>
              </select>
            </div>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Save Doctor Profile' : 'Create Doctor Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorFormModal;
