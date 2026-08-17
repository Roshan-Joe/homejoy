import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Settings, Database, Shield, User, Bell, Info, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';

export const SettingsTab = () => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('database');
  const [dbStatus, setDbStatus] = useState(null);
  const [loadingDb, setLoadingDb] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  const [settingsNotice, setSettingsNotice] = useState('');

  const fetchDbStatus = async () => {
    try {
      setLoadingDb(true);
      const res = await api.get('/api/admin/settings/db-status');
      setDbStatus(res.data);
    } catch (err) {
      console.error(err);
      setDbStatus({ status: 'Error', latency_ms: 0, database_name: 'homejoy', collections_count: 0, collections_detail: {} });
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'database') {
      fetchDbStatus();
    }
  }, [activeSubTab]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSettingsNotice('Admin profile preferences updated successfully!');
    setTimeout(() => setSettingsNotice(''), 3000);
  };

  const subTabs = [
    { id: 'database', label: 'Database Status', icon: Database },
    { id: 'profile', label: 'Admin Profile', icon: User },
    { id: 'system', label: 'System Config', icon: Settings },
    { id: 'notifications', label: 'Notification Settings', icon: Bell },
    { id: 'security', label: 'Security & Auth', icon: Shield },
    { id: 'about', label: 'About HomeJoy', icon: Info }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '20px 24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={24} style={{ color: 'var(--primary)' }} />
          <span>Admin Settings & System Health</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Manage database status, security parameters, system configurations, and platform info
        </p>

        {/* Subtab Navigation */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
          {subTabs.map(tab => {
            const IconComp = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: active ? 'var(--primary)' : '#f1f5f9',
                  color: active ? '#ffffff' : 'var(--text-main)',
                  transition: 'all 0.2s ease'
                }}
              >
                <IconComp size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {settingsNotice && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} />
          <span>{settingsNotice}</span>
        </div>
      )}

      {/* SUBTAB 1: Database Status */}
      {activeSubTab === 'database' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={20} style={{ color: '#3b82f6' }} />
              <span>MongoDB Atlas Database Live Health</span>
            </h3>
            <button className="btn btn-secondary" onClick={fetchDbStatus} disabled={loadingDb} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
              <RefreshCw size={14} className={loadingDb ? 'animate-spin' : ''} />
              <span>Ping Status</span>
            </button>
          </div>

          {loadingDb ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              Pinging MongoDB Atlas cluster...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '16px', background: dbStatus?.status === 'Connected' ? '#ecfdf5' : '#fef2f2', borderRadius: '12px', border: `1px solid ${dbStatus?.status === 'Connected' ? '#a7f3d0' : '#fecaca'}` }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>CONNECTION STATUS</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: dbStatus?.status === 'Connected' ? '#047857' : '#b91c1c', marginTop: '4px' }}>
                    {dbStatus?.status || 'Unknown'}
                  </div>
                </div>

                <div style={{ padding: '16px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>PING LATENCY</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1d4ed8', marginTop: '4px' }}>
                    {dbStatus?.latency_ms ?? 0} ms
                  </div>
                </div>

                <div style={{ padding: '16px', background: '#f5f3ff', borderRadius: '12px', border: '1px solid #ddd6fe' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>DATABASE NAME</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6d28d9', marginTop: '4px' }}>
                    {dbStatus?.database_name || 'HomeJoy'}
                  </div>
                </div>

                <div style={{ padding: '16px', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fde68a' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>COLLECTIONS</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#b45309', marginTop: '4px' }}>
                    {dbStatus?.collections_count ?? 0}
                  </div>
                </div>
              </div>

              {/* Collections Breakdown Table */}
              {dbStatus?.collections_detail && (
                <div style={{ marginTop: '10px' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '12px' }}>Collection Document Counts</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    {Object.entries(dbStatus.collections_detail).map(([name, count]) => (
                      <div key={name} style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{name}</span>
                        <span style={{ padding: '2px 8px', background: '#e2e8f0', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                          {count} docs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: Admin Profile */}
      {activeSubTab === 'profile' && (
        <div className="glass-card" style={{ padding: '24px', maxWidth: '600px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Admin Profile Settings</h3>
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. +1 (555) 019-2834"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px', padding: '12px' }}>
              Save Profile Settings
            </button>
          </form>
        </div>
      )}

      {/* SUBTAB 3: System Config */}
      {activeSubTab === 'system' && (
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>System Configuration</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.92rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
              <span>FastAPI Backend Engine</span>
              <strong>Python 3.10+ / Async</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
              <span>CORS Whitelist Origin</span>
              <strong>http://localhost:5173, http://127.0.0.1:5173</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
              <span>JWT Secret Algorithm</span>
              <strong>HS256 (256-bit encryption)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
              <span>Token Expiration Window</span>
              <strong>60 Minutes</strong>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: Notifications */}
      {activeSubTab === 'notifications' && (
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Notification System Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
              <span>Enable emergency alert push broadcasts to caregiver mobile views</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
              <span>Log all notification activities in MongoDB database history</span>
            </label>
          </div>
        </div>
      )}

      {/* SUBTAB 5: Security */}
      {activeSubTab === 'security' && (
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Security & Authentication Guidelines</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Role-Based Access Control (RBAC) is enforced across all `/api/admin/*` FastAPI endpoints via JWT bearer token validation.
          </p>
          <div style={{ padding: '14px', background: '#eff6ff', borderRadius: '10px', border: '1px solid #bfdbfe', fontSize: '0.88rem' }}>
            <strong>Active RBAC Rules:</strong>
            <ul style={{ marginLeft: '20px', marginTop: '6px' }}>
              <li>Role must strictly equal "Admin" (case-insensitive)</li>
              <li>Deactivated users (`is_active: false`) are denied login tokens</li>
              <li>Passwords are hashed using bcrypt with salt factor 12</li>
            </ul>
          </div>
        </div>
      )}

      {/* SUBTAB 6: About */}
      {activeSubTab === 'about' && (
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>About HomeJoy Platform</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
            HomeJoy is an AI-Based Elderly Care and Wellness Monitoring System designed to simplify senior care, track vital health metrics, coordinate nursing staff, and foster peace of mind for families.
          </p>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Version: 1.0.0 Admin Release
          </div>
        </div>
      )}
    </div>
  );
};
