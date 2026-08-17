import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { BarChart3, PieChart, Activity, RefreshCw, AlertCircle } from 'lucide-react';

export const AnalyticsTab = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/admin/analytics');
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
        Loading platform analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <AlertCircle size={18} />
        <span>{error}</span>
      </div>
    );
  }

  const roleData = analytics?.role_distribution || [];
  const totalRoleCount = roleData.reduce((acc, r) => acc + r.count, 0) || 1;
  const activeStatus = analytics?.active_status || { active: 0, inactive: 0 };
  const totalStatusCount = (activeStatus.active + activeStatus.inactive) || 1;
  const trendData = analytics?.registration_trend || [];
  const maxTrend = Math.max(...trendData.map(t => t.count), 5);

  const colors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={24} style={{ color: 'var(--primary)' }} />
            <span>Platform Analytics & Metrics</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Visual breakdown of registrations, user roles, and account activity status
          </p>
        </div>

        <button className="btn btn-secondary" onClick={fetchAnalytics} style={{ padding: '8px 14px' }}>
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* CHART 1: User Registration Trend */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} style={{ color: '#3b82f6' }} />
            <span>User Registration Trend</span>
          </h3>

          <div style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '16px', padding: '10px 0 20px 0', borderBottom: '2px solid #e2e8f0' }}>
            {trendData.map((item, idx) => {
              const heightPercent = Math.round((item.count / maxTrend) * 100);
              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#3b82f6' }}>
                    {item.count}
                  </span>
                  <div style={{
                    width: '100%',
                    maxWidth: '36px',
                    height: `${Math.max(12, heightPercent)}%`,
                    background: 'linear-gradient(180deg, #3b82f6 0%, #60a5fa 100%)',
                    borderRadius: '6px 6px 0 0',
                    transition: 'height 0.5s ease'
                  }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 2: User Role Distribution */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={18} style={{ color: '#8b5cf6' }} />
            <span>User Role Distribution</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
            {roleData.map((item, idx) => {
              const pct = Math.round((item.count / totalRoleCount) * 100);
              const color = colors[idx % colors.length];
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                      {item.role}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: color, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 3: Active vs Inactive Users */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: '#10b981' }} />
            <span>Active vs Inactive Accounts</span>
          </h3>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <div style={{ flex: 1, background: '#ecfdf5', padding: '16px', borderRadius: '14px', border: '1px solid #a7f3d0' }}>
              <div style={{ fontSize: '0.85rem', color: '#047857', fontWeight: 600 }}>ACTIVE</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#15803d', marginTop: '4px' }}>
                {activeStatus.active}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#047857', marginTop: '2px' }}>
                {Math.round((activeStatus.active / totalStatusCount) * 100)}% of total users
              </div>
            </div>

            <div style={{ flex: 1, background: '#fef2f2', padding: '16px', borderRadius: '14px', border: '1px solid #fecaca' }}>
              <div style={{ fontSize: '0.85rem', color: '#b91c1c', fontWeight: 600 }}>INACTIVE</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#991b1b', marginTop: '4px' }}>
                {activeStatus.inactive}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#b91c1c', marginTop: '2px' }}>
                {Math.round((activeStatus.inactive / totalStatusCount) * 100)}% of total users
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: '14px', background: '#fef2f2', borderRadius: '7px', overflow: 'hidden', display: 'flex' }}>
            <div style={{
              width: `${Math.round((activeStatus.active / totalStatusCount) * 100)}%`,
              height: '100%',
              background: '#10b981'
            }} />
            <div style={{
              width: `${Math.round((activeStatus.inactive / totalStatusCount) * 100)}%`,
              height: '100%',
              background: '#ef4444'
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};
