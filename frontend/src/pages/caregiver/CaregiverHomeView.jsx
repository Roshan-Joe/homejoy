import React, { useState } from 'react';
import {
  Users, CheckCircle2, AlertTriangle, ShieldAlert, Clock, Bell,
  ChevronRight, Send
} from 'lucide-react';
import { WellnessRiskBadge } from '../../components/elderly/WellnessRiskBadge';
import { EmptyState } from '../../components/common/EmptyState';

export const CaregiverHomeView = ({
  dashboardData,
  onSelectElderly,
  onNavigateTab,
  onSendReminder,
  onAcknowledgeAlert,
  onResolveAlert
}) => {
  const [reminderSending, setReminderSending] = useState({});
  const [actionSuccess, setActionSuccess] = useState('');

  if (!dashboardData) return null;

  const {
    summary = {},
    high_priority_alerts = [],
    assigned_elderly = [],
    missed_checkins = [],
    pending_tasks = []
  } = dashboardData;

  const handleReminderClick = async (elderlyId, elderlyName) => {
    try {
      setReminderSending(prev => ({ ...prev, [elderlyId]: true }));
      await onSendReminder(elderlyId);
      setActionSuccess(`Check-in reminder sent to ${elderlyName}`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setReminderSending(prev => ({ ...prev, [elderlyId]: false }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Header */}
      <div className="card vitality-card animate-fade-in" style={{
        padding: '24px 28px',
        borderLeftColor: 'var(--primary)',
        background: 'linear-gradient(135deg, #ffffff 0%, var(--primary-light) 100%)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Caregiver Shift Overview 👋
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginTop: '4px' }}>
              Real-time telemetry, risk indicators, and task monitoring for assigned residents.
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => onNavigateTab('assigned-elderly')}
          >
            <Users size={18} />
            <span>View All Assigned ({summary.total_assigned || 0})</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="alert alert-success animate-fade-in">
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Summary KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px'
      }}>
        {/* Total Assigned */}
        <div className="card card-hover" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: 'var(--radius-md)',
            background: 'var(--secondary-light)', color: 'var(--secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{summary.total_assigned || 0}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Assigned Elderly</div>
          </div>
        </div>

        {/* Today's Completed Check-ins */}
        <div className="card card-hover" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: 'var(--radius-md)',
            background: 'var(--risk-low-bg)', color: 'var(--risk-low-text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--risk-low-text)', letterSpacing: '-0.02em' }}>{summary.checkins_completed_today || 0}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Checked In Today</div>
          </div>
        </div>

        {/* Missed Check-ins */}
        <div className="card card-hover" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: 'var(--radius-md)',
            background: 'var(--risk-mod-bg)', color: 'var(--risk-mod-text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--risk-mod-text)', letterSpacing: '-0.02em' }}>{summary.checkins_missed_today || 0}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Missed Check-ins</div>
          </div>
        </div>

        {/* Moderate Risk */}
        <div className="card card-hover" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: 'var(--radius-md)',
            background: 'var(--risk-mod-bg)', color: 'var(--risk-mod-text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--risk-mod-text)', letterSpacing: '-0.02em' }}>{summary.moderate_risk_count || 0}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Moderate Risk</div>
          </div>
        </div>

        {/* High Risk Cases */}
        <div className="card card-hover" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: 'var(--radius-md)',
            background: 'var(--risk-high-bg)', color: 'var(--risk-high-text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--risk-high-text)', letterSpacing: '-0.02em' }}>{summary.high_risk_count || 0}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>High Risk Cases</div>
          </div>
        </div>

        {/* Unresolved Alerts */}
        <div className="card card-hover" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '46px', height: '46px', borderRadius: 'var(--radius-md)',
            background: '#faf5ff', color: '#7e22ce',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Bell size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#7e22ce', letterSpacing: '-0.02em' }}>{summary.unresolved_alerts_count || 0}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Alerts</div>
          </div>
        </div>
      </div>

      {/* Priority Section: High Priority Alerts */}
      {high_priority_alerts.length > 0 && (
        <div className="card vitality-card-high animate-fade-in" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={22} style={{ color: 'var(--risk-high-text)' }} />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Urgent High Priority Alerts ({high_priority_alerts.length})
              </h2>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab('alerts')}>
              View All Alerts
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {high_priority_alerts.map((alert) => (
              <div key={alert.id} className="alert alert-error" style={{
                marginBottom: 0,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="badge badge-risk-high">
                      {alert.severity}
                    </span>
                    <strong style={{ color: 'var(--text-main)' }}>{alert.elderly_name}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      • {alert.created_at ? new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--risk-high-text)' }}>{alert.title}</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '2px' }}>{alert.reason || alert.message}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSelectElderly(alert.elderly_id)}
                  >
                    View Patient
                  </button>
                  {alert.status === 'New' && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => onAcknowledgeAlert(alert.id)}
                    >
                      Acknowledge
                    </button>
                  )}
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => onResolveAlert(alert.id)}
                  >
                    Resolve Alert
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main 2-Column Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Left Column: Assigned Elderly Quick List */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Assigned Elderly Residents</h2>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab('assigned-elderly')}>
              Manage ({assigned_elderly.length})
            </button>
          </div>

          {assigned_elderly.length === 0 ? (
            <EmptyState
              title="No elderly assigned yet"
              description="Your administrator will assign elderly residents to your shift profile."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {assigned_elderly.slice(0, 5).map((eld) => (
                <div
                  key={eld.id}
                  onClick={() => onSelectElderly(eld.id)}
                  className="card card-hover"
                  style={{
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)',
                      color: 'var(--primary-hover)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', border: '1px solid var(--primary-border)'
                    }}>
                      {eld.profileImage ? (
                        <img src={eld.profileImage} alt={eld.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        eld.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>{eld.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {eld.age ? `${eld.age} yrs` : 'Age N/A'} • Check-in: {eld.last_checkin_time}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <WellnessRiskBadge riskLevel={eld.risk_level} size="sm" />
                    <ChevronRight size={18} style={{ color: 'var(--text-light)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Missed Check-ins & Quick Tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Missed Check-ins Action Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Clock size={20} style={{ color: 'var(--warning)' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Today's Missed Check-ins</h2>
            </div>

            {missed_checkins.length === 0 ? (
              <div className="alert alert-success" style={{ marginBottom: 0 }}>
                <CheckCircle2 size={18} />
                <span>All assigned elderly residents completed today's check-in!</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {missed_checkins.map((item) => (
                  <div key={item.elderly_id} className="alert alert-warning" style={{
                    marginBottom: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{item.elderly_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No check-in submitted for today</div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={reminderSending[item.elderly_id]}
                      onClick={() => handleReminderClick(item.elderly_id, item.elderly_name)}
                    >
                      <Send size={14} />
                      <span>{reminderSending[item.elderly_id] ? 'Sending...' : 'Remind'}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Caregiver Pending Tasks Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Pending Shift Tasks</h2>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => onNavigateTab('tasks')}>
                View Tasks
              </button>
            </div>

            {pending_tasks.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '16px 0' }}>
                No pending tasks. Use "View Tasks" to add checklist items.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pending_tasks.slice(0, 4).map((task) => (
                  <div key={task.id} style={{
                    padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-light)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>{task.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>For {task.elderly_name} • Due: {task.due_date || 'Today'}</div>
                    </div>
                    <span className={`badge ${task.priority === 'High' ? 'badge-risk-high' : 'badge-alert-ack'}`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
