import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  Bell, AlertTriangle, Megaphone, Clock, Send, Trash2,
  ShieldAlert, CheckCircle, ExternalLink, Check, Eye
} from 'lucide-react';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';

export const NotificationsTab = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'announcement',
    target_role: 'all',
    client_name: ''
  });

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/notifications/history');
      setHistory(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch notification history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      toast.warning('Please provide a notification title and message.');
      return;
    }

    try {
      setSending(true);
      const res = await api.post('/api/admin/notifications', {
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        target_role: form.target_role,
        client_name: form.client_name ? form.client_name.trim() : null
      });

      toast.success(`Broadcast "${res.data.title}" dispatched successfully!`);
      setForm({ title: '', message: '', type: 'announcement', target_role: 'all', client_name: '' });
      setHistory((prev) => [res.data, ...prev]);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to dispatch notification.');
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/api/admin/notifications/${id}/read`);
      setHistory((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
      );
      toast.info('Notification marked as read.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update read status.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/admin/notifications/${id}`);
      setHistory((prev) => prev.filter((item) => item.id !== id));
      toast.success('Notification log removed.');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to delete notification log.');
    }
  };

  const setEmergencyPreset = () => {
    setForm({
      title: '🚨 EMERGENCY ALERT: Extreme Weather / Heatwave Advisory',
      message: 'All caregivers and senior residents please remain indoors. Hydration rounds must be verified in the care portal.',
      type: 'emergency',
      target_role: 'all',
      client_name: ''
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="card glass-card" style={{ padding: '20px 24px' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={24} style={{ color: 'var(--primary)' }} />
          <span>Notifications, Telemetry Alerts & Broadcasting</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: '2px 0 0 0' }}>
          Real-time emergency telemetry, unassigned urgent help requests, and system-wide broadcast logs
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
        {/* Broadcast Creation Form */}
        <div className="card glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Megaphone size={20} style={{ color: 'var(--primary)' }} />
              <span>Send New Broadcast</span>
            </h3>

            <button
              type="button"
              className="btn btn-sm"
              style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontSize: '0.78rem', fontWeight: 700 }}
              onClick={setEmergencyPreset}
            >
              Emergency Preset
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.86rem' }}>
                Notification Title
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. System Maintenance or Weather Warning"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.86rem' }}>
                  Target Audience
                </label>
                <select
                  className="form-select"
                  value={form.target_role}
                  onChange={(e) => setForm({ ...form, target_role: e.target.value })}
                >
                  <option value="all">Broadcast to All Users</option>
                  <option value="Elderly">Elderly Residents Only</option>
                  <option value="Caregiver">Caregiver Staff Only</option>
                  <option value="Doctor">Physicians / Doctors</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '0.86rem' }}>
                  Severity Type
                </label>
                <select
                  className="form-select"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="announcement">Announcement (General)</option>
                  <option value="emergency">Emergency Alert (High Priority)</option>
                  <option value="system">System Notification</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.86rem' }}>
                Related Resident Name (Optional direct profile link)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Margaret Thompson"
                value={form.client_name}
                onChange={(e) => setForm({ ...form, client_name: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.86rem' }}>
                Detailed Message Content
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Write the full message to be delivered into patient and staff dashboards..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={sending}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}
            >
              <Send size={16} />
              <span>{sending ? 'Dispatching Broadcast...' : 'Dispatch Broadcast'}</span>
            </button>
          </form>
        </div>

        {/* Live Notification & Emergency Logs */}
        <div className="card glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} style={{ color: 'var(--primary)' }} />
              <span>Broadcast & Telemetry Log</span>
            </h3>

            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {history.length} events logged
            </span>
          </div>

          {loading ? (
            <LoadingState message="Loading notification logs..." />
          ) : history.length === 0 ? (
            <EmptyState
              title="No alerts logged"
              description="No broadcast or emergency alert history recorded."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '520px', overflowY: 'auto' }}>
              {history.map((item) => {
                const isEmergency = item.type === 'emergency';
                const isUnread = !item.is_read;

                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      backgroundColor: isUnread ? (isEmergency ? '#fff1f2' : '#f0f9ff') : '#ffffff',
                      border: isUnread
                        ? (isEmergency ? '1.5px solid rgba(220, 38, 38, 0.4)' : '1.5px solid rgba(2, 132, 199, 0.35)')
                        : '1px solid var(--border-subtle, #e2e8f0)',
                      boxShadow: isUnread ? '0 4px 12px rgba(0,0,0,0.04)' : 'none',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isEmergency ? (
                          <ShieldAlert size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
                        ) : (
                          <Megaphone size={18} style={{ color: '#0284c7', flexShrink: 0 }} />
                        )}
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-main)' }}>
                          {item.title}
                        </strong>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isUnread && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#dc2626', color: '#ffffff' }}>
                            UNREAD
                          </span>
                        )}
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: isEmergency ? '#fee2e2' : '#f1f5f9',
                          color: isEmergency ? '#b91c1c' : 'var(--text-muted)'
                        }}>
                          {item.target_role || 'All'}
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.86rem', color: 'var(--text-main)', margin: '8px 0 10px 0', lineHeight: 1.45 }}>
                      {item.message}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '8px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>Logged by {item.created_by || 'Admin'}</span>
                        <span>•</span>
                        <span>{item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Direct Client Profile Link */}
                        {(item.client_name || item.client_id) && (
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{
                              backgroundColor: '#e0f2fe',
                              color: '#0284c7',
                              border: 'none',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            onClick={() => {
                              navigate(`/admin/elderly?search=${encodeURIComponent(item.client_name || '')}`);
                            }}
                          >
                            <ExternalLink size={12} />
                            <span>Resident Profile</span>
                          </button>
                        )}

                        {/* Mark As Read */}
                        {isUnread && (
                          <button
                            type="button"
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--primary)',
                              fontSize: '0.76rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                            onClick={() => handleMarkAsRead(item.id)}
                            title="Mark as reviewed"
                          >
                            <Check size={13} /> Read
                          </button>
                        )}

                        <button
                          type="button"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '2px'
                          }}
                          onClick={() => handleDelete(item.id)}
                          title="Delete notification entry"
                          aria-label="Delete entry"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsTab;
