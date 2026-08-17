import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import elderlyClientService from '../../services/elderlyClientService';
import { PageHeader } from './ElderlyProfilePage';

const TYPE_CONFIG = {
  announcement: { color: '#0284c7', bg: '#e0f2fe', emoji: '📢' },
  system: { color: '#6366f1', bg: '#e0e7ff', emoji: '⚙️' },
  reminder: { color: '#f59e0b', bg: '#fef3c7', emoji: '⏰' },
  alert: { color: '#ef4444', bg: '#fee2e2', emoji: '🚨' },
};

export const NotificationsPage = ({ onBack }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    elderlyClientService.getNotifications()
      .then(setNotifications)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader icon={<Bell size={22} />} title="Notifications" subtitle={`${notifications.length} message${notifications.length !== 1 ? 's' : ''} from your care team`} onBack={onBack} />

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="glass-card" style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔔</div>
          <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>No Notifications</h3>
          <p style={{ color: 'var(--text-muted)' }}>You have no messages right now. Check back later.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map(notif => {
            const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.announcement;
            return (
              <div key={notif.id} className="glass-card" style={{ padding: '18px 22px', borderLeft: `4px solid ${cfg.color}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                    {cfg.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{notif.title}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                        {new Date(notif.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>{notif.message}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
