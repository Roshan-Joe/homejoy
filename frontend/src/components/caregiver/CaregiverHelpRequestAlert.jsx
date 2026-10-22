import React, { useState } from 'react';
import { AlertTriangle, Clock, CheckCircle, ShieldAlert, X } from 'lucide-react';
import caregiverPortalService from '../../services/caregiverPortalService';

export const CaregiverHelpRequestAlert = ({ helpRequests = [], onStatusUpdated }) => {
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!helpRequests || helpRequests.length === 0) return null;

  const pendingRequests = helpRequests.filter(r => r.status === 'Pending' || r.status === 'Acknowledged');

  if (pendingRequests.length === 0) return null;

  const handleAcknowledge = async (requestId) => {
    try {
      setSubmitting(true);
      await caregiverPortalService.acknowledgeHelpRequest(requestId);
      onStatusUpdated && onStatusUpdated();
    } catch (err) {
      console.error('Failed to acknowledge help request:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveSubmit = async (requestId) => {
    try {
      setSubmitting(true);
      await caregiverPortalService.resolveHelpRequest(requestId, resolutionNote);
      setResolvingId(null);
      setResolutionNote('');
      onStatusUpdated && onStatusUpdated();
    } catch (err) {
      console.error('Failed to resolve help request:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ marginBottom: '24px' }}>
      {pendingRequests.map((req) => (
        <div
          key={req.id}
          style={{
            backgroundColor: req.status === 'Pending' ? '#fff1f2' : '#f0fdf4',
            border: req.status === 'Pending' ? '2px solid #fda4af' : '2px solid #86efac',
            borderRadius: '20px',
            padding: '20px 24px',
            marginBottom: '16px',
            boxShadow: req.status === 'Pending' ? '0 10px 25px rgba(225, 29, 72, 0.18)' : '0 4px 14px rgba(22, 163, 74, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                backgroundColor: req.status === 'Pending' ? '#ffe4e6' : '#dcfce7',
                color: req.status === 'Pending' ? '#e11d48' : '#16a34a',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <ShieldAlert size={26} className={req.status === 'Pending' ? 'animate-bounce' : ''} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    🚨 URGENT HELP REQUEST: {req.elderly_name}
                  </h3>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: 800, padding: '4px 10px', borderRadius: '12px',
                    backgroundColor: req.status === 'Pending' ? '#e11d48' : '#16a34a', color: '#ffffff'
                  }}>
                    {req.status.toUpperCase()}
                  </span>
                </div>

                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#9f1239', marginTop: '4px' }}>
                  Reason: "{req.reason}" {req.message ? `— ${req.message}` : ''}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {req.status === 'Pending' && (
                <button
                  onClick={() => handleAcknowledge(req.id)}
                  disabled={submitting}
                  className="btn btn-secondary btn-sm"
                  style={{ backgroundColor: '#ffffff', borderColor: '#f43f5e', color: '#be123c', fontWeight: 700 }}
                >
                  Acknowledge
                </button>
              )}

              {resolvingId === req.id ? (
                <button
                  onClick={() => setResolvingId(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
              ) : (
                <button
                  onClick={() => setResolvingId(req.id)}
                  className="btn btn-primary btn-sm"
                  style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', fontWeight: 700 }}
                >
                  Resolve Request
                </button>
              )}
            </div>
          </div>

          {/* Inline Resolution Note Form */}
          {resolvingId === req.id && (
            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #cbd5e1' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Resolution Note / Action Taken
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="e.g., Contacted resident via phone, assistance provided in person."
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem' }}
                />
                <button
                  onClick={() => handleResolveSubmit(req.id)}
                  disabled={submitting}
                  className="btn btn-primary btn-sm"
                  style={{ backgroundColor: '#16a34a', fontWeight: 700 }}
                >
                  Confirm Resolve
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
