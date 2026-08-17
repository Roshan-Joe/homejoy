import React, { useState, useEffect } from 'react';
import { X, HeartHandshake, ShieldCheck } from 'lucide-react';

export const FamilyFormModal = ({ isOpen, onClose, onSubmit, familyMember = null, loading = false }) => {
  const isEdit = !!familyMember;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    relationship: 'Son',
    is_primary_contact: true,
    status: 'Active'
  });

  useEffect(() => {
    if (familyMember) {
      setFormData({
        name: familyMember.name || familyMember.full_name || '',
        email: familyMember.email || '',
        phone: familyMember.phone || '',
        password: '',
        relationship: familyMember.relationship || 'Son',
        is_primary_contact: familyMember.is_primary_contact ?? true,
        status: familyMember.status || 'Active'
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        relationship: 'Son',
        is_primary_contact: true,
        status: 'Active'
      });
    }
  }, [familyMember, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
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
            <HeartHandshake size={22} color="var(--primary)" />
            <span>{isEdit ? 'Edit Family Member Profile' : 'Add New Family Member'}</span>
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
              placeholder="e.g. Mark Vance"
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
              placeholder="e.g. mark.vance@homejoy.com"
              required
              disabled={isEdit}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <input
              type="text"
              className="form-input"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 678-9012"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Relationship to Elderly *</label>
              <select
                className="form-select"
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              >
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Spouse">Spouse</option>
                <option value="Sibling">Sibling</option>
                <option value="Legal Guardian">Legal Guardian</option>
                <option value="Relative">Relative</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status *</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
            <input
              type="checkbox"
              id="is_primary"
              checked={formData.is_primary_contact}
              onChange={(e) => setFormData({ ...formData, is_primary_contact: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="is_primary" style={{ fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer' }}>
              Designate as Primary Emergency Contact
            </label>
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
              {loading ? 'Saving...' : isEdit ? 'Save Profile Changes' : 'Create Family Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FamilyFormModal;
