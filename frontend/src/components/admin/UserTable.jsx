import React, { useState, useRef, useEffect } from 'react';
import { Eye, Edit3, Trash2, MoreVertical, ArrowUpDown, ArrowUp, ArrowDown, Power } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { EmptyState } from '../common/EmptyState';

export const UserTable = ({
  users = [],
  loading = false,
  selectedUserIds = [],
  onSelectUser,
  onSelectAll,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  sortBy,
  sortOrder,
  onSort,
  actionLoading = false
}) => {
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadge = (roleStr) => {
    const roleLower = (roleStr || '').toLowerCase();
    let badgeClass = 'badge-role-elderly';

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

  const renderSortIcon = (field) => {
    if (sortBy !== field) {
      return <ArrowUpDown size={13} style={{ opacity: 0.4, marginLeft: '4px' }} />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp size={13} style={{ color: 'var(--primary)', marginLeft: '4px' }} />
    ) : (
      <ArrowDown size={13} style={{ color: 'var(--primary)', marginLeft: '4px' }} />
    );
  };

  // Loading skeleton state
  if (loading) {
    return (
      <div className="table-container" style={{ border: 'none', borderRadius: 0, padding: '16px' }}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            style={{
              height: '48px',
              backgroundColor: '#f1f5f9',
              borderRadius: '8px',
              marginBottom: '10px',
              animation: 'pulse 1.5s infinite ease-in-out',
              opacity: 0.7 - i * 0.08
            }}
          />
        ))}
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <EmptyState
        title="No users found"
        description="No user accounts matched your search or filter criteria."
      />
    );
  }

  const allSelected = users.length > 0 && selectedUserIds.length === users.length;
  const someSelected = selectedUserIds.length > 0 && !allSelected;

  return (
    <div className="table-container" style={{ border: 'none', borderRadius: 0, overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ width: '40px', padding: '12px 14px' }}>
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected;
                }}
                onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                aria-label="Select all users"
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
            </th>
            <th
              onClick={() => onSort && onSort('full_name')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>User Account</span>
                {renderSortIcon('full_name')}
              </div>
            </th>
            <th>Contact Details</th>
            <th
              onClick={() => onSort && onSort('role')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>Role</span>
                {renderSortIcon('role')}
              </div>
            </th>
            <th>Status</th>
            <th>Last Active</th>
            <th>Created By</th>
            <th
              onClick={() => onSort && onSort('created_at')}
              style={{ cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>Joined Date</span>
                {renderSortIcon('created_at')}
              </div>
            </th>
            <th style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const displayName = u.name || u.full_name || 'User';
            const isSelected = selectedUserIds.includes(u.id);
            const isMenuOpen = openMenuId === u.id;

            return (
              <tr
                key={u.id}
                style={{
                  backgroundColor: isSelected ? 'rgba(2, 132, 199, 0.04)' : undefined,
                  transition: 'background-color 0.15s ease'
                }}
              >
                <td style={{ padding: '12px 14px' }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onSelectUser && onSelectUser(u.id, e.target.checked)}
                    aria-label={`Select ${displayName}`}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                </td>

                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-light, #e0f2fe)',
                      color: 'var(--primary, #0284c7)',
                      border: '1px solid rgba(2, 132, 199, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      flexShrink: 0
                    }}>
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                        {displayName}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        ID: {u.id?.slice(-8) || u.id}
                      </div>
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

                <td style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                  {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                </td>

                <td style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                  <span style={{ fontSize: '0.78rem', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                    {u.created_by || 'System / Self'}
                  </span>
                </td>

                <td style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                  {u.created_at || u.createdAt ? new Date(u.created_at || u.createdAt).toLocaleDateString() : 'N/A'}
                </td>

                {/* Unified Row Action Dropdown Menu */}
                <td style={{ textAlign: 'right', position: 'relative', paddingRight: '20px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 8px', borderRadius: '8px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(isMenuOpen ? null : u.id);
                    }}
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen}
                    aria-label={`Actions for ${displayName}`}
                  >
                    <MoreVertical size={16} />
                  </button>

                  {isMenuOpen && (
                    <div
                      ref={menuRef}
                      className="glass-card animate-fade-in"
                      style={{
                        position: 'absolute',
                        right: '20px',
                        top: '40px',
                        zIndex: 100,
                        backgroundColor: '#ffffff',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-subtle, #e2e8f0)',
                        padding: '6px',
                        minWidth: '160px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}
                      role="menu"
                    >
                      <button
                        className="menu-item"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                          border: 'none', background: 'none', width: '100%', textAlign: 'left',
                          fontSize: '0.84rem', cursor: 'pointer', borderRadius: '6px', color: 'var(--text-main)'
                        }}
                        onClick={() => {
                          setOpenMenuId(null);
                          onView && onView(u);
                        }}
                        role="menuitem"
                      >
                        <Eye size={15} style={{ color: 'var(--primary)' }} />
                        <span>View Details</span>
                      </button>

                      <button
                        className="menu-item"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                          border: 'none', background: 'none', width: '100%', textAlign: 'left',
                          fontSize: '0.84rem', cursor: 'pointer', borderRadius: '6px', color: 'var(--text-main)'
                        }}
                        onClick={() => {
                          setOpenMenuId(null);
                          onEdit && onEdit(u);
                        }}
                        role="menuitem"
                      >
                        <Edit3 size={15} style={{ color: '#0284c7' }} />
                        <span>Edit User</span>
                      </button>

                      <button
                        className="menu-item"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                          border: 'none', background: 'none', width: '100%', textAlign: 'left',
                          fontSize: '0.84rem', cursor: 'pointer', borderRadius: '6px', color: 'var(--text-main)'
                        }}
                        onClick={() => {
                          setOpenMenuId(null);
                          onToggleStatus && onToggleStatus(u);
                        }}
                        role="menuitem"
                      >
                        <Power size={15} style={{ color: u.is_active ? '#d97706' : '#10b981' }} />
                        <span>{u.is_active ? 'Deactivate' : 'Activate'}</span>
                      </button>

                      <div style={{ height: '1px', backgroundColor: 'var(--border-subtle, #e2e8f0)', margin: '4px 0' }} />

                      <button
                        className="menu-item"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                          border: 'none', background: 'none', width: '100%', textAlign: 'left',
                          fontSize: '0.84rem', cursor: 'pointer', borderRadius: '6px', color: '#dc2626'
                        }}
                        onClick={() => {
                          setOpenMenuId(null);
                          onDelete && onDelete(u);
                        }}
                        role="menuitem"
                      >
                        <Trash2 size={15} />
                        <span>Delete User</span>
                      </button>
                    </div>
                  )}
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
