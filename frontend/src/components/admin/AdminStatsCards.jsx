import React from 'react';
import {
  Users, HeartPulse, UserCheck, Activity, UserPlus, Clock, ArrowUpRight,
  UserX, ShieldAlert, AlertTriangle, LifeBuoy, AlertCircle
} from 'lucide-react';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';

export const AdminStatsCards = ({ stats, loading, onNavigateTab }) => {
  if (loading) {
    return <LoadingState message="Fetching system administration metrics..." />;
  }

  // Primary Work-To-Do Action Cards
  const workToDoItems = [
    {
      title: 'Unassigned Clients',
      value: stats?.unassigned_clients_count ?? 0,
      badgeText: stats?.unassigned_overdue_count > 0 ? `${stats.unassigned_overdue_count} Overdue (>24h)` : 'Needs Caregiver',
      isUrgent: Boolean(stats?.unassigned_overdue_count > 0),
      icon: UserX,
      color: '#dc2626',
      bg: '#fef2f2',
      border: 'rgba(220, 38, 38, 0.3)',
      tab: 'elderly',
      tabParam: '?caregiver_id=unassigned'
    },
    {
      title: 'At-Capacity Staff',
      value: stats?.caregivers_at_capacity_count ?? 0,
      badgeText: 'Full Patient Roster',
      isUrgent: false,
      icon: ShieldAlert,
      color: '#d97706',
      bg: '#fffbeb',
      border: 'rgba(217, 119, 6, 0.3)',
      tab: 'caregivers',
      tabParam: '?status=at_capacity'
    },
    {
      title: 'High-Risk Residents',
      value: stats?.high_risk_today_count ?? 0,
      badgeText: 'Elevated Telemetry',
      isUrgent: Boolean((stats?.high_risk_today_count ?? 0) > 0),
      icon: AlertTriangle,
      color: '#e11d48',
      bg: '#fff1f2',
      border: 'rgba(225, 29, 72, 0.3)',
      tab: 'elderly',
      tabParam: '?risk=High'
    },
    {
      title: 'Open Help Requests',
      value: stats?.open_help_requests_count ?? 0,
      badgeText: 'Urgent Care Queue',
      isUrgent: Boolean((stats?.open_help_requests_count ?? 0) > 0),
      icon: LifeBuoy,
      color: '#7c3aed',
      bg: '#f5f3ff',
      border: 'rgba(124, 58, 237, 0.3)',
      tab: 'notifications',
      tabParam: ''
    }
  ];

  // Secondary Totals
  const totalItems = [
    {
      title: 'Total Users',
      value: stats?.total_users ?? 0,
      icon: Users,
      color: 'var(--secondary)',
      bg: 'var(--secondary-light)',
      tab: 'users'
    },
    {
      title: 'Total Elderly',
      value: stats?.total_elderly ?? 0,
      icon: HeartPulse,
      color: 'var(--primary)',
      bg: 'var(--primary-light)',
      tab: 'elderly'
    },
    {
      title: 'Total Caregivers',
      value: stats?.total_caregivers ?? 0,
      icon: UserCheck,
      color: 'var(--success)',
      bg: 'var(--risk-low-bg)',
      tab: 'caregivers'
    },
    {
      title: 'Active Accounts',
      value: stats?.active_users ?? 0,
      icon: Activity,
      color: '#0891b2',
      bg: '#ecfeff',
      tab: 'users'
    },
    {
      title: 'New Registrations (30d)',
      value: stats?.new_registrations ?? 0,
      icon: UserPlus,
      color: '#d97706',
      bg: '#fffbeb',
      tab: 'analytics'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* 1. Work To Do Section Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <AlertCircle size={20} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.01em' }}>
            Work To Do — Priority Action Items
          </h2>
        </div>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0 }}>
          Real-time queues requiring administrative intervention or allocation.
        </p>
      </div>

      {/* Priority Action Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '18px' }}>
        {workToDoItems.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div
              key={idx}
              className="card glass-card animate-fade-in"
              onClick={() => onNavigateTab && onNavigateTab(item.tab, item.tabParam)}
              style={{
                padding: '20px 22px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                border: `1.5px solid ${item.border}`,
                backgroundColor: item.bg,
                boxShadow: item.isUrgent ? '0 8px 24px rgba(220, 38, 38, 0.12)' : 'var(--shadow-sm)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigateTab && onNavigateTab(item.tab, item.tabParam);
                }
              }}
              aria-label={`${item.title}: ${item.value} items. ${item.badgeText}`}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {item.title}
                  </span>
                  <div style={{ fontSize: '2.2rem', fontWeight: 900, marginTop: '4px', color: item.color, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                    {item.value}
                  </div>
                </div>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: '#ffffff',
                  color: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}>
                  <IconComp size={24} />
                </div>
              </div>

              <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '999px',
                    backgroundColor: item.isUrgent ? '#dc2626' : '#ffffff',
                    color: item.isUrgent ? '#ffffff' : item.color,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  {item.badgeText}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 600 }}>
                  Review <ArrowUpRight size={14} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. System Overview Totals */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: '0 0 14px 0' }}>
          Directory & Registration Overview
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
          {totalItems.map((item, idx) => {
            const IconComp = item.icon;
            return (
              <div
                key={idx}
                className="pastel-card animate-fade-in"
                onClick={() => onNavigateTab && onNavigateTab(item.tab)}
                style={{
                  padding: '18px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid var(--border-subtle, #e2e8f0)',
                  backgroundColor: 'var(--surface, #ffffff)',
                  borderRadius: '14px'
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onNavigateTab && onNavigateTab(item.tab);
                  }
                }}
              >
                <div>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {item.title}
                  </span>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '2px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    {item.value}
                  </div>
                </div>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: item.bg,
                  color: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <IconComp size={20} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Recent Registrations Table Card */}
      <div className="card animate-fade-in">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Clock size={20} style={{ color: 'var(--primary)' }} />
              <span>Recent User Registrations</span>
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
              Latest registered accounts across all roles with last login tracking
            </p>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigateTab && onNavigateTab('users')}
          >
            <span>View Full Directory</span>
            <ArrowUpRight size={16} />
          </button>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {(!stats?.recent_users || stats.recent_users.length === 0) ? (
            <EmptyState
              title="No recent registrations"
              description="No user account creation logs recorded recently."
            />
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Email Address</th>
                    <th>Role</th>
                    <th>Account Status</th>
                    <th>Last Active</th>
                    <th>Registration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_users.map((u) => {
                    const roleLower = (u.role || '').toLowerCase();
                    let roleBadgeClass = 'badge-role-elderly';
                    if (roleLower === 'elderly') roleBadgeClass = 'badge-role-elderly';
                    if (roleLower === 'caregiver') roleBadgeClass = 'badge-role-caregiver';
                    if (roleLower === 'admin') roleBadgeClass = 'badge-role-admin';
                    if (roleLower === 'doctor') roleBadgeClass = 'badge-role-doctor';

                    return (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                        <td>
                          <span className={`badge ${roleBadgeClass}`}>
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${u.is_active ? 'badge-alert-res' : 'badge-alert-new'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminStatsCards;
