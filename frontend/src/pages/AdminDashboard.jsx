import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

import {
  LayoutDashboard, Users, HeartPulse, UserCheck, Stethoscope,
  BarChart3, Bell, Shield, Menu, X, RefreshCw
} from 'lucide-react';

import { AdminStatsCards } from '../components/admin/AdminStatsCards.jsx';
import { UserManagement } from './admin/UserManagement.jsx';
import { ElderlyManagement } from './admin/ElderlyManagement.jsx';
import { CaregiverManagement } from './admin/CaregiverManagement.jsx';
import { DoctorManagement } from './admin/DoctorManagement.jsx';
import { AnalyticsTab } from '../components/admin/AnalyticsTab.jsx';
import { NotificationsTab } from '../components/admin/NotificationsTab.jsx';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract active tab from URL path (e.g., /admin/elderly -> elderly)
  const pathParts = location.pathname.split('/').filter(Boolean);
  const activeTab = (pathParts.length > 1 && pathParts[0] === 'admin') ? pathParts[1] : 'dashboard';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      setStatsError('');
      const res = await api.get('/api/admin/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      setStatsError(err.response?.data?.detail || 'Could not validate admin credentials or fetch stats.');
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleNavClick = (tabId) => {
    if (tabId === 'dashboard') {
      navigate('/admin');
    } else {
      navigate(`/admin/${tabId}`);
    }
    setSidebarOpen(false);
  };

  const handleCardNavigate = (tab, param = '') => {
    if (tab === 'dashboard') {
      navigate('/admin');
    } else {
      navigate(`/admin/${tab}${param || ''}`);
    }
  };

  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard Overview', 
      icon: LayoutDashboard 
    },
    { 
      id: 'users', 
      label: 'User Directory', 
      icon: Users 
    },
    { 
      id: 'elderly', 
      label: 'Elderly Residents', 
      icon: HeartPulse,
      badge: stats?.unassigned_clients_count > 0 ? `${stats.unassigned_clients_count} Unassigned` : null,
      badgeColor: '#dc2626',
      badgeBg: '#fef2f2'
    },
    { 
      id: 'caregivers', 
      label: 'Caregivers & Staff', 
      icon: UserCheck,
      badge: stats?.caregivers_at_capacity_count > 0 ? `${stats.caregivers_at_capacity_count} at max` : null,
      badgeColor: '#d97706',
      badgeBg: '#fffbeb'
    },
    { 
      id: 'doctors', 
      label: 'Doctor Directory', 
      icon: Stethoscope 
    },
    { 
      id: 'analytics', 
      label: 'System Analytics', 
      icon: BarChart3 
    },
    { 
      id: 'notifications', 
      label: 'Alerts & Help', 
      icon: Bell,
      badge: stats?.open_help_requests_count > 0 ? `${stats.open_help_requests_count} open` : null,
      badgeColor: '#7c3aed',
      badgeBg: '#f5f3ff'
    },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminStatsCards stats={stats} loading={loadingStats} onNavigateTab={handleCardNavigate} />;
      case 'users':
        return <UserManagement />;
      case 'elderly':
        return <ElderlyManagement />;
      case 'caregivers':
        return <CaregiverManagement />;
      case 'doctors':
        return <DoctorManagement />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'notifications':
        return <NotificationsTab />;
      default:
        return <AdminStatsCards stats={stats} loading={loadingStats} onNavigateTab={handleCardNavigate} />;
    }
  };

  return (
    <div className="scrim-bg-wrapper page-bg-admin" style={{ padding: '24px 0 60px 0' }}>
      <div className="scrim-content container">
        {/* Top Header Card */}
        <div className="card glass-card" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Tablet / Mobile Hamburger Toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="btn btn-secondary btn-sm admin-mobile-toggle"
              aria-label="Toggle navigation menu"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={22} style={{ color: 'var(--primary)' }} />
                <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                  Admin Portal Console
                </h1>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: 0 }}>
                Administrator: <strong style={{ color: 'var(--text-main)' }}>{user?.full_name || 'Admin'}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={fetchStats}
            className="btn btn-secondary btn-sm"
            title="Refresh Dashboard Stats"
          >
            <RefreshCw size={16} className={loadingStats ? 'animate-spin' : ''} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Backdrop for Tablet Drawer */}
        {sidebarOpen && (
          <div
            className="admin-backdrop"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Main Grid */}
        <div className="admin-layout">
          {/* Navigation Sidebar / Tablet Drawer */}
          <aside className={`card admin-sidebar admin-sidebar-drawer ${sidebarOpen ? 'open' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div className="admin-sidebar-label" style={{ margin: 0 }}>
                ADMIN NAVIGATION
              </div>
              {sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  aria-label="Close sidebar"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <nav className="admin-nav" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {navItems.map((item) => {
                const IconComp = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`admin-nav-item ${active ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      background: active ? 'var(--primary-glow)' : 'transparent',
                      color: active ? 'var(--primary)' : 'var(--text-main)',
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <IconComp size={18} style={{ color: active ? 'var(--primary)' : 'var(--text-muted)' }} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          backgroundColor: item.badgeBg || '#fee2e2',
                          color: item.badgeColor || '#dc2626',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Tab Content Body */}
          <main style={{ minWidth: 0 }}>
            {renderActiveTab()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
