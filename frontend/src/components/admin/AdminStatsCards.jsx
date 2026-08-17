import React from 'react';
import { Users, HeartPulse, UserCheck, Activity, UserPlus, Clock, ArrowUpRight } from 'lucide-react';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';

export const AdminStatsCards = ({ stats, loading, onNavigateTab }) => {
  if (loading) {
    return <LoadingState message="Fetching system administration metrics..." />;
  }

  const statItems = [
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
      title: 'Active Users',
      value: stats?.active_users ?? 0,
      icon: Activity,
      color: '#7e22ce',
      bg: '#faf5ff',
      tab: 'users'
    },
    {
      title: 'New Registrations (30d)',
      value: stats?.new_registrations ?? 0,
      icon: UserPlus,
      color: 'var(--warning)',
      bg: 'var(--warning-light)',
      tab: 'analytics'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {statItems.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div
              key={idx}
              className="card card-hover animate-fade-in"
              onClick={() => onNavigateTab && onNavigateTab(item.tab)}
              style={{
                padding: '20px 22px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <span style={{ fontSize: '0.785rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {item.title}
                </span>
                <div style={{ fontSize: '1.9rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                  {item.value}
                </div>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                background: item.bg,
                color: item.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <IconComp size={24} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Registrations Table Card */}
      <div className="card animate-fade-in">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Clock size={20} style={{ color: 'var(--primary)' }} />
              <span>Recent User Registrations</span>
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '2px' }}>
              Latest registered accounts across all roles
            </p>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigateTab && onNavigateTab('users')}
          >
            <span>View All Directory</span>
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
                    <th>Registration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recent_users.map((u) => {
                    const roleLower = (u.role || '').toLowerCase();
                    let roleBadgeClass = 'badge-role-family';
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
