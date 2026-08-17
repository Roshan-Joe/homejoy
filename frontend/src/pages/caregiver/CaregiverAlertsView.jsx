import React, { useState, useEffect } from 'react';
import { Bell, ShieldAlert, AlertTriangle, CheckCircle2, Filter, Search, ChevronRight } from 'lucide-react';
import caregiverPortalService from '../../services/caregiverPortalService';

export const CaregiverAlertsView = ({ onSelectElderly }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [resolveModalAlert, setResolveModalAlert] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await caregiverPortalService.getAlerts({
        severity: severityFilter,
        status: statusFilter
      });
      setAlerts(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, statusFilter]);

  const handleAcknowledge = async (alertId) => {
    try {
      await caregiverPortalService.acknowledgeAlert(alertId);
      setActionSuccess('Alert acknowledged successfully.');
      setTimeout(() => setActionSuccess(''), 3000);
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!resolveModalAlert) return;

    try {
      await caregiverPortalService.resolveAlert(resolveModalAlert.id, resolutionNote);
      setActionSuccess('Alert resolved and archived with resolution note.');
      setTimeout(() => setActionSuccess(''), 3000);
      setResolveModalAlert(null);
      setResolutionNote('');
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Caregiver Telemetry Alerts</h1>
            <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '4px 0 0 0' }}>
              Real-time warnings triggered by high/moderate risk check-ins, missed check-ins, or telemetry anomalies.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ minWidth: '160px' }}>
            <select
              className="form-input"
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="all">All Severities</option>
              <option value="high">High Severity</option>
              <option value="moderate">Moderate Severity</option>
              <option value="info">Info / Reminder</option>
            </select>
          </div>

          <div style={{ minWidth: '160px' }}>
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="new">New / Unread</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {actionSuccess && (
        <div className="alert alert-success animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Alerts List */}
      {loading ? (
        <div className="glass-card" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
          Loading caregiver alerts...
        </div>
      ) : alerts.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
          <Bell size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 600 }}>No telemetry alerts match your criteria</h3>
          <p style={{ fontSize: '0.88rem', margin: 0 }}>All assigned elderly clients are within normal parameters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {alerts.map((a) => {
            const isHigh = a.severity === 'High';
            const isMod = a.severity === 'Moderate';
            return (
              <div
                key={a.id}
                className="glass-card"
                style={{
                  padding: '20px',
                  borderLeft: isHigh ? '5px solid #ef4444' : (isMod ? '5px solid #f59e0b' : '5px solid #3b82f6'),
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px'
                }}
              >
                <div style={{ flex: 1, minWidth: '260px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                      background: isHigh ? '#fee2e2' : (isMod ? '#fef3c7' : '#dbeafe'),
                      color: isHigh ? '#b91c1c' : (isMod ? '#b45309' : '#1e40af'),
                      textTransform: 'uppercase'
                    }}>
                      {a.severity}
                    </span>

                    <span style={{
                      padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600,
                      background: a.status === 'Resolved' ? '#d1fae5' : (a.status === 'Acknowledged' ? '#e0e7ff' : '#fef2f2'),
                      color: a.status === 'Resolved' ? '#047857' : (a.status === 'Acknowledged' ? '#3730a3' : '#dc2626')
                    }}>
                      {a.status}
                    </span>

                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                      {a.created_at ? new Date(a.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 4px 0', color: '#1e293b' }}>
                    {a.title} ({a.elderly_name})
                  </h3>

                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
                    {a.reason || a.message}
                  </p>

                  {a.resolution_note && (
                    <div style={{ marginTop: '8px', fontSize: '0.83rem', color: '#047857', background: '#f0fdf4', padding: '6px 10px', borderRadius: '6px' }}>
                      <strong>Resolution Note:</strong> {a.resolution_note}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem', padding: '8px 14px' }}
                    onClick={() => onSelectElderly(a.elderly_id)}
                  >
                    View Patient
                  </button>

                  {a.status === 'New' && (
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: '0.85rem', padding: '8px 14px', color: '#2563eb', borderColor: '#93c5fd' }}
                      onClick={() => handleAcknowledge(a.id)}
                    >
                      Acknowledge
                    </button>
                  )}

                  {a.status !== 'Resolved' && (
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: '0.85rem', padding: '8px 14px', background: '#059669', borderColor: '#059669' }}
                      onClick={() => setResolveModalAlert(a)}
                    >
                      Resolve Alert
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolution Modal */}
      {resolveModalAlert && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '480px', padding: '28px', background: '#fff' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 12px 0' }}>
              Resolve Alert: {resolveModalAlert.elderly_name}
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 16px 0' }}>
              Add an optional resolution note explaining the action taken (e.g., patient contacted, dose verified, fall risk addressed).
            </p>

            <form onSubmit={handleResolveSubmit}>
              <div className="form-group">
                <label className="form-label">Resolution Note</label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="e.g. Spoke with patient on phone. Confirmed medicine taken at 10:30 AM."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setResolveModalAlert(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#059669', borderColor: '#059669' }}>
                  Save & Resolve Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
