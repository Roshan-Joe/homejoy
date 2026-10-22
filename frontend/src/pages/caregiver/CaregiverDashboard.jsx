import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import caregiverPortalService from '../../services/caregiverPortalService';
import { CaregiverHomeView } from './CaregiverHomeView';
import { CaregiverElderlyListView } from './CaregiverElderlyListView';
import { CaregiverElderlyDetailView } from './CaregiverElderlyDetailView';
import { CaregiverAlertsView } from './CaregiverAlertsView';
import { CaregiverTasksView } from './CaregiverTasksView';
import { CaregiverReportsView } from './CaregiverReportsView';
import { CaregiverNotificationsView } from './CaregiverNotificationsView';
import { CaregiverProfileView } from './CaregiverProfileView';
import { CaregiverSettingsView } from './CaregiverSettingsView';
import { LoadingState } from '../../components/common/LoadingState';
import { ErrorState } from '../../components/common/ErrorState';

import {
  LayoutDashboard, Users, Bell, CheckCircle2, FileText, User, Settings,
  ShieldAlert, HeartPulse
} from 'lucide-react';

import { CaregiverHelpRequestAlert } from '../../components/caregiver/CaregiverHelpRequestAlert';
import { CaregiverHandoverView } from './CaregiverHandoverView';
import { CaregiverEscalationView } from './CaregiverEscalationView';
import NotificationService from '../../services/NotificationService';
import { ClipboardList, AlertTriangle } from 'lucide-react';

