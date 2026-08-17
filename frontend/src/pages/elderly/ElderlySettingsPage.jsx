import React, { useState, useEffect } from 'react';
import { Settings, Bell, Lock, LogOut, ChevronRight, Save } from 'lucide-react';
import elderlyClientService from '../../services/elderlyClientService';
import { PageHeader } from './ElderlyProfilePage';

export const ElderlySettingsPage = ({ onBack, onLogout }) => {
  const [prefs, setPrefs] = useState({ checkin_reminder: true, medication_reminder: true });
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsSuccess, setPrefsSuccess] = useState('');

  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    elderlyClientService.getProfile()
      .then(data => setPrefs(data.notification_prefs || { checkin_reminder: true, medication_reminder: true }))
      .catch(() => {})
      .finally(() => setLoadingPrefs(false));
  }, []);

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    setPrefsSuccess('');
    try {
      await elderlyClientService.updateNotificationPrefs(prefs);
      setPrefsSuccess('Preferences saved!');
    } catch { }
    finally { setSavingPrefs(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError('New passwords do not match.'); return;
    }
    if (pwForm.new_password.length < 6) {
      setPwError('New password must be at least 6 characters.'); return;
    }
    setPwSaving(true);
    try {
      await elderlyClientService.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password });
      setPwSuccess('Password changed successfully!');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
      setShowPw(false);
    } catch (err) {
      setPwError(err.response?.data?.detail || 'Could not change password. Please check your current password.');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader icon={<Settings size={22} />} title="Settings" subtitle="Manage your account preferences" onBack={onBack} />

      {/* Notification Preferences */}
      <div className="glass-card" style={{ padding: '24px 28px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} color="var(--primary)" /> Notification Preferences
        </h2>
        {loadingPrefs ? <div style={{ color: 'var(--text-muted)' }}>Loading...</div> : (
          <>
            {[
              { key: 'checkin_reminder', label: 'Daily Check-In Reminder', desc: 'Remind me to complete my wellness check-in each day' },
              { key: 'medication_reminder', label: 'Medication Reminder', desc: 'Remind me about my medication schedule' },
            ].map(({ key, label, desc }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #f1f5f9', gap: '16px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{label}</div>
                  <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '4px' }}>{desc}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPrefs(p => ({ ...p, [key]: !p[key] }))}
                  aria-label={`Toggle ${label}`}
                  style={{
                    width: '60px', height: '34px', borderRadius: '9999px', border: 'none',
                    background: prefs[key] ? '#0d9488' : '#cbd5e1',
                    cursor: 'pointer', transition: 'background 0.2s', position: 'relative', flexShrink: 0
                  }}
                >
                  <span style={{
                    position: 'absolute', top: '4px', width: '26px', height: '26px', borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s', left: prefs[key] ? '30px' : '4px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.25)'
                  }} />
                </button>
              </div>
            ))}
            {prefsSuccess && <div className="alert alert-success" style={{ marginTop: '14px', fontSize: '1rem' }}>✓ {prefsSuccess}</div>}
            <div style={{ marginTop: '20px' }}>
              <button className="btn btn-primary" onClick={handleSavePrefs} disabled={savingPrefs} style={{ width: '100%', minHeight: '56px', fontSize: '1.05rem', fontWeight: 800, borderRadius: '14px' }}>
                {savingPrefs ? 'Saving…' : '💾  Save Preferences'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Change Password */}
      <div className="glass-card" style={{ padding: '24px 28px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setShowPw(o => !o)}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={18} color="var(--primary)" /> Change Password
          </h2>
          <ChevronRight size={18} color="var(--text-muted)" style={{ transform: showPw ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </div>
        {showPw && (
          <form onSubmit={handleChangePassword} style={{ marginTop: '20px' }}>
            {pwError && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{pwError}</div>}
            {pwSuccess && <div className="alert alert-success" style={{ marginBottom: '16px' }}>✓ {pwSuccess}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>Current Password</label>
                <input className="form-input" type="password" required value={pwForm.current_password} onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} style={{ fontSize: '1rem', minHeight: '56px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>New Password</label>
                <input className="form-input" type="password" required minLength={6} value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} placeholder="At least 6 characters" style={{ fontSize: '1rem', minHeight: '56px' }} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '1rem', fontWeight: 700 }}>Confirm New Password</label>
                <input className="form-input" type="password" required value={pwForm.confirm_password} onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))} style={{ fontSize: '1rem', minHeight: '56px' }} />
              </div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary" disabled={pwSaving} style={{ width: '100%', minHeight: '56px', fontSize: '1.05rem', fontWeight: 800, borderRadius: '14px' }}>
                {pwSaving ? 'Changing…' : '🔒  Change My Password'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Sign Out */}
      <div className="glass-card" style={{ padding: '24px 28px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LogOut size={18} color="#dc2626" /> Sign Out
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '16px' }}>Sign out of your HomeJoy wellness account.</p>
        <button className="btn btn-danger" onClick={onLogout} style={{ width: '100%', minHeight: '56px', fontSize: '1.05rem', fontWeight: 800, borderRadius: '14px' }}>
          <LogOut size={18} /> Sign Out of HomeJoy
        </button>
      </div>
    </div>
  );
};
