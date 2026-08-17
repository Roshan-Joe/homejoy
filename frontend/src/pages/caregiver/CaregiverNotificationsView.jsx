import React, { useState, useEffect } from 'react';
import { Bell, ShieldAlert, CheckCircle2, Info, Clock } from 'lucide-react';
import caregiverPortalService from '../../services/caregiverPortalService';

export const CaregiverNotificationsView = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await caregiverPortalService.getNotifications();
        setNotifications(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-card" style={{ padding: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 4px 0' }}>Caregiver Notifications</h1>
        <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
          System alerts, check-in telemetry updates, and task reminders for your caregiver account.
        </p>
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center', color: '#64748b' }}>
          <Bell size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: 600 }}>No notifications</h3>
          <p style={{ fontSize: '0.88rem', margin: 0 }}>Your notification inbox is clean.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              className="glass-card"
              style={{
                padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '14px',
                borderLeft: n.type === 'alert' ? '4px solid #ef4444' : '4px solid var(--primary)'
              }}
            >
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: n.type === 'alert' ? '#fee2e2' : 'var(--primary-light)',
                color: n.type === 'alert' ? '#b91c1c' : 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                {n.type === 'alert' ? <ShieldAlert size={20} /> : <Bell size={20} />}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#1e293b' }}>{n.title}</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {n.created_at ? new Date(n.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
                <div style={{ fontSize: '0.88rem', color: '#475569' }}>{n.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
