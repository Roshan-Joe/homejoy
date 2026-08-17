import React from 'react';
import { Eye, Edit3, Trash2 } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';

export const UserTable = ({
  users = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  actionLoading = false
}) => {
  const getRoleBadge = (roleStr) => {
    const roleLower = (roleStr || '').toLowerCase();
    let badgeClass = 'badge-role-family';

    if (roleLower === 'elderly') badgeClass = 'badge-role-elderly';
    else if (roleLower === 'caregiver') badgeClass = 'badge-role-caregiver';
    else if (roleLower === 'doctor') badgeClass = 'badge-role-doctor';
    else if (roleLower === 'admin') badgeClass = 'badge-role-admin';

    return (
      <span className={`badge ${badgeClass}`}>
        {roleStr || 'User'}
      </span>
    );
  };

  if (loading) {
    return <LoadingState message="Fetching system users..." />;
  }

  if (!users || users.length === 0) {
    return (
      <EmptyState
        title="No users found"
        description="No user accounts matched your search or filter criteria."
      />
    );
  }

  return (
    <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
      <table className="table">
        <thead>
          <tr>
            <th>User Account</th>
            <th>Contact Details</th>
            <th>Role</th>
            <th>Account Status</th>
            <th>Joined Date</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const displayName = u.name || u.full_name || 'User';

            return (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {u.profileImage ? (
                      <img
                        src={u.profileImage}
                        alt={displayName}
                        style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary-hover)',
                        border: '1px solid var(--primary-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.875rem'
                      }}>
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{displayName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {u.id}</div>
                    </div>
                  </div>
                </td>

                <td>
                  <div style={{ color: 'var(--text-main)', fontSize: '0.88rem' }}>{u.email}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.phone || 'No phone'}</div>
                </td>

                <td>
                  {getRoleBadge(u.role)}
                </td>

                <td>
                  <StatusBadge
                    status={u.status}
                    isActive={u.is_active}
                    onClick={() => onToggleStatus && onToggleStatus(u)}
                    disabled={actionLoading}
                  />
                </td>

                <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                </td>

                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      title="View Details"
                      onClick={() => onView(u)}
                      style={{ padding: '6px 10px' }}
                    >
                      <Eye size={15} />
                    </button>

                    <button
                      className="btn btn-secondary btn-sm"
                      title="Edit User"
                      onClick={() => onEdit(u)}
                      style={{ padding: '6px 10px' }}
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      className="btn btn-danger btn-sm"
                      title="Delete User"
                      onClick={() => onDelete(u)}
                      style={{ padding: '6px 10px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
