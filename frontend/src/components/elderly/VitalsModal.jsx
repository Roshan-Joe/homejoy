import React, { useState, useEffect } from 'react';
import { Activity, Heart, Wind, Check, AlertCircle, X } from 'lucide-react';
import elderlyClientService from '../../services/elderlyClientService';

export const VitalsModal = ({ isOpen, onClose, onVitalsSaved, initialVitals = null }) => {
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [oxygen, setOxygen] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [advisoryMsg, setAdvisoryMsg] = useState('');

  useEffect(() => {
    if (initialVitals) {
      setSystolic(initialVitals.systolic || '');
      setDiastolic(initialVitals.diastolic || '');
      setOxygen(initialVitals.oxygen_saturation || '');
    } else {
      setSystolic('');
      setDiastolic('');
      setOxygen('');
    }
    setError('');
    setAdvisoryMsg('');
  }, [initialVitals, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setAdvisoryMsg('');

    const sysNum = parseInt(systolic, 10);
    const diaNum = parseInt(diastolic, 10);
    const oxyNum = parseInt(oxygen, 10);

    if (isNaN(sysNum) || sysNum < 50 || sysNum > 250) {
      setError('Please enter a valid Systolic Blood Pressure between 50 and 250 mmHg.');
      return;
    }
    if (isNaN(diaNum) || diaNum < 30 || diaNum > 150) {
      setError('Please enter a valid Diastolic Blood Pressure between 30 and 150 mmHg.');
      return;
    }
    if (diaNum >= sysNum) {
      setError('Diastolic pressure must be lower than Systolic pressure.');
      return;
    }
    if (isNaN(oxyNum) || oxyNum < 50 || oxyNum > 100) {
      setError('Please enter a valid Oxygen Saturation between 50% and 100%.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await elderlyClientService.submitVitals({
        systolic: sysNum,
        diastolic: diaNum,
        oxygen_saturation: oxyNum
      });

      if (res.advisory_notes && res.advisory_notes.includes('verify')) {
        setAdvisoryMsg(res.advisory_notes);
      }

      onVitalsSaved && onVitalsSaved(res);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to submit vitals:', err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : (err.message || 'Failed to save vitals. Please check your inputs.'));
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="carer-modal-backdrop" style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2500,
      padding: '20px'
    }}>
      <div className="card glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: '520px',
        borderRadius: '24px',
        padding: '32px',
        backgroundColor: '#ffffff',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18)',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px', right: '20px',
            background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer'
          }}
        >
          <X size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            backgroundColor: '#eff6ff', color: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Activity size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Today's Vitals Entry
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
              Enter your blood pressure and oxygen saturation reading
            </p>
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b',
            padding: '12px 16px', borderRadius: '12px', fontSize: '0.88rem', margin: '16px 0',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {advisoryMsg && (
          <div style={{
            backgroundColor: '#fffbeb', border: '1px solid #fef3c7', color: '#92400e',
            padding: '12px 16px', borderRadius: '12px', fontSize: '0.88rem', margin: '16px 0',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <AlertCircle size={18} />
            <span>{advisoryMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
          {/* Blood Pressure Section */}
          <div style={{
            backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px',
            border: '1px solid #e2e8f0', marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Heart size={20} color="#e11d48" />
              <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Blood Pressure (mmHg)
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Systolic (Upper)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <input
                    type="number"
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    placeholder="120"
                    min="50" max="250"
                    required
                    style={{
                      width: '100%', padding: '14px 16px', fontSize: '1.1rem', fontWeight: 700,
                      borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff',
                      outline: 'none'
                    }}
                  />
                  <span style={{ position: 'absolute', right: '14px', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                    mmHg
                  </span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Diastolic (Lower)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <input
                    type="number"
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    placeholder="80"
                    min="30" max="150"
                    required
                    style={{
                      width: '100%', padding: '14px 16px', fontSize: '1.1rem', fontWeight: 700,
                      borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff',
                      outline: 'none'
                    }}
                  />
                  <span style={{ position: 'absolute', right: '14px', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                    mmHg
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Oxygen Saturation Section */}
          <div style={{
            backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px',
            border: '1px solid #e2e8f0', marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Wind size={20} color="#0284c7" />
              <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Oxygen Saturation (SpO₂ %)
              </h3>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Oxygen Level Percentage
              </label>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <input
                  type="number"
                  value={oxygen}
                  onChange={(e) => setOxygen(e.target.value)}
                  placeholder="98"
                  min="50" max="100"
                  required
                  style={{
                    width: '100%', padding: '14px 16px', fontSize: '1.1rem', fontWeight: 700,
                    borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff',
                    outline: 'none'
                  }}
                />
                <span style={{ position: 'absolute', right: '14px', fontSize: '0.9rem', color: '#94a3b8', fontWeight: 700 }}>
                  % SpO₂
                </span>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '14px', borderRadius: '12px', fontWeight: 600 }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                flex: 1.5, padding: '14px', borderRadius: '12px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              <Check size={20} />
              <span>{submitting ? 'Saving...' : 'Save Vitals'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
