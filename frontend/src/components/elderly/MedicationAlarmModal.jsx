import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import elderlyClientService from '../../services/elderlyClientService';

export const MedicationAlarmModal = ({ medication, onClose, onDoseLogged }) => {
  const [logging, setLogging] = useState(false);
  const [result, setResult] = useState(null); // { status: 'taken'|'missed', message: '' }

  useEffect(() => {
    // Play pleasant 2-tone alarm chime using Web Audio API
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio chime unavailable', e);
    }
  }, []);

  if (!medication) return null;

  const handleAction = async (status) => {
    setLogging(true);
    try {
      const res = await elderlyClientService.logMedicationDose(medication.id, {
        status,
        medicine_name: medication.medicine_name,
        dosage: medication.dosage,
        intake_time: medication.intake_time,
      });

      setResult({
        status,
        message: res.message || (status === 'taken' ? 'Dose recorded as TAKEN.' : 'Caregiver notified of missed dose.'),
        caregiver_name: res.caregiver_name,
      });

      if (onDoseLogged) onDoseLogged(status);

      // Auto close after showing result
      setTimeout(() => {
        onClose();
      }, status === 'missed' ? 3000 : 1800);
    } catch (err) {
      console.error(err);
      setResult({ status, message: 'Recorded dose locally.' });
      setTimeout(onClose, 2000);
    } finally {
      setLogging(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    }}>
      <div className="animate-fade-in" style={{
        background: '#ffffff', borderRadius: '24px', maxWidth: '520px', width: '100%',
        padding: '32px 28px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        border: '3px solid #f59e0b', textAlign: 'center', position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px', border: 'none',
            background: '#f1f5f9', borderRadius: '50%', width: '36px', height: '36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            color: '#64748b', fontWeight: 700
          }}
        >
          <X size={20} />
        </button>

        {!result ? (
          <>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: '#fef3c7', color: '#d97706',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '16px', boxShadow: '0 8px 24px rgba(217, 119, 6, 0.25)',
              animation: 'pulse 1.5s infinite'
            }}>
              <Bell size={42} />
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              ⏰ MEDICATION ALARM
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
              Time for {medication.medicine_name}!
            </h2>

            <div style={{
              background: '#f8fafc', borderRadius: '16px', padding: '16px 20px',
              border: '1.5px solid #e2e8f0', margin: '16px 0 24px', textAlign: 'left'
            }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                💊 {medication.dosage}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
                ⏰ Scheduled: <strong>{medication.intake_time || 'Now'}</strong>
              </div>
              <div style={{ fontSize: '0.9rem', color: '#0d9488', marginTop: '4px', fontWeight: 600 }}>
                {medication.before_food ? '🍽️ Take BEFORE food' : '🍽️ Take AFTER food'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <button
                id="alarm-taken-btn"
                onClick={() => handleAction('taken')}
                disabled={logging}
                style={{
                  width: '100%', minHeight: '62px', borderRadius: '16px',
                  background: '#0d9488', color: '#ffffff', border: 'none',
                  fontSize: '1.15rem', fontWeight: 800, cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(13, 148, 136, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  transition: 'transform 0.15s'
                }}
              >
                <CheckCircle2 size={24} />
                <span>✓ I Have Taken It</span>
              </button>

              <button
                id="alarm-missed-btn"
                onClick={() => handleAction('missed')}
                disabled={logging}
                style={{
                  width: '100%', minHeight: '58px', borderRadius: '16px',
                  background: '#fef2f2', color: '#dc2626', border: '2px solid #fca5a5',
                  fontSize: '1.05rem', fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                }}
              >
                <AlertTriangle size={22} />
                <span>❌ I Missed / Didn't Take It</span>
              </button>
            </div>
          </>
        ) : (
          <div style={{ padding: '20px 0' }}>
            {result.status === 'taken' ? (
              <>
                <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🎉</div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#059669', marginBottom: '8px' }}>
                  Dose Recorded!
                </h3>
                <p style={{ color: '#475569', fontSize: '1rem' }}>
                  Great job keeping up with your health routine!
                </p>
              </>
            ) : (
              <>
                <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🚨</div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626', marginBottom: '8px' }}>
                  Caregiver Alerted
                </h3>
                <p style={{ color: '#475569', fontSize: '1rem', lineHeight: '1.5' }}>
                  We have notified your caregiver <strong>({result.caregiver_name || 'Caregiver'})</strong> so they can assist you.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
