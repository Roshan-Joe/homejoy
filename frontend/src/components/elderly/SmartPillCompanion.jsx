import React, { useState, useEffect, useCallback } from 'react';
import {
  Pill,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  CheckCircle2,
  Clock,
  Flame,
  RotateCcw,
  AlertCircle,
  Check,
  Loader2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { elderlyClientService } from '../../services/elderlyClientService';

const SLOT_THEMES = {
  Morning: {
    icon: Sunrise,
    color: '#d97706',
    border: '#fde68a',
    bg: '#fef3c7',
    badgeBg: '#fffbeb',
    badgeText: '#b45309'
  },
  Afternoon: {
    icon: Sun,
    color: '#0284c7',
    border: '#bae6fd',
    bg: '#e0f2fe',
    badgeBg: '#f0f9ff',
    badgeText: '#0369a1'
  },
  Evening: {
    icon: Sunset,
    color: '#7e22ce',
    border: '#e9d5ff',
    bg: '#f3e8ff',
    badgeBg: '#faf5ff',
    badgeText: '#6b21a8'
  },
  Night: {
    icon: Moon,
    color: '#4338ca',
    border: '#c7d2fe',
    bg: '#e0e7ff',
    badgeBg: '#eef2ff',
    badgeText: '#3730a3'
  }
};

export const SmartPillCompanion = ({ onNavigateMedications }) => {
  const [slots, setSlots] = useState([]);
  const [adherence, setAdherence] = useState({
    today_taken: 0,
    today_total: 0,
    seven_day_percentage: 100,
    streak_days: 0
  });
  const [loading, setLoading] = useState(true);
  const [actionLoadingKey, setActionLoadingKey] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [recentActionTime, setRecentActionTime] = useState({}); // key -> timestamp of taking

  const showFeedback = (type, text) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback({ type: '', text: '' }), 5000);
  };

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [slotsData, adherenceData] = await Promise.all([
        elderlyClientService.getTodayMedicationSlots(),
        elderlyClientService.getMedicationAdherence(7)
      ]);
      setSlots(Array.isArray(slotsData) ? slotsData : []);
      if (adherenceData) {
        setAdherence({
          today_taken: adherenceData.today_taken ?? adherenceData.today?.taken ?? 0,
          today_total: adherenceData.today_total ?? adherenceData.today?.total ?? 0,
          seven_day_percentage: adherenceData.seven_day_percentage ?? 100,
          streak_days: adherenceData.streak_days ?? 0
        });
      }
    } catch (err) {
      console.error('Failed to load medication slots:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Periodic 60-second polling & re-fetch on window focus
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(true);
    }, 60000);

    const onFocus = () => loadData(true);
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [loadData]);

  const handleTakeDose = async (slot) => {
    const key = `${slot.med_id}_${slot.scheduled_time}`;
    setActionLoadingKey(key);

    // Optimistic update
    const prevSlots = [...slots];
    const prevAdherence = { ...adherence };

    setSlots((current) =>
      current.map((s) =>
        s.med_id === slot.med_id && s.scheduled_time === slot.scheduled_time
          ? { ...s, state: 'taken', taken_at: new Date().toISOString() }
          : s
      )
    );
    setAdherence((prev) => ({
      ...prev,
      today_taken: Math.min(prev.today_total, prev.today_taken + 1)
    }));

    try {
      const res = await elderlyClientService.takeMedicationDose(slot.med_id, slot.scheduled_time);
      setRecentActionTime((prev) => ({ ...prev, [key]: Date.now() }));
      showFeedback(
        'success',
        `✓ ${slot.name} (${slot.scheduled_time_display || slot.scheduled_time}) recorded as taken!`
      );
      // Silent refresh to sync server state
      loadData(true);
    } catch (err) {
      // Rollback on error
      setSlots(prevSlots);
      setAdherence(prevAdherence);
      const detail = err.response?.data?.detail || 'Could not record dose.';
      showFeedback('error', detail);
    } finally {
      setActionLoadingKey(null);
    }
  };

  const handleUndoDose = async (slot) => {
    const key = `${slot.med_id}_${slot.scheduled_time}`;
    setActionLoadingKey(key);

    const prevSlots = [...slots];
    const prevAdherence = { ...adherence };

    setSlots((current) =>
      current.map((s) =>
        s.med_id === slot.med_id && s.scheduled_time === slot.scheduled_time
          ? { ...s, state: 'due', taken_at: null }
          : s
      )
    );
    setAdherence((prev) => ({
      ...prev,
      today_taken: Math.max(0, prev.today_taken - 1)
    }));

    try {
      await elderlyClientService.undoMedicationDose(slot.med_id, slot.scheduled_time);
      showFeedback('info', `↩️ Dose action for ${slot.name} undone.`);
      loadData(true);
    } catch (err) {
      setSlots(prevSlots);
      setAdherence(prevAdherence);
      const detail = err.response?.data?.detail || 'Undo window expired (max 5 minutes).';
      showFeedback('error', detail);
    } finally {
      setActionLoadingKey(null);
    }
  };

  const isEligibleForUndo = (slot) => {
    if (slot.state !== 'taken' && slot.state !== 'taken_late') return false;
    const key = `${slot.med_id}_${slot.scheduled_time}`;
    const recentTs = recentActionTime[key];
    if (recentTs && Date.now() - recentTs <= 300000) {
      return true;
    }
    if (slot.taken_at) {
      try {
        const takenDate = new Date(slot.taken_at);
        const elapsedSec = (Date.now() - takenDate.getTime()) / 1000;
        return elapsedSec >= 0 && elapsedSec <= 300;
      } catch (e) {
        return false;
      }
    }
    return false;
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

  return (
    <div
      className="pastel-card pastel-card-mint"
      style={{
        padding: '24px',
        borderRadius: '24px',
        marginBottom: '28px',
        border: '2px solid var(--pastel-mint-border)',
        boxShadow: '0 8px 24px rgba(22, 101, 52, 0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Header Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #bbf7d0 0%, #86efac 100%)',
              color: '#14532d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)'
            }}
          >
            <Pill size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#14532d', margin: 0 }}>
                Smart Pill Companion
              </h3>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: '#dcfce7',
                  color: '#15803d'
                }}
              >
                Live Server Windows
              </span>
            </div>
            <span style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: 600 }}>
              Real-time medication schedule & adherence tracker
            </span>
          </div>
        </div>

        {/* Adherence Streak Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            className="pastel-badge"
            style={{
              background: '#ffffff',
              border: '1.5px solid #86efac',
              color: '#15803d',
              fontWeight: 800,
              padding: '6px 14px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}
          >
            <Flame size={16} fill="#16a34a" color="#16a34a" />
            <span>
              {adherence.streak_days > 0 ? `${adherence.streak_days}-Day Streak!` : 'Daily Routine'}{' '}
              ({adherence.today_taken}/{adherence.today_total} Taken)
            </span>
          </div>
        </div>
      </div>

      {/* Action / Error Toast Feedback */}
      {feedback.text && (
        <div
          style={{
            padding: '10px 16px',
            borderRadius: '12px',
            marginBottom: '16px',
            fontSize: '0.88rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.2s ease',
            background:
              feedback.type === 'error'
                ? '#fef2f2'
                : feedback.type === 'info'
                ? '#f0f9ff'
                : '#f0fdf4',
            color:
              feedback.type === 'error'
                ? '#991b1b'
                : feedback.type === 'info'
                ? '#0369a1'
                : '#166534',
            border: `1.5px solid ${
              feedback.type === 'error'
                ? '#fecaca'
                : feedback.type === 'info'
                ? '#bae6fd'
                : '#bbf7d0'
            }`
          }}
        >
          {feedback.type === 'error' ? (
            <AlertCircle size={18} />
          ) : feedback.type === 'info' ? (
            <RotateCcw size={18} />
          ) : (
            <Check size={18} />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                height: '180px',
                background: '#ffffff',
                borderRadius: '18px',
                border: '2px solid #e2e8f0',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Loader2 size={24} className="animate-spin" color="#16a34a" />
            </div>
          ))}
        </div>
      ) : slots.length === 0 ? (
        /* Empty State */
        <div
          style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '2px dashed #bbf7d0',
            padding: '36px 24px',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#f0fdf4',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px'
            }}
          >
            <Sparkles size={28} />
          </div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#166534', margin: '0 0 6px 0' }}>
            No Medications Scheduled Today
          </h4>
          <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '420px', margin: '0 auto 16px' }}>
            You have no active doses scheduled for today's routine. Keep up the healthy habits or add your daily prescriptions.
          </p>
          {onNavigateMedications && (
            <button
              onClick={onNavigateMedications}
              className="btn btn-primary"
              style={{
                background: '#16a34a',
                borderColor: '#16a34a',
                fontSize: '0.85rem',
                padding: '8px 16px',
                borderRadius: '12px'
              }}
            >
              Manage Medications Schedule
            </button>
          )}
        </div>
      ) : (
        /* Slot Cards Grid */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '14px'
          }}
        >
          {slots.map((slot) => {
            const theme = SLOT_THEMES[slot.slot] || SLOT_THEMES.Morning;
            const IconComp = theme.icon;
            const key = `${slot.med_id}_${slot.scheduled_time}`;
            const isActing = actionLoadingKey === key;
            const isTaken = slot.state === 'taken' || slot.state === 'taken_late';
            const isDue = slot.state === 'due';
            const isUpcoming = slot.state === 'upcoming';
            const isMissed = slot.state === 'missed';
            const canUndo = isEligibleForUndo(slot);

            // Card background styling
            let cardBg = '#ffffff';
            let cardBorder = '#e2e8f0';
            let cardShadow = '0 4px 12px rgba(0,0,0,0.03)';

            if (isTaken) {
              cardBg = '#f0fdf4';
              cardBorder = '#86efac';
              cardShadow = 'none';
            } else if (isDue) {
              cardBg = '#ffffff';
              cardBorder = theme.color;
              cardShadow = `0 6px 18px ${theme.color}25`;
            } else if (isMissed) {
              cardBg = '#fff1f2';
              cardBorder = '#fda4af';
              cardShadow = 'none';
            }

            return (
              <div
                key={key}
                style={{
                  background: cardBg,
                  border: `2px solid ${cardBorder}`,
                  borderRadius: '18px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '210px',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  boxShadow: cardShadow
                }}
              >
                {/* Header: Slot + Status Icon */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: theme.color,
                        fontWeight: 800,
                        fontSize: '0.88rem'
                      }}
                    >
                      <IconComp size={18} /> {slot.slot}
                    </div>

                    {isTaken ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          color: '#15803d',
                          background: '#dcfce7',
                          padding: '2px 8px',
                          borderRadius: '10px'
                        }}
                      >
                        <CheckCircle2 size={14} color="#16a34a" /> Taken
                      </span>
                    ) : isDue ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          color: '#9a3412',
                          background: '#ffedd5',
                          padding: '2px 8px',
                          borderRadius: '10px',
                          animation: 'pulse 2s infinite'
                        }}
                      >
                        <Clock size={13} /> Due Now
                      </span>
                    ) : isMissed ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          color: '#991b1b',
                          background: '#fee2e2',
                          padding: '2px 8px',
                          borderRadius: '10px'
                        }}
                      >
                        <AlertCircle size={13} /> Missed
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#64748b',
                          background: '#f1f5f9',
                          padding: '2px 8px',
                          borderRadius: '10px'
                        }}
                      >
                        Upcoming
                      </span>
                    )}
                  </div>

                  {/* Scheduled Time */}
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: isDue ? theme.color : '#475569',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Clock size={13} />
                    <span>{slot.scheduled_time_display || slot.scheduled_time}</span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                      ({slot.before_food ? 'Before Food' : 'After Food'})
                    </span>
                  </div>

                  {/* Medicine Name & Dosage */}
                  <h4
                    style={{
                      fontSize: '0.96rem',
                      fontWeight: 800,
                      color: '#1e293b',
                      margin: '0 0 4px 0',
                      lineHeight: 1.3
                    }}
                  >
                    {slot.name}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600, margin: 0 }}>
                    {slot.dosage}
                  </p>
                </div>

                {/* Footer Action Area */}
                <div style={{ marginTop: '14px' }}>
                  {isTaken ? (
                    <div>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: '#166534',
                          fontWeight: 700,
                          marginBottom: canUndo ? '6px' : '0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Check size={14} color="#16a34a" />
                        <span>
                          {slot.taken_at ? `Recorded ${formatTakenTime(slot.taken_at)}` : 'Recorded as taken'}
                          {slot.late_minutes > 15 ? ` (+${slot.late_minutes}m late)` : ''}
                        </span>
                      </div>
                      {canUndo && (
                        <button
                          onClick={() => handleUndoDose(slot)}
                          disabled={isActing}
                          style={{
                            width: '100%',
                            padding: '6px',
                            background: '#ffffff',
                            border: '1.5px solid #cbd5e1',
                            borderRadius: '10px',
                            color: '#475569',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {isActing ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <RotateCcw size={13} />
                          )}
                          <span>Undo (5m grace window)</span>
                        </button>
                      )}
                    </div>
                  ) : isDue ? (
                    <button
                      onClick={() => handleTakeDose(slot)}
                      disabled={isActing}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '12px',
                        background: `linear-gradient(135deg, ${theme.color} 0%, #15803d 100%)`,
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(22, 101, 52, 0.25)',
                        transition: 'transform 0.15s ease'
                      }}
                      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
                      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      {isActing ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Pill size={16} />
                      )}
                      <span>Mark Taken</span>
                    </button>
                  ) : isUpcoming ? (
                    <button
                      disabled
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '10px',
                        background: '#f1f5f9',
                        color: '#94a3b8',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        border: '1px solid #e2e8f0',
                        cursor: 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px'
                      }}
                    >
                      <Clock size={13} />
                      <span>Opens at {slot.opens_at_display || slot.opens_at}</span>
                    </button>
                  ) : (
                    /* Missed */
                    <div
                      style={{
                        padding: '8px',
                        background: '#fff1f2',
                        borderRadius: '10px',
                        border: '1px solid #fecdd3',
                        color: '#991b1b',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        textAlign: 'center'
                      }}
                    >
                      Window closed at {slot.closes_at_display || slot.closes_at}
                    </div>
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
