import React, { useState } from 'react';
import { Settings, Lock, Bell, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import caregiverPortalService from '../../services/caregiverPortalService';

export const CaregiverSettingsView = ({ onLogout }) => {
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSubmitting, setPwdSubmitting] = useState(false);

  const [prefs, setPrefs] = useState({
    high_risk_alerts: true,
    moderate_risk_alerts: true,
    missed_checkin_alerts: true,
    task_reminders: true
  });
  const [prefsMsg, setPrefsMsg] = useState('');

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdMsg('');
    setPwdError('');

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPwdError('New password and confirm password do not match.');
      return;
    }

    try {
      setPwdSubmitting(true);
      await caregiverPortalService.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      setPwdMsg('Your password was changed successfully.');
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      setTimeout(() => setPwdMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setPwdError(err.response?.data?.detail || 'Failed to change password. Please check your current password.');
    } finally {
      setPwdSubmitting(false);
    }
  };

  const handleTogglePref = async (key) => {
    const nextPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(nextPrefs);
    try {
      await caregiverPortalService.updateSettings(nextPrefs);
      setPrefsMsg('Notification preferences updated.');
      setTimeout(() => setPrefsMsg(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-card" style={{ padding: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 4px 0' }}>Caregiver Portal Settings</h1>
        <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0 }}>
          Manage your notification alerts, security credentials, and portal session.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* Notification Preferences Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Bell size={20} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Notification Alerts</h2>
          </div>

          {prefsMsg && (
            <div className="alert alert-success animate-fade-in" style={{ padding: '8px 12px', fontSize: '0.85rem', marginBottom: '12px' }}>
              <span>{prefsMsg}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { key: 'high_risk_alerts', label: 'High Risk Telemetry Alerts', desc: 'Receive immediate alerts when patient logs high risk indicators' },
              { key: 'moderate_risk_alerts', label: 'Moderate Risk Telemetry Alerts', desc: 'Receive warnings for moderate wellness score changes' },
              { key: 'missed_checkin_alerts', label: 'Missed Check-in Notifications', desc: 'Get notified when an assigned client misses today check-in' },
              { key: 'task_reminders', label: 'Task Due Reminders', desc: 'Receive reminders for daily care task deadlines' }
            ].map(item => (
              <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>{item.label}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.desc}</div>
                </div>

                <input
                  type="checkbox"
                  checked={prefs[item.key]}
                  onChange={() => handleTogglePref(item.key)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Change Password Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Lock size={20} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Security & Password</h2>
          </div>

          {pwdMsg && (
            <div className="alert alert-success animate-fade-in" style={{ padding: '8px 12px', fontSize: '0.85rem', marginBottom: '12px' }}>
              <span>{pwdMsg}</span>
            </div>
          )}

          {pwdError && (
            <div className="alert alert-error animate-fade-in" style={{ padding: '8px 12px', fontSize: '0.85rem', marginBottom: '12px' }}>
              <span>{pwdError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className="form-input"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                minLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                minLength={6}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={pwdSubmitting} style={{ marginTop: '8px' }}>
              {pwdSubmitting ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>

      </div>

      {/* Logout Action Card */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontWeight: 700, color: '#1e293b' }}>Account Session</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Log out of HomeJoy Caregiver Portal securely.</div>
        </div>

        <button className="btn btn-danger" onClick={onLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};
