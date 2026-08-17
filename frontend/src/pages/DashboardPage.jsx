import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, HeartPulse, Activity, ShieldCheck, UserCheck, Sparkles } from 'lucide-react';

export const DashboardPage = () => {
  const { user, logout } = useAuth();

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'Caregiver':
        return 'badge-caregiver';
      case 'Family Member':
        return 'badge-family';
      default:
        return 'badge-elderly';
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px 60px' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{
        padding: '32px 36px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
        border: '1px solid rgba(13, 148, 136, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            fontWeight: 700
          }}>
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Welcome back, {user?.full_name}!
              </h1>
              <span className={`badge ${getRoleBadgeClass(user?.role)}`}>
                {user?.role || 'Elderly'}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Logged in as <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user?.email}</span>
            </p>
          </div>
        </div>

        <button onClick={logout} className="btn btn-danger" style={{ padding: '10px 20px' }}>
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Grid Status Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        marginBottom: '36px'
      }}>
        {/* Card 1: AI Risk Prediction */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '10px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '12px' }}>
                <Sparkles size={22} />
              </div>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>AI Health Risk</span>
            </div>
            <span className="badge badge-elderly">Optimal</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-hover)', marginBottom: '4px' }}>
            Low Risk (12%)
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            AI Model analysis indicates stable overall health parameters today.
          </p>
        </div>

        {/* Card 2: Live Vitals */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '10px', background: 'var(--secondary-light)', color: 'var(--secondary)', borderRadius: '12px' }}>
                <Activity size={22} />
              </div>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>Heart Rate</span>
            </div>
            <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.85rem' }}>● Normal</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
            72 <span style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-muted)' }}>BPM</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Last synced 5 minutes ago from continuous sensor monitor.
          </p>
        </div>

        {/* Card 3: Caregiver Connection */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '10px', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: '12px' }}>
                <UserCheck size={22} />
              </div>
              <span style={{ fontWeight: 700, fontSize: '1rem' }}>Caregiver Sync</span>
            </div>
            <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.85rem' }}>Active</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
            Assigned Caregiver
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Direct helpline and 24/7 automated alert notifications active.
          </p>
        </div>
      </div>

      {/* System Details Box */}
      <div className="glass-card" style={{ padding: '32px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={22} color="var(--primary)" />
          <span>HomeJoy Account Details</span>
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>User ID</span>
            <span style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: '0.9rem' }}>{user?.id || 'N/A'}</span>
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>System Role</span>
            <span style={{ fontWeight: 600 }}>{user?.role || 'Elderly'}</span>
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>Auth Token Status</span>
            <span style={{ fontWeight: 600, color: 'var(--success)' }}>Valid JWT Session</span>
          </div>
        </div>
      </div>
    </div>
  );
};
