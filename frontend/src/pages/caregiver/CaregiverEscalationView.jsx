import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert, AlertTriangle, CheckCircle2, Clock, Phone,
  RefreshCw, User, ArrowRight, ShieldCheck, FileCheck, Check
} from 'lucide-react';
import caregiverPortalService from '../../services/caregiverPortalService';

export const CaregiverEscalationView = () => {
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [filterStatus, setFilterStatus] = useState('active');

  // Resolution modal state
  const [resolvingItem, setResolvingItem] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchEscalations = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await caregiverPortalService.getEscalations(filterStatus);
      setEscalations(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch missed-checkin escalations.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchEscalations();
  }, [fetchEscalations]);

  const handleScanEscalations = async () => {
    try {
      setScanning(true);
      const res = await caregiverPortalService.scanEscalations();
      setToastMessage(res.message || 'Escalation scan completed.');
      fetchEscalations();
      setTimeout(() => setToastMessage(''), 5000);
    } catch (err) {
      console.error(err);
      alert('Failed to run escalation scanner.');
    } finally {
      setScanning(false);
    }
  };

  const handleOpenResolveModal = (item) => {
    setResolvingItem(item);
    setResolutionNotes(`Contacted resident. Resident is safe and well.`);
  };

  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    if (!resolvingItem) return;

    try {
      setResolving(true);
      await caregiverPortalService.resolveEscalation(resolvingItem.id, resolutionNotes);
      setToastMessage(`Escalation for ${resolvingItem.elderly_name} resolved.`);
      setResolvingItem(null);
      setResolutionNotes('');
      fetchEscalations();
      setTimeout(() => setToastMessage(''), 5000);
    } catch (err) {
      console.error(err);
      alert('Failed to resolve escalation.');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className="animate-fade-in"
          style={{
            padding: '16px 20px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#ffffff',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 8px 24px rgba(4, 120, 87, 0.25)'
          }}
        >
          <CheckCircle2 size={24} />
          <span style={{ flex: 1 }}>{toastMessage}</span>
          <button
            onClick={() => setToastMessage('')}
            style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontWeight: 800 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Escalation Architecture & Actions Banner */}
      <div
        className="glass-card"
        style={{
          padding: '28px',
          borderRadius: '20px',
          background: 'linear-gradient(145deg, #ffffff 0%, #fff1f2 100%)',
          border: '1.5px solid #fecdd3'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '10px', background: '#e11d48', color: '#ffffff' }}>
                <ShieldAlert size={22} />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#9f1239', margin: 0 }}>
                Missed-Check-in Escalation Chain
              </h2>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#475569', margin: '6px 0 0 0', maxWidth: '680px' }}>
              Automated safety net protocol when an elderly resident misses their scheduled daily check-in. Progresses through three failsafe tiers.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={handleScanEscalations}
              disabled={scanning}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                fontWeight: 800,
                padding: '12px 20px',
                borderRadius: '12px',
                boxShadow: '0 4px 14px rgba(225, 29, 72, 0.28)'
              }}
            >
              <RefreshCw size={18} className={scanning ? 'animate-spin' : ''} />
              <span>{scanning ? 'Scanning Check-ins...' : 'Run Escalation Scan'}</span>
            </button>
          </div>
        </div>

        {/* 3-Tier Escalation Stepper Diagram */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px',
            background: '#ffffff',
            padding: '18px',
            borderRadius: '16px',
            border: '1px solid #fecdd3'
          }}
        >
          <div style={{ padding: '14px', borderRadius: '12px', background: '#fffbeb', border: '1px solid #fde68a' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>
                Tier 1 (4h Overdue)
              </span>
              <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '9999px', background: '#fef3c7', color: '#b45309', fontWeight: 700 }}>
                Caregiver Alert
              </span>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#78350f' }}>Assigned Caregiver Action</div>
            <div style={{ fontSize: '0.8rem', color: '#92400e', marginTop: '4px' }}>
              Assigns priority triage task & pushes in-app browser alert to primary caregiver.
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', background: '#fff7ed', border: '1px solid #fed7aa' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#c2410c', textTransform: 'uppercase' }}>
                Tier 2 (8h Overdue)
              </span>
              <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '9999px', background: '#ffedd5', color: '#c2410c', fontWeight: 700 }}>
                Admin Triage
              </span>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#7c2d12' }}>Facility Admin Broadcast</div>
            <div style={{ fontSize: '0.8rem', color: '#9a3412', marginTop: '4px' }}>
              Flags High-Severity triage alert in Admin Command Center for supervisory escalation.
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#b91c1c', textTransform: 'uppercase' }}>
                Tier 3 (12h Overdue)
              </span>
              <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '9999px', background: '#fee2e2', color: '#b91c1c', fontWeight: 700 }}>
                Emergency Contact
              </span>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#7f1d1d' }}>Guardian & Emergency Dispatch</div>
            <div style={{ fontSize: '0.8rem', color: '#991b1b', marginTop: '4px' }}>
              Contacts designated guardian & emergency contacts for immediate physical welfare check.
            </div>
          </div>
        </div>

        {/* Status Tab Switcher */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={() => setFilterStatus('active')}
            className={`btn btn-sm ${filterStatus === 'active' ? 'btn-primary' : 'btn-ghost'}`}
            style={{
              background: filterStatus === 'active' ? '#e11d48' : 'transparent',
              borderColor: '#e11d48'
            }}
          >
            Active Incidents ({escalations.filter(e => e.status !== 'resolved').length})
          </button>
          <button
            onClick={() => setFilterStatus('resolved')}
            className={`btn btn-sm ${filterStatus === 'resolved' ? 'btn-primary' : 'btn-ghost'}`}
          >
            Resolved History
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`btn btn-sm ${filterStatus === 'all' ? 'btn-primary' : 'btn-ghost'}`}
          >
            All Logs
          </button>
        </div>
      </div>

      {/* Escalations Feed */}
      {loading ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <Clock className="animate-spin" size={28} style={{ margin: '0 auto 10px', color: '#e11d48' }} />
          <div>Checking escalation database...</div>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      ) : escalations.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
          <ShieldCheck size={44} style={{ margin: '0 auto 12px', color: '#059669' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 6px 0', color: '#065f46' }}>
            All Clear — Zero Escalations
          </h3>
          <p style={{ fontSize: '0.88rem', margin: 0 }}>
            {filterStatus === 'active'
              ? 'No residents currently have missed check-ins requiring escalation.'
              : 'No escalation records found for this filter.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {escalations.map((item) => {
            const tierBadge = {
              1: { label: 'Tier 1: Caregiver Task', bg: '#fef3c7', text: '#b45309', border: '#fde68a' },
              2: { label: 'Tier 2: Admin Broadcast', bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' },
              3: { label: 'Tier 3: Emergency Dispatch', bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' }
            }[item.current_tier] || { label: `Tier ${item.current_tier}`, bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };

            const isResolved = item.status === 'resolved';

            return (
              <div
                key={item.id}
                className="glass-card animate-fade-in"
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  border: isResolved ? '1px solid #bbf7d0' : '2px solid #fda4af',
                  background: isResolved ? '#f0fdf4' : '#ffffff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                        {item.elderly_name}
                      </h3>
                      <span
                        style={{
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          background: tierBadge.bg,
                          color: tierBadge.text,
                          border: `1px solid ${tierBadge.border}`
                        }}
                      >
                        {tierBadge.label}
                      </span>

                      {isResolved ? (
                        <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800, background: '#dcfce7', color: '#15803d' }}>
                          ✓ Resolved
                        </span>
                      ) : (
                        <span style={{ padding: '4px 10px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800, background: '#fee2e2', color: '#dc2626' }}>
                          ● Active Incident
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                      Hours Overdue: <strong style={{ color: '#b91c1c' }}>{item.hours_overdue ? `${Math.round(item.hours_overdue)}h` : 'Overdue'}</strong> • Scheduled Target: {item.scheduled_time || 'Daily Check-in'}
                    </div>
                  </div>

                  {!isResolved && (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleOpenResolveModal(item)}
                      style={{
                        background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: 700,
                        padding: '8px 16px',
                        borderRadius: '10px'
                      }}
                    >
                      <Check size={16} />
                      <span>Resolve Incident</span>
                    </button>
                  )}
                </div>

                {/* Escalation details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>PRIMARY CAREGIVER</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>{item.caregiver_name || 'Assigned Staff'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>EMERGENCY CONTACT</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>
                      {item.emergency_contact_name ? `${item.emergency_contact_name} (${item.emergency_contact_phone || 'N/A'})` : 'On Profile'}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, display: 'block' }}>LAST ESCALATED AT</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>
                      {new Date(item.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Log history of notifications dispatched */}
                {item.escalation_log && item.escalation_log.length > 0 && (
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '10px' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                      Escalation Action History
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {item.escalation_log.map((log, idx) => (
                        <div key={idx} style={{ fontSize: '0.825rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ArrowRight size={12} style={{ color: '#e11d48' }} />
                          <span>{log.message || log.action || JSON.stringify(log)}</span>
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                            ({new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resolution note display if resolved */}
                {isResolved && item.resolution_notes && (
                  <div style={{ marginTop: '12px', padding: '10px 14px', background: '#dcfce7', borderRadius: '10px', color: '#166534', fontSize: '0.86rem' }}>
                    <strong>Resolution Log:</strong> {item.resolution_notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Resolution Dialog Modal */}
      {resolvingItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            className="glass-card animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '520px',
              background: '#ffffff',
              borderRadius: '24px',
              padding: '30px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={24} style={{ color: '#059669' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#1e293b' }}>
                  Resolve Escalation: {resolvingItem.elderly_name}
                </h3>
              </div>
              <button
                onClick={() => setResolvingItem(null)}
                style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitResolution}>
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 14px 0' }}>
                Document the safety confirmation or welfare check outcome before closing this incident.
              </p>

              <div style={{ marginBottom: '18px' }}>
                <label className="form-label" style={{ fontWeight: 700 }}>Resolution Summary *</label>
                <textarea
                  className="form-input"
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Spoke with resident via telephone. Phone was muted earlier. Resident is feeling well and completed check-in."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setResolvingItem(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={resolving}
                  style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', fontWeight: 800 }}
                >
                  {resolving ? 'Closing Incident...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaregiverEscalationView;
