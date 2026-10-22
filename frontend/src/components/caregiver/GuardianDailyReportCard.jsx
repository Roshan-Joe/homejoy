import React, { useState, useEffect, useCallback } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ShieldCheck, 
  ShieldAlert, 
  User, 
  RefreshCw, 
  FileText,
  AlertTriangle
} from 'lucide-react';
import caregiverPortalService from '../../services/caregiverPortalService';

export const GuardianDailyReportCard = ({ elderlyId, elderlyName = 'Patient' }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState('');
  const [allowResend, setAllowResend] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string, details?: any }

  const fetchStatus = useCallback(async () => {
    if (!elderlyId) return;
    try {
      setLoading(true);
      const res = await caregiverPortalService.getGuardianDailyReportEmailStatus(elderlyId);
      setStatus(res);
      setAllowResend(false);
    } catch (err) {
      console.error('Failed to fetch guardian email status:', err);
      const msg = err.response?.data?.detail || 'Could not load guardian email status.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }, [elderlyId]);

  useEffect(() => {
    fetchStatus();
    setFeedback(null);
    setNote('');
  }, [fetchStatus]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!elderlyId) return;

    try {
      setSending(true);
      setFeedback(null);

      const res = await caregiverPortalService.sendGuardianDailyReportEmail(elderlyId, {
        note: note.trim(),
        resend: allowResend
      });

      setFeedback({
        type: 'success',
        message: res.message || 'Daily report successfully dispatched to guardian.',
        details: res
      });
      setNote('');
      setAllowResend(false);

      // Refresh status after sending
      await fetchStatus();
    } catch (err) {
      console.error('Error sending guardian report email:', err);
      const errorMsg = err.response?.data?.detail || 'Failed to dispatch daily report email.';
      setFeedback({ type: 'error', message: errorMsg });
    } finally {
      setSending(false);
    }
  };

  // Helper to format ISO date to HH:MM time
  const formatTime = (isoStr) => {
    if (!isoStr) return '';
    try {
      const dt = new Date(isoStr);
      return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return isoStr;
    }
  };

  const hasEmail = Boolean(status?.masked_email);
  const hasConsent = Boolean(status?.consent);
  const isEnabled = Boolean(status?.enabled);
  const alreadySent = Boolean(status?.already_sent_today);
  const sendCount = status?.send_count_today || 0;
  const isDailyLimitReached = sendCount >= 3;

  // Button disabled logic
  const canSubmit = !loading && !sending && hasEmail && hasConsent && isEnabled && (!alreadySent || allowResend) && !isDailyLimitReached;

  return (
    <div 
      className="glass-card animate-fade-in"
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
        border: '1px solid #bbf7d0',
        borderRadius: '20px',
        padding: '28px',
        boxShadow: '0 10px 25px -5px rgba(22, 101, 52, 0.08)',
        position: 'relative'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: '#15803d',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(21, 128, 61, 0.25)'
            }}>
              <Mail size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#14532d', margin: 0 }}>
                Guardian Daily Wellness Report
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#166534', margin: '2px 0 0 0' }}>
                Email patient wellness summary, check-in telemetry, vitals & AI risk directly to family
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchStatus}
          disabled={loading || sending}
          className="btn btn-secondary"
          style={{
            fontSize: '0.8rem',
            padding: '6px 12px',
            borderRadius: '9999px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#ffffff'
          }}
          title="Refresh delivery status"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Sync Status</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div 
          className="animate-fade-in"
          style={{
            marginBottom: '20px',
            padding: '14px 18px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            backgroundColor: feedback.type === 'success' ? '#dcfce7' : '#fee2e2',
            border: `1px solid ${feedback.type === 'success' ? '#86efac' : '#fca5a5'}`,
            color: feedback.type === 'success' ? '#14532d' : '#991b1b'
          }}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={20} style={{ color: '#16a34a', flexShrink: 0, marginTop: '2px' }} />
          ) : (
            <AlertCircle size={20} style={{ color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
          )}
          <div style={{ flex: 1, fontSize: '0.9rem' }}>
            <div style={{ fontWeight: 700 }}>
              {feedback.type === 'success' ? 'Report Delivered' : 'Delivery Failed'}
            </div>
            <div style={{ marginTop: '2px', lineHeight: 1.4 }}>{feedback.message}</div>
            {feedback.details?.masked_email && (
              <div style={{ fontSize: '0.8rem', marginTop: '4px', opacity: 0.9 }}>
                Sent to: <strong>{feedback.details.masked_email}</strong> ({feedback.details.guardian_name || 'Guardian'})
              </div>
            )}
          </div>
          <button 
            type="button" 
            onClick={() => setFeedback(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700, padding: 0 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Guardian Profile Card */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '18px',
        marginBottom: '20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        alignItems: 'center'
      }}>
        {/* Contact Info */}
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            DESIGNATED GUARDIAN
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={16} color="#15803d" />
            <span>{status?.guardian_name || 'No guardian name registered'}</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
            Relationship: <strong>{status?.guardian_relationship || 'Contact'}</strong>
          </div>
        </div>

        {/* Email Address & Mask */}
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            DELIVERY RECIPIENT
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: hasEmail ? '#15803d' : '#94a3b8', marginTop: '4px' }}>
            {hasEmail ? status.masked_email : 'No email address on file'}
          </div>
          <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '0.74rem',
              fontWeight: 700,
              backgroundColor: hasConsent ? '#dcfce7' : '#fee2e2',
              color: hasConsent ? '#15803d' : '#b91c1c'
            }}>
              {hasConsent ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
              <span>{hasConsent ? 'Consent Granted' : 'No Consent'}</span>
            </span>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontSize: '0.74rem',
              fontWeight: 700,
              backgroundColor: isEnabled ? '#e0f2fe' : '#f1f5f9',
              color: isEnabled ? '#0369a1' : '#64748b'
            }}>
              <span>{isEnabled ? 'Reports Enabled' : 'Reports Disabled'}</span>
            </span>
          </div>
        </div>

        {/* Dispatch Status Today */}
        <div style={{ borderLeft: '1px solid #f1f5f9', paddingLeft: '16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            TODAY'S STATUS
          </div>
          {alreadySent ? (
            <div style={{ marginTop: '4px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '8px',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                fontSize: '0.86rem',
                fontWeight: 700
              }}>
                <CheckCircle2 size={16} />
                <span>Already sent today at {formatTime(status?.last_sent_at)}</span>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: '4px' }}>
                Dispatched {sendCount} of 3 allowed per day
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '4px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '8px',
                backgroundColor: '#fef3c7',
                color: '#b45309',
                fontSize: '0.86rem',
                fontWeight: 700
              }}>
                <Clock size={16} />
                <span>Not sent yet today</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sending Form */}
      <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Caregiver Note */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={15} color="#15803d" />
              <span>Optional Caregiver Note for Guardian</span>
            </label>
            <span style={{ fontSize: '0.76rem', color: note.length > 270 ? '#b91c1c' : '#64748b', fontWeight: 600 }}>
              {note.length} / 300 characters
            </span>
          </div>
          <textarea
            className="form-input"
            rows={3}
            maxLength={300}
            placeholder={`Add a personal note for ${elderlyName}'s family... (e.g. "Participated nicely in afternoon physio, appetite was strong at lunch.")`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={loading || sending || !hasEmail || !hasConsent}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              padding: '12px',
              fontSize: '0.92rem',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Resend Checkbox if already sent today */}
        {alreadySent && !isDailyLimitReached && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <input
              type="checkbox"
              id={`resend-toggle-${elderlyId}`}
              checked={allowResend}
              onChange={(e) => setAllowResend(e.target.checked)}
              disabled={loading || sending}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#15803d' }}
            />
            <label htmlFor={`resend-toggle-${elderlyId}`} style={{ fontSize: '0.86rem', color: '#334155', fontWeight: 600, cursor: 'pointer' }}>
              Resend updated report for today (Allow up to 3 sends per day • Currently {sendCount}/3)
            </label>
          </div>
        )}

        {/* Daily limit reached warning */}
        {isDailyLimitReached && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#b45309',
            fontSize: '0.86rem',
            fontWeight: 600
          }}>
            <AlertTriangle size={16} />
            <span>Daily limit reached: 3 wellness reports have already been emailed to this guardian today.</span>
          </div>
        )}

        {/* Action Button & Ineligibility Hints */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginTop: '4px' }}>
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '0.95rem',
              backgroundColor: canSubmit ? '#15803d' : '#94a3b8',
              borderColor: canSubmit ? '#15803d' : '#94a3b8',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              boxShadow: canSubmit ? '0 4px 14px rgba(21, 128, 61, 0.3)' : 'none'
            }}
          >
            {sending ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Dispatching Email...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>{alreadySent ? 'Resend Daily Report to Guardian' : 'Send Daily Report to Guardian'}</span>
              </>
            )}
          </button>

          {/* Validation & Requirement Hint */}
          {!hasEmail ? (
            <div style={{ fontSize: '0.84rem', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={15} />
              <span>Cannot send: No guardian email is registered for this patient.</span>
            </div>
          ) : !hasConsent ? (
            <div style={{ fontSize: '0.84rem', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={15} />
              <span>Cannot send: Guardian has not given consent to receive wellness reports.</span>
            </div>
          ) : !isEnabled ? (
            <div style={{ fontSize: '0.84rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={15} />
              <span>Report delivery is currently paused for this guardian.</span>
            </div>
          ) : alreadySent && !allowResend ? (
            <div style={{ fontSize: '0.84rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={15} />
              <span>Already sent today. Check the box above if you need to resend an updated report.</span>
            </div>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default GuardianDailyReportCard;
