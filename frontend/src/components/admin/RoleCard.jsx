import React from 'react';
import { Shield, Users, Lock, ChevronRight } from 'lucide-react';

export const RoleCard = ({ role, onManagePermissions, onChangeUserRoles }) => {
  const roleLower = (role.role_name || '').toLowerCase();
  
  let headerBg = 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)';
  let badgeColor = '#0369a1';
  let badgeBg = '#e0f2fe';

  if (roleLower === 'elderly') {
    headerBg = 'linear-gradient(135deg, #db2777 0%, #be185d 100%)';
    badgeColor = '#be185d';
    badgeBg = '#fce7f3';
  } else if (roleLower === 'caregiver') {
    headerBg = 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)';
    badgeColor = '#15803d';
    badgeBg = '#dcfce7';
  } else if (roleLower === 'doctor') {
    headerBg = 'linear-gradient(135deg, #9333ea 0%, #6b21a8 100%)';
    badgeColor = '#6b21a8';
    badgeBg = '#f3e8ff';
  } else if (roleLower === 'family member' || roleLower === 'family') {
    headerBg = 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)';
    badgeColor = '#c2410c';
    badgeBg = '#ffedd5';
  } else if (roleLower === 'admin') {
    headerBg = 'linear-gradient(135deg, #d97706 0%, #b45309 100%)';
    badgeColor = '#b45309';
    badgeBg = '#fef3c7';
  }

  const permissions = role.permissions || [];

  return (
    <div className="glass-card animate-fade-in" style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '0',
      overflow: 'hidden',
      border: '1px solid #e2e8f0',
      height: '100%'
    }}>
      {/* Top Banner */}
      <div style={{
        background: headerBg,
        color: '#ffffff',
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={22} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{role.role_name}</h3>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(4px)',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '0.82rem',
          fontWeight: 700
        }}>
          <Users size={14} />
          <span>{role.user_count} User{role.user_count !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, minHeight: '40px' }}>
          {role.description}
        </p>

        <div>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'block',
            marginBottom: '8px'
          }}>
            Assigned Permissions ({permissions.length})
          </span>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '100px', overflowY: 'auto' }}>
            {permissions.length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No permissions assigned</span>
            ) : (
              permissions.map((perm) => (
                <span
                  key={perm}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    backgroundColor: badgeBg,
                    color: badgeColor,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Lock size={10} />
                  <span>{perm}</span>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#f8fafc',
        borderTop: '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button
          className="btn btn-secondary"
          onClick={() => onManagePermissions(role)}
          style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Lock size={14} />
          <span>View / Edit Permissions</span>
        </button>

        {onChangeUserRoles && (
          <button
            className="btn btn-primary"
            onClick={() => onChangeUserRoles(role)}
            style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>Assign Role</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default RoleCard;
