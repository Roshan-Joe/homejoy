import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Phone, HeartPulse, ShieldAlert, UserCheck, Stethoscope, Pill } from 'lucide-react';
import familyService from '../../services/familyService';

export const EmergencySummaryModal = ({ isOpen, onClose, familyMember = null }) => {
  const [summaryList, setSummaryList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && familyMember) {
      fetchEmergencySummary();
    }
  }, [isOpen, familyMember]);

  const fetchEmergencySummary = async () => {
    try {
      setLoading(true);
      const data = await familyService.getEmergencySummary(familyMember.id);
      setSummaryList(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !familyMember) return null;

  const displayName = familyMember.name || familyMember.full_name || 'Family Member';

  const getRiskBadge = (level) => {
    const l = (level || 'Low').toLowerCase();
    let bg = '#dcfce7';
    let color = '#15803d';

    if (l === 'high') { bg = '#fef2f2'; color = '#b91c1c'; }
    else if (l === 'medium') { bg = '#fef3c7'; color = '#b45309'; }

    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '0.78rem',
        fontWeight: 800,
        backgroundColor: bg,
        color: color,
        textTransform: 'uppercase'
      }}>
        AI Risk: {level || 'Low'}
      </span>
    );
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
        backgroundColor: '#ffffff'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={22} color="#b91c1c" />
              <span>Consolidated Emergency Summary</span>
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Emergency health profile & contact directory for {displayName}
            </span>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            Aggregating emergency medical profiles...
          </div>
        ) : summaryList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
            No linked elderly residents found for emergency summary report.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {summaryList.map((item, idx) => (
              <div key={item.elderly_id || idx} style={{
                border: '2px solid #fee2e2',
                borderRadius: '12px',
                padding: '20px',
                backgroundColor: '#fff5f5'
              }}>
                {/* Elderly Patient Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {item.elderly_name} (Age {item.age})
                    </h4>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Blood Group: <strong style={{ color: '#b91c1c' }}>{item.blood_group}</strong>
                    </div>
                  </div>
                  {getRiskBadge(item.risk_level)}
                </div>

                {/* Medical Profile Overview */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
                      MEDICAL CONDITIONS
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      {item.medical_conditions && item.medical_conditions.length > 0 ? item.medical_conditions.join(', ') : 'None listed'}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#ffffff', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#b91c1c', marginBottom: '4px' }}>
                      KNOWN ALLERGIES
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#b91c1c' }}>
                      {item.allergies && item.allergies.length > 0 ? item.allergies.join(', ') : 'No known allergies'}
                    </div>
                  </div>
                </div>

                {/* Staff Contacts */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
                    <UserCheck size={16} color="#15803d" />
                    <span>Caregiver: <strong>{item.primary_caregiver_name}</strong></span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
                    <Stethoscope size={16} color="#6b21a8" />
                    <span>Doctor: <strong>{item.primary_doctor_name}</strong></span>
                  </div>
                </div>

                {/* Emergency Family Contacts */}
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    EMERGENCY FAMILY CONTACTS ({item.family_contacts.length})
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {item.family_contacts.map((c, cIdx) => (
                      <div key={cIdx} style={{
                        display: 'flex',
                        justify: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.85rem'
                      }}>
                        <div>
                          <strong>{c.name}</strong> ({c.relationship})
                          {c.is_primary_contact && <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#b45309', fontWeight: 700 }}>[PRIMARY]</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--primary)' }}>
                          <Phone size={14} />
                          <span>{c.phone || 'No Phone'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'right', marginTop: '24px' }}>
          <button className="btn btn-primary" onClick={onClose}>Close Summary</button>
        </div>
      </div>
    </div>
  );
};

export default EmergencySummaryModal;
