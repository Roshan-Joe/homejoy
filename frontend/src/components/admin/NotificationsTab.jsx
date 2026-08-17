import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Bell, AlertTriangle, Megaphone, Clock, Send, Trash2, ShieldAlert, CheckCircle } from 'lucide-react';

export const NotificationsTab = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    message: '',
    type: 'announcement',
    target_role: 'all'
  });

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/notifications/history');
      setHistory(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to fetch notification history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessageSuccess('');

    if (!form.title || !form.message) {
      setError('Please provide title and message.');
      return;
    }

    try {
      setSending(true);
      const res = await api.post('/api/admin/notifications', form);
      setMessageSuccess(`Notification "${res.data.title}" broadcasted successfully!`);
      setForm({ title: '', message: '', type: 'announcement', target_role: 'all' });
      setHistory(prev => [res.data, ...prev]);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to send notification.');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/admin/notifications/${id}`);
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete notification log.');
    }
  };

  const setEmergencyPreset = () => {
    setForm({
      title: '🚨 EMERGENCY ALERT: Extreme Weather / Heatwave Warning',
      message: 'All caregivers and senior residents please remain indoors. Emergency support team is on standby.',
      type: 'emergency',
      target_role: 'all'
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={24} style={{ color: 'var(--primary)' }} />
          <span>Notifications & Emergency Broadcasting</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Dispatch system announcements and high-priority emergency alerts to HomeJoy users
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Broadcast Form */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Megaphone size={20} style={{ color: 'var(--primary)' }} />
              <span>Send New Broadcast</span>
            </h3>

            <button
              type="button"
              className="btn btn-danger"
              onClick={setEmergencyPreset}
              style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <ShieldAlert size={14} />
              <span>Preset Emergency</span>
            </button>
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {messageSuccess && (
            <div className="alert alert-success" style={{ marginBottom: '16px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
              <CheckCircle size={16} />
              <span>{messageSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Notification Type</label>
              <select
                className="form-select"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="announcement">📢 Announcement (Normal Priority)</option>
                <option value="emergency">🚨 Emergency Alert (High Priority)</option>
                <option value="system">⚙️ System Update</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Audience Role</label>
              <select
                className="form-select"
                value={form.target_role}
                onChange={(e) => setForm({ ...form, target_role: e.target.value })}
              >
                <option value="all">Everyone (All Users)</option>
                <option value="Elderly">Senior Residents (Elderly)</option>
                <option value="Caregiver">Caregivers & Nurses</option>
                <option value="Family Member">Family Members</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Title / Headline</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Scheduled Maintenance Notice"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notification Message</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Enter complete detailed message..."
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                style={{ resize: 'vertical' }}
              />
            </div>

            <button
              type="submit"
              className={form.type === 'emergency' ? 'btn btn-danger btn-full' : 'btn btn-primary btn-full'}
              disabled={sending}
              style={{ padding: '12px', marginTop: '6px' }}
            >
              <Send size={16} />
              <span>{sending ? 'Broadcasting...' : form.type === 'emergency' ? 'Send Emergency Alert' : 'Send Announcement'}</span>
            </button>
          </form>
        </div>

        {/* History Timeline */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={20} style={{ color: 'var(--text-muted)' }} />
            <span>Broadcast History</span>
          </h3>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              Loading broadcast history...
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              No notifications sent yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '420px', overflowY: 'auto' }}>
              {history.map((item) => {
                const isEmergency = item.type === 'emergency';
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '12px',
                      background: isEmergency ? '#fef2f2' : '#f8fafc',
                      border: isEmergency ? '1px solid #fecaca' : '1px solid #e2e8f0',
                      display: 'flex',
                      justifySpace: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '8px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: isEmergency ? '#dc2626' : '#3b82f6',
                          color: '#ffffff'
                        }}>
                          {item.type}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          To: {item.target_role}
                        </span>
                      </div>
                      <h4 style={{ fontWeight: 700, fontSize: '0.95rem', color: isEmergency ? '#991b1b' : 'var(--text-main)' }}>
                        {item.title}
                      </h4>
                      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {item.message}
                      </p>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        Sent at: {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'} by {item.created_by}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      title="Delete log"
                    >
                      <Trash2 size={16} />
                    </button>
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
