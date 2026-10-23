import React, { useState, useEffect } from 'react';
import { X, HeartPulse, UserCheck, ShieldCheck, Mail, Phone, AlertCircle, Check, MapPin } from 'lucide-react';
import { KERALA_DISTRICTS } from '../../constants/districts';

const RELATIONSHIP_OPTIONS = [
  'Son',
  'Daughter',
  'Spouse',
  'Sibling',
  'Neighbour',
  'Local Guardian',
  'Care Assistant',
  'Other'
];

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
    district: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    guardian_name: '',
    guardian_relationship: 'Son',
    guardian_phone: '',
    guardian_email: '',
    guardian_report_consent: false,
    guardian_report_enabled: true,
    medical_conditions: 'Hypertension',
    allergies: 'Penicillin',
    medications: 'Lisinopril 10mg'
  });

  const [sameAsEmergency, setSameAsEmergency] = useState(false);
  const [validationError, setValidationError] = useState('');

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
        district: elderly.district || '',
        address: elderly.address || '',
        emergency_contact_name: elderly.emergency_contact_name || '',
        emergency_contact_phone: elderly.emergency_contact_phone || '',
        guardian_name: elderly.guardian_name || '',
        guardian_relationship: elderly.guardian_relationship || 'Son',
        guardian_phone: elderly.guardian_phone || '',
        guardian_email: elderly.guardian_email || '',
        guardian_report_consent: Boolean(elderly.guardian_report_consent),
        guardian_report_enabled: elderly.guardian_report_enabled !== undefined ? Boolean(elderly.guardian_report_enabled) : true,
        medical_conditions: Array.isArray(elderly.medical_conditions) ? elderly.medical_conditions.join(', ') : elderly.medical_conditions || '',
        allergies: Array.isArray(elderly.allergies) ? elderly.allergies.join(', ') : elderly.allergies || '',
        medications: Array.isArray(elderly.medications) ? elderly.medications.join(', ') : elderly.medications || ''
      });
      setSameAsEmergency(false);
      setValidationError('');
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
        district: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        guardian_name: '',
        guardian_relationship: 'Son',
        guardian_phone: '',
        guardian_email: '',
        guardian_report_consent: false,
        guardian_report_enabled: true,
        medical_conditions: 'Hypertension',
        allergies: 'Penicillin',
        medications: 'Lisinopril 10mg'
      });
      setSameAsEmergency(false);
      setValidationError('');
    }
  }, [elderly, isOpen]);

  if (!isOpen) return null;

  const handleSameAsEmergencyChange = (e) => {
    const checked = e.target.checked;
    setSameAsEmergency(checked);
    if (checked) {
      setFormData(prev => ({
        ...prev,
        guardian_name: prev.emergency_contact_name || prev.guardian_name,
        guardian_phone: prev.emergency_contact_phone || prev.guardian_phone
      }));
    }
  };

  const validateForm = () => {
    if (!formData.district) {
      return 'Please select a valid operating district for the resident.';
    }

    // If not edit mode (i.e. new registration), enforce guardian requirement
    if (!isEdit) {
      const gEmail = formData.guardian_email ? formData.guardian_email.trim() : '';
      const gName = formData.guardian_name ? formData.guardian_name.trim() : '';
      const gPhone = formData.guardian_phone ? formData.guardian_phone.trim() : '';

      const hasEmail = Boolean(gEmail);
      const hasNameAndPhone = Boolean(gName && gPhone);

      if (!hasEmail && !hasNameAndPhone) {
        return 'Registration must include at least one guardian contact method: either (a) Guardian Email, or (b) Guardian Name and Guardian Phone.';
      }

      if (hasEmail && !formData.guardian_report_consent) {
        return 'The guardian has agreed to receive wellness reports (guardian consent must be checked when guardian email is provided).';
      }

      if (gPhone) {
        const digits = gPhone.replace(/\D/g, '');
        if (digits.length < 7 || digits.length > 15) {
          return 'Guardian phone number must contain between 7 and 15 digits.';
        }
      }
    } else {
      // In edit mode, if email is provided or updated, check consent if email is present
      const gEmail = formData.guardian_email ? formData.guardian_email.trim() : '';
      if (gEmail && !formData.guardian_report_consent) {
        return 'Guardian consent must be granted if guardian email is provided for report delivery.';
      }
    }
    return '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError('');

    const payload = {
      ...formData,
      age: parseInt(formData.age, 10) || 70,
      guardian_name: formData.guardian_name?.trim() || null,
      guardian_relationship: formData.guardian_relationship?.trim() || null,
      guardian_phone: formData.guardian_phone?.trim() || null,
      guardian_email: formData.guardian_email?.trim()?.toLowerCase() || null,
      guardian_report_consent: Boolean(formData.guardian_report_consent),
      guardian_report_enabled: formData.guardian_email ? Boolean(formData.guardian_report_enabled) : false,
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
        maxWidth: '680px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        backgroundColor: '#ffffff',
        borderRadius: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HeartPulse size={22} color="var(--primary)" />
            <span>{isEdit ? 'Edit Elderly Profile' : 'Add New Elderly Patient'}</span>
          </h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {validationError && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            color: '#b91c1c',
            fontSize: '0.86rem',
            fontWeight: 600,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Basic Demographic Info */}
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
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} color="var(--primary)" />
                <span>District *</span>
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
              <label className="form-label">Home Address</label>
              <input
                type="text"
                className="form-input"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. 124 Blossom Lane, Apt 4B"
              />
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              EMERGENCY CONTACT
            </span>
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

          {/* Guardian / Family Contact Section */}
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '16px',
            padding: '18px',
            marginTop: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="#15803d" />
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#14532d' }}>
                  Guardian / Family Contact
                </span>
                <span style={{ fontSize: '0.74rem', backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
                  Receives Daily Reports
                </span>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', color: '#166534', cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={sameAsEmergency}
                  onChange={handleSameAsEmergencyChange}
                  style={{ accentColor: '#15803d' }}
                />
                <span>Same as emergency contact</span>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#14532d' }}>Guardian Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.guardian_name}
                  onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                  placeholder="e.g. Robert Vance"
                  style={{ backgroundColor: '#ffffff' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#14532d' }}>Relationship</label>
                <select
                  className="form-select"
                  value={formData.guardian_relationship}
                  onChange={(e) => setFormData({ ...formData, guardian_relationship: e.target.value })}
                  style={{ backgroundColor: '#ffffff' }}
                >
                  {RELATIONSHIP_OPTIONS.map(rel => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: '#14532d' }}>Guardian Phone</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.guardian_phone}
                  onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                  placeholder="+1 (555) 987-6543"
                  style={{ backgroundColor: '#ffffff' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#14532d' }}>Guardian Email (For Wellness Reports)</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.guardian_email}
                  onChange={(e) => setFormData({ ...formData, guardian_email: e.target.value })}
                  placeholder="guardian@example.com"
                  style={{ backgroundColor: '#ffffff' }}
                />
              </div>
            </div>

            {/* Consent & Enabled Checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid #bbf7d0' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.84rem', color: '#166534', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.guardian_report_consent}
                  onChange={(e) => setFormData({ ...formData, guardian_report_consent: e.target.checked })}
                  style={{ marginTop: '2px', accentColor: '#15803d' }}
                />
                <span style={{ fontWeight: 600 }}>
                  The guardian has agreed to receive wellness reports (Required if guardian email is provided)
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', color: '#166534', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.guardian_report_enabled}
                  onChange={(e) => setFormData({ ...formData, guardian_report_enabled: e.target.checked })}
                  style={{ accentColor: '#15803d' }}
                />
                <span>Enable daily wellness report delivery to this guardian</span>
              </label>
            </div>

            {!isEdit && (
              <div style={{ fontSize: '0.76rem', color: '#15803d', marginTop: '10px', fontStyle: 'italic' }}>
                * Registration must include at least one contact method: (a) Guardian Email with consent, or (b) Guardian Name & Phone.
              </div>
            )}
          </div>

          {/* Medical Profile Section */}
          <div className="form-group" style={{ marginTop: '6px' }}>
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