export const CaregiverDashboard = () => {
  const { user, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedElderlyId, setSelectedElderlyId] = useState(null);

  const [dashboardData, setDashboardData] = useState(null);
  const [helpRequests, setHelpRequests] = useState([]);
  const [activeEscalationsCount, setActiveEscalationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(() => {
    try {
      const supported = typeof NotificationService?.isSupported === 'function'
        ? NotificationService.isSupported()
        : Boolean(NotificationService?.isSupported);
      return Boolean(supported && typeof Notification !== 'undefined' && Notification.permission === 'default');
    } catch {
      return false;
    }
  });

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [res, escalations] = await Promise.all([
        caregiverPortalService.getDashboard(),
        caregiverPortalService.getEscalations('active').catch(() => [])
      ]);
      setDashboardData(res);
      setActiveEscalationsCount(escalations?.length || 0);
    } catch (err) {
      console.error(err);
      setError('Failed to load caregiver dashboard metrics. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHelpRequests = useCallback(async () => {
    try {
      const requests = await caregiverPortalService.getHelpRequests({ status: 'all' });
      const pending = requests.filter(r => r.status === 'pending');
      if (pending.length > 0) {
        pending.forEach(p => {
          NotificationService.notifyUrgentHelpRequest(p.elderly_name, p.category);
        });
      }
      setHelpRequests(requests);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    loadHelpRequests();
    const interval = setInterval(() => {
      loadHelpRequests();
    }, 10000); // 10s live update auto-poll
    return () => clearInterval(interval);
  }, [loadDashboardData, loadHelpRequests]);

  const handleSelectElderly = (elderlyId) => {
    setSelectedElderlyId(elderlyId);
    setCurrentTab('elderly-detail');
  };

  const handleBackToList = () => {
    setSelectedElderlyId(null);
    setCurrentTab('assigned-elderly');
  };

  const handleSendReminder = async (elderlyId) => {
    await caregiverPortalService.sendCheckinReminder(elderlyId);
    loadDashboardData();
  };

  const handleAcknowledgeAlert = async (alertId) => {
    await caregiverPortalService.acknowledgeAlert(alertId);
    loadDashboardData();
  };

  const handleResolveAlert = async (alertId) => {
    await caregiverPortalService.resolveAlert(alertId, 'Resolved from dashboard overview.');
    loadDashboardData();
  };

  const alertBadgeCount = dashboardData?.summary?.unresolved_alerts_count || 0;

  const navItems = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assigned-elderly', label: 'Assigned Elderly', icon: Users, badge: dashboardData?.summary?.total_assigned },
    { id: 'alerts', label: 'Alerts', icon: ShieldAlert, badge: alertBadgeCount, badgeColor: 'badge-alert-new' },
    { id: 'escalations', label: 'Escalations', icon: AlertTriangle, badge: activeEscalationsCount, badgeColor: 'badge-alert-new' },
    { id: 'handover', label: 'Handover Notes', icon: ClipboardList },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle2, badge: dashboardData?.pending_tasks?.length },
    { id: 'reports', label: 'Care Reports', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="scrim-bg-wrapper page-bg-caregiver" style={{ padding: '24px 0 60px 0' }}>
      <div className="scrim-overlay-subtle" />
      <div className="scrim-content container">
        
        {/* Top Navigation Bar */}
        <div className="card glass-card" style={{

        padding: '14px 24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <HeartPulse size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              HomeJoy Caregiver Triage
            </div>
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              Caregiver: <strong style={{ color: 'var(--text-main)' }}>{user?.full_name || user?.name || 'Caregiver Staff'}</strong>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id || (currentTab === 'elderly-detail' && item.id === 'assigned-elderly');
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'assigned-elderly') {
                    setSelectedElderlyId(null);
                  }
                  setCurrentTab(item.id);
                }}
                className={`btn btn-sm ${active ? 'btn-primary' : 'btn-ghost'}`}
                style={{ whiteSpace: 'nowrap' }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className={`badge ${active ? 'badge-role-admin' : item.badgeColor || 'badge-alert-ack'}`} style={{ fontSize: '0.7rem' }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main View Area */}
      {loading && !dashboardData ? (
        <LoadingState message="Loading Caregiver Triage Console..." size="lg" />
      ) : error ? (
        <ErrorState
          title="Caregiver Portal Error"
          message={error}
          onRetry={loadDashboardData}
        />
      ) : (
        <>
          {/* Web Push Notification Prompt Banner */}
          {showNotificationPrompt && (
            <div
              style={{
                marginBottom: '16px',
                padding: '14px 20px',
                background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                borderRadius: '14px',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.28)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bell size={20} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  Enable browser notifications to receive instant desktop alerts for urgent resident help requests & missed check-ins.
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={async () => {
                    const granted = await NotificationService.requestPermission();
                    if (granted) {
                      NotificationService.showNotification("HomeJoy Caregiver Triage", {
                        body: "Desktop notifications enabled for high-priority alerts."
                      });
                    }
                    setShowNotificationPrompt(false);
                  }}
                  className="btn btn-sm"
                  style={{ background: '#ffffff', color: '#0f766e', fontWeight: 800, border: 'none', padding: '6px 14px' }}
                >
                  Enable Desktop Alerts
                </button>
                <button
                  onClick={() => setShowNotificationPrompt(false)}
                  style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontWeight: 800, fontSize: '1.1rem' }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Urgent Help Request Banner */}
          <CaregiverHelpRequestAlert
            helpRequests={helpRequests}
            onStatusUpdated={() => {
              loadDashboardData();
              loadHelpRequests();
            }}
          />

          {currentTab === 'home' && (
            <CaregiverHomeView
              dashboardData={dashboardData}
              onSelectElderly={handleSelectElderly}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onSendReminder={handleSendReminder}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onResolveAlert={handleResolveAlert}
            />
          )}

          {currentTab === 'assigned-elderly' && (
            <CaregiverElderlyListView
              assignedElderly={dashboardData?.assigned_elderly || []}
              onSelectElderly={handleSelectElderly}
            />
          )}

          {currentTab === 'elderly-detail' && selectedElderlyId && (
            <CaregiverElderlyDetailView
              elderlyId={selectedElderlyId}
              onBack={handleBackToList}
              onSendReminder={handleSendReminder}
            />
          )}

          {currentTab === 'alerts' && (
            <CaregiverAlertsView
              onSelectElderly={handleSelectElderly}
            />
          )}

          {currentTab === 'escalations' && (
            <CaregiverEscalationView />
          )}

          {currentTab === 'handover' && (
            <CaregiverHandoverView
              assignedElderly={dashboardData?.assigned_elderly || []}
            />
          )}

          {currentTab === 'tasks' && (
            <CaregiverTasksView
              assignedElderly={dashboardData?.assigned_elderly || []}
            />
          )}

          {currentTab === 'reports' && (
            <CaregiverReportsView
              assignedElderly={dashboardData?.assigned_elderly || []}
            />
          )}

          {currentTab === 'notifications' && (
            <CaregiverNotificationsView />
          )}

          {currentTab === 'profile' && (
            <CaregiverProfileView />
          )}

          {currentTab === 'settings' && (
            <CaregiverSettingsView onLogout={logout} />
          )}
        </>
      )}

      </div>
    </div>
  );
};

export default CaregiverDashboard;

