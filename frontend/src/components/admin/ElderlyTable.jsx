import React, { useState, useRef, useEffect } from 'react';
import {
  Eye, Edit3, Trash2, UserPlus, ShieldAlert, AlertTriangle,
  MoreVertical, ArrowUpDown, ArrowUp, ArrowDown, MapPin
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

export const ElderlyTable = ({
  elderly = [],
  loading = false,
  selectedIds = [],
  onSelectElderly,
  onSelectAll,
  sortBy,
  sortOrder,
  onSort,
  onViewMedicalProfile,
  onEdit,
  onAssign,
  onDelete
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

  const getRiskBadge = (level, score) => {
    const l = (level || 'low').toLowerCase();
    let bg = '#ecfdf5';
    let color = '#047857';
    let label = 'Low Risk';

    if (l === 'high') {
      bg = '#fef2f2';
      color = '#b91c1c';
      label = 'High Risk';
    } else if (l === 'medium') {
      bg = '#fffbeb';
      color = '#b45309';
      label = 'Medium Risk';
    }

    const pct = typeof score === 'number' ? `(${(score * 100).toFixed(0)}%)` : '';

    return (
      <span
        style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '0.78rem',
          fontWeight: 700,
          backgroundColor: bg,
          color: color,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        {l === 'high' && <ShieldAlert size={13} />}
        <span>{label} {pct}</span>
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

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            style={{
              height: '52px',
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

  if (!elderly || elderly.length === 0) {
    return (
      <EmptyState
        title="No elderly residents found"
        description="No patient profiles match the selected filters or search terms."
      />
    );
  }

  const allSelected = elderly.length > 0 && selectedIds.length === elderly.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-muted)', fontSize: '0.84rem', textTransform: 'uppercase' }}>
            <th style={{ width: '40px', padding: '12px 14px' }}>
              <input
                type="checkbox"
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected;
                }}
                onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                aria-label="Select all residents"
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
            </th>
            <th onClick={() => onSort && onSort('name')} style={{ cursor: 'pointer', userSelect: 'none', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>Resident</span>
                {renderSortIcon('name')}
              </div>
            </th>
            <th onClick={() => onSort && onSort('district')} style={{ cursor: 'pointer', userSelect: 'none', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>District</span>
                {renderSortIcon('district')}
              </div>
            </th>
            <th onClick={() => onSort && onSort('age')} style={{ cursor: 'pointer', userSelect: 'none', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>Age & Blood</span>
                {renderSortIcon('age')}
              </div>
            </th>
            <th onClick={() => onSort && onSort('risk')} style={{ cursor: 'pointer', userSelect: 'none', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>AI Risk Score</span>
                {renderSortIcon('risk')}
              </div>
            </th>
            <th style={{ padding: '12px 14px' }}>Assigned Caregiver</th>
            <th style={{ padding: '12px 14px' }}>Doctor</th>
            <th style={{ padding: '12px 14px', textAlign: 'right', paddingRight: '20px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {elderly.map((p) => {
            const displayName = p.name || p.full_name || 'Elderly Resident';
            const isUnassigned = !p.assigned_caregiver_id || p.assigned_caregiver_name === 'Not Assigned';
            const isSelected = selectedIds.includes(p.id);
            const isMenuOpen = openMenuId === p.id;

            return (
              <tr
                key={p.id}
                style={{
                  borderBottom: '1px solid #f1f5f9',
                  fontSize: '0.9rem',
                  backgroundColor: isSelected ? 'rgba(2, 132, 199, 0.04)' : undefined,
                  transition: 'background-color 0.15s ease'
                }}
              >
                <td style={{ padding: '14px' }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onSelectElderly && onSelectElderly(p.id, e.target.checked)}
                    aria-label={`Select ${displayName}`}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                </td>

                <td style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-light, #e0f2fe)',
                      color: 'var(--primary, #0284c7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      flexShrink: 0
                    }}>
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{displayName}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{p.email || p.phone || 'No email'}</div>
                    </div>
                  </div>
                </td>

                <td style={{ padding: '14px' }}>
                  {p.district ? (
                    <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin size={13} style={{ color: 'var(--primary)' }} />
                      {p.district}
                    </span>
                  ) : (
                    <span className="badge badge-alert-new" style={{ fontSize: '0.74rem' }}>
                      District missing
                    </span>
                  )}
                </td>

                <td style={{ padding: '14px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                    {p.age ? `${p.age} yrs (${p.gender || 'Not specified'})` : (p.gender ? p.gender : <span style={{ color: '#d97706', fontSize: '0.82rem', fontWeight: 600 }}>Intake Pending</span>)}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Blood: <strong>{p.blood_group || 'Not recorded'}</strong>
                  </div>
                </td>

                <td style={{ padding: '14px' }}>
                  {!p.setup_complete && !p.date_of_birth ? (
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        backgroundColor: '#f1f5f9',
                        color: '#64748b',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      New Resident
                    </span>
                  ) : (
                    getRiskBadge(p.risk_level, p.ai_risk_score)
                  )}
                </td>

                <td style={{ padding: '14px' }}>
                  {isUnassigned ? (
                    <span
                      className="badge badge-alert-new"
                      style={{ fontSize: '0.78rem', backgroundColor: '#fee2e2', color: '#b91c1c', cursor: 'pointer' }}
                      onClick={() => onAssign && onAssign(p)}
                      title="Click to allocate caregiver"
                    >
                      ★ Unassigned
                    </span>
                  ) : (
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.assigned_caregiver_name}</div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Assigned Staff</span>
                    </div>
                  )}
                </td>

                <td style={{ padding: '14px' }}>
                  {(!p.assigned_doctor_name || p.assigned_doctor_name === 'Not Assigned') ? (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>None</span>
                  ) : (
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.86rem' }}>
                      Dr. {p.assigned_doctor_name}
                    </div>
                  )}
                </td>

                {/* Unified Row Action Dropdown Menu */}
                <td style={{ padding: '14px', textAlign: 'right', position: 'relative', paddingRight: '20px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 8px', borderRadius: '8px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(isMenuOpen ? null : p.id);
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
                        minWidth: '180px',
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
                          onViewMedicalProfile && onViewMedicalProfile(p);
                        }}
                        role="menuitem"
                      >
                        <Eye size={15} style={{ color: 'var(--primary)' }} />
                        <span>Medical Profile</span>
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
                          onAssign && onAssign(p);
                        }}
                        role="menuitem"
                      >
                        <UserPlus size={15} style={{ color: '#059669' }} />
                        <span>Allocate Staff</span>
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
                          onEdit && onEdit(p);
                        }}
                        role="menuitem"
                      >
                        <Edit3 size={15} style={{ color: '#0284c7' }} />
                        <span>Edit Resident</span>
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
                          onDelete && onDelete(p);
                        }}
                        role="menuitem"
                      >
                        <Trash2 size={15} />
                        <span>Delete Resident</span>
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

export default ElderlyTable;
