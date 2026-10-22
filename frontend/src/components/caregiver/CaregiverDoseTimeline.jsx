import React, { useState, useEffect, useCallback } from 'react';
import {
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Loader2,
  Check,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import caregiverPortalService from '../../services/caregiverPortalService';

const SLOT_ICONS = {
  Morning: Sunrise,
  Afternoon: Sun,
  Evening: Sunset,
  Night: Moon
};

const SLOT_COLORS = {
  Morning: { color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  Afternoon: { color: '#0284c7', bg: '#e0f2fe', border: '#bae6fd' },
  Evening: { color: '#7e22ce', bg: '#f3e8ff', border: '#e9d5ff' },
  Night: { color: '#4338ca', bg: '#e0e7ff', border: '#c7d2fe' }
};

export const CaregiverDoseTimeline = ({ elderlyId, elderlyName }) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingKey, setActionLoadingKey] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const loadDoses = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await caregiverPortalService.getElderlyTodayDoses(elderlyId);
      setSlots(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load elderly dose timeline:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [elderlyId]);

  useEffect(() => {
    if (elderlyId) {
      loadDoses();
    }
  }, [elderlyId, loadDoses]);

  const handleCaregiverTakeDose = async (slot) => {
    const key = `${slot.med_id}_${slot.scheduled_time}`;
    setActionLoadingKey(key);

    try {
      await caregiverPortalService.caregiverTakeDose(elderlyId, slot.med_id, slot.scheduled_time);
      setFeedback({
        type: 'success',
        text: `✓ Logged ${slot.name} (${slot.scheduled_time_display || slot.scheduled_time}) as taken on behalf of ${elderlyName || 'patient'}.`
      });
      setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
      loadDoses(true);
    } catch (err) {
      const detail = err.response?.data?.detail || 'Failed to record dose on behalf.';
      setFeedback({ type: 'error', text: detail });
      setTimeout(() => setFeedback({ type: '', text: '' }), 4000);
    } finally {
      setActionLoadingKey(null);
    }
  };

  const formatTakenTime = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const takenCount = slots.filter((s) => s.state === 'taken' || s.state === 'taken_late').length;
  const totalCount = slots.length;

  return (
    <div
      className="glass-card"
      style={{
        padding: '24px',
        marginBottom: '20px',
        border: '1px solid #e2e8f0',
        borderRadius: '16px'
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#1e293b' }}>
              Today's Live Medication Timeline
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Real-time dose window monitoring & caregiver verification for {elderlyName || 'Resident'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: '20px',
              background: takenCount === totalCount && totalCount > 0 ? '#dcfce7' : '#f1f5f9',
              color: takenCount === totalCount && totalCount > 0 ? '#15803d' : '#475569'
            }}
          >
            {takenCount} of {totalCount} Doses Taken
          </span>

          <button
            onClick={() => loadDoses(false)}
            disabled={loading}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: '#475569',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback.text && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: feedback.type === 'error' ? '#fef2f2' : '#f0fdf4',
            color: feedback.type === 'error' ? '#991b1b' : '#166534',
            border: `1px solid ${feedback.type === 'error' ? '#fecaca' : '#bbf7d0'}`
          }}
        >
          {feedback.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Timeline Content */}
      {loading ? (
        <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
          <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px', color: '#059669' }} />
          <div>Checking today's dose schedule...</div>
        </div>
      ) : slots.length === 0 ? (
        <div
          style={{
            padding: '28px',
            textAlign: 'center',
            background: '#f8fafc',
            borderRadius: '12px',
            color: '#64748b',
            border: '1px dashed #cbd5e1'
          }}
        >
          No active medication doses scheduled for today for this resident.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {slots.map((slot, index) => {
            const SlotIcon = SLOT_ICONS[slot.slot] || Pill;
            const theme = SLOT_COLORS[slot.slot] || SLOT_COLORS.Morning;
            const key = `${slot.med_id}_${slot.scheduled_time}`;
            const isActing = actionLoadingKey === key;
            const isTaken = slot.state === 'taken' || slot.state === 'taken_late';
            const isDue = slot.state === 'due';
            const isMissed = slot.state === 'missed';
            const isUpcoming = slot.state === 'upcoming';

            return (
              <div
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: '12px',
                  border: `1.5px solid ${isDue ? theme.color : isTaken ? '#86efac' : isMissed ? '#fca5a5' : '#e2e8f0'}`,
                  background: isTaken ? '#f0fdf4' : isMissed ? '#fff1f2' : '#ffffff',
                  gap: '16px',
                  flexWrap: 'wrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Time & Slot Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '160px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: theme.bg,
                      color: theme.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${theme.border}`
                    }}
                  >
                    <SlotIcon size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1e293b' }}>
                      {slot.scheduled_time_display || slot.scheduled_time}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: theme.color, fontWeight: 700 }}>
                      {slot.slot} Slot
                    </div>
                  </div>
                </div>

                {/* Medicine & Dosage */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
                    {slot.name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', display: 'flex', gap: '8px' }}>
                    <span>{slot.dosage}</span>
                    <span>•</span>
                    <span>{slot.before_food ? 'Before Food' : 'After Food'}</span>
                    {slot.prescribed_by && (
                      <>
                        <span>•</span>
                        <span>Dr. {slot.prescribed_by}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {isTaken ? (
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          background: '#dcfce7',
                          color: '#15803d',
                          fontWeight: 700,
                          fontSize: '0.8rem'
                        }}
                      >
                        <CheckCircle2 size={14} /> Taken {slot.source === 'caregiver' ? '(Caregiver Log)' : ''}
                      </span>
                      {slot.taken_at && (
                        <div style={{ fontSize: '0.74rem', color: '#15803d', marginTop: '2px' }}>
                          At {formatTakenTime(slot.taken_at)}
                          {slot.late_minutes > 15 ? ` (+${slot.late_minutes}m late)` : ''}
                        </div>
                      )}
                    </div>
                  ) : isDue ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: '#ffedd5',
                        color: '#9a3412',
                        fontWeight: 700,
                        fontSize: '0.8rem'
                      }}
                    >
                      <Clock size={14} /> Window Open (Due)
                    </span>
                  ) : isMissed ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: '#fee2e2',
                        color: '#991b1b',
                        fontWeight: 700,
                        fontSize: '0.8rem'
                      }}
                    >
                      <AlertCircle size={14} /> Missed Window
                    </span>
                  ) : (
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: '#f1f5f9',
                        color: '#64748b',
                        fontWeight: 600,
                        fontSize: '0.8rem'
                      }}
                    >
                      Opens {slot.opens_at_display || slot.opens_at}
                    </span>
                  )}
                </div>

                {/* Caregiver Override Action */}
                <div>
                  {isTaken ? (
                    <span style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600 }}>
                      ✓ Verified
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCaregiverTakeDose(slot)}
                      disabled={isActing}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: isDue ? '#059669' : '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                      }}
                      title="Mark dose taken on behalf of resident (caregiver authorized)"
                    >
                      {isActing ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Check size={13} />
                      )}
                      <span>Mark Taken on Behalf</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
