import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

import {
  LayoutDashboard, Users, HeartPulse, UserCheck, BarChart3,
  Bell, Settings, Shield, Menu, X, RefreshCw, Lock, Stethoscope, HeartHandshake
} from 'lucide-react';

import { AdminStatsCards } from '../components/admin/AdminStatsCards.jsx';
import { UserManagementTab } from '../components/admin/UserManagementTab.jsx';
import { RoleManagement } from './admin/RoleManagement.jsx';
import { ElderlyManagementTab } from '../components/admin/ElderlyManagementTab.jsx';
import { CaregiverManagementTab } from '../components/admin/CaregiverManagementTab.jsx';
import { DoctorManagement } from './admin/DoctorManagement.jsx';
import { FamilyManagement } from './admin/FamilyManagement.jsx';
import { AnalyticsTab } from '../components/admin/AnalyticsTab.jsx';
import { NotificationsTab } from '../components/admin/NotificationsTab.jsx';
import { SettingsTab } from '../components/admin/SettingsTab.jsx';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
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

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Directory', icon: Users },
    { id: 'roles', label: 'Role & RBAC Matrix', icon: Lock },
    { id: 'elderly', label: 'Elderly Residents', icon: HeartPulse },
    { id: 'caregivers', label: 'Caregivers & Nurses', icon: UserCheck },
    { id: 'doctors', label: 'Physicians & Doctors', icon: Stethoscope },
    { id: 'family', label: 'Family Associations', icon: HeartHandshake },
    { id: 'analytics', label: 'System Analytics', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications & Alerts', icon: Bell },
    { id: 'settings', label: 'Settings & DB Health', icon: Settings },
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminStatsCards stats={stats} loading={loadingStats} onNavigateTab={(tab) => setActiveTab(tab)} />;
      case 'users':
        return <UserManagementTab />;
      case 'roles':
        return <RoleManagement />;
      case 'elderly':
        return <ElderlyManagementTab />;
      case 'caregivers':
        return <CaregiverManagementTab />;
      case 'doctors':
        return <DoctorManagement />;
      case 'family':
        return <FamilyManagement />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <AdminStatsCards stats={stats} loading={loadingStats} onNavigateTab={(tab) => setActiveTab(tab)} />;
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
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'none' }}
            aria-label="Toggle navigation menu"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={22} style={{ color: 'var(--primary)' }} />
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                Admin Portal Console
              </h1>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
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

      {/* Main Grid */}
      <div className="admin-layout" style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Navigation Sidebar */}
        <aside className="card admin-sidebar">
          <div className="admin-sidebar-label">
            MODULE NAVIGATION
          </div>

          <nav className="admin-nav">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`admin-nav-item ${active ? 'active' : ''}`}
                >
                  <IconComp size={18} className="admin-nav-icon" />
                  <span>{item.label}</span>
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

