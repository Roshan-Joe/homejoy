import React, { useState, useRef, useEffect } from 'react';
import {
  Edit3, Trash2, FileText, Award, Users, Star,
  MoreVertical, ArrowUpDown, ArrowUp, ArrowDown, MapPin
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState';

export const CaregiverTable = ({
  caregivers = [],
  loading = false,
  selectedIds = [],
  onSelectCaregiver,
  onSelectAll,
  sortBy,
  sortOrder,
  onSort,
  onAssignElderly,
  onViewReports,
  onViewPerformance,
  onEdit,
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

  const getShiftBadge = (shiftStr) => {
    const s = (shiftStr || 'Day').toLowerCase();
    let badgeClass = 'badge-alert-ack';

    if (s === 'night') badgeClass = 'badge-role-admin';
    else if (s === 'rotational') badgeClass = 'badge-alert-new';

    return (
      <span className={`badge ${badgeClass}`}>
        {shiftStr || 'Day'} Shift
      </span>
    );
  };

  const renderStars = (rating) => {
    const score = rating || 4.8;
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--warning)', fontWeight: 700, fontSize: '0.85rem' }}>
        <Star size={14} fill="var(--warning)" />
        <span>{score.toFixed(1)}</span>
      </div>
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

  if (!caregivers || caregivers.length === 0) {
    return (
      <EmptyState
        title="No caregivers found"
        description="No caregiver profiles match the specified filters."
      />
    );
  }

  const allSelected = caregivers.length > 0 && selectedIds.length === caregivers.length;
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
                aria-label="Select all caregivers"
                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
              />
            </th>
            <th onClick={() => onSort && onSort('name')} style={{ cursor: 'pointer', userSelect: 'none', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>Caregiver</span>
                {renderSortIcon('name')}
              </div>
            </th>
            <th onClick={() => onSort && onSort('district')} style={{ cursor: 'pointer', userSelect: 'none', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>District</span>
                {renderSortIcon('district')}
              </div>
            </th>
            <th>Qualification & Exp</th>
            <th onClick={() => onSort && onSort('shift')} style={{ cursor: 'pointer', userSelect: 'none', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>Shift</span>
                {renderSortIcon('shift')}
              </div>
            </th>
            <th style={{ padding: '12px 14px' }}>Workload Capacity</th>
            <th>Rating</th>
            <th style={{ padding: '12px 14px', textAlign: 'right', paddingRight: '20px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {caregivers.map((c) => {
            const displayName = c.name || c.full_name || 'Caregiver';
            const assignedCount = c.assigned_elderly_ids ? c.assigned_elderly_ids.length : 0;
            const maxPatients = c.max_patients || 8;
            const isFull = assignedCount >= maxPatients;
            const isSelected = selectedIds.includes(c.id);
            const isMenuOpen = openMenuId === c.id;

            return (
              <tr
                key={c.id}
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
                    onChange={(e) => onSelectCaregiver && onSelectCaregiver(c.id, e.target.checked)}
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
                      backgroundColor: 'var(--risk-low-bg, #ecfdf5)',
                      color: 'var(--risk-low-text, #047857)',
                      border: '1px solid var(--risk-low-border, #a7f3d0)',
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
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{c.email || c.phone || 'No contact'}</div>
                    </div>
                  </div>
                </td>

                <td style={{ padding: '14px' }}>
                  {c.district ? (
                    <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <MapPin size={13} style={{ color: 'var(--primary)' }} />
                      {c.district}
                    </span>
                  ) : (
                    <span className="badge badge-alert-new" style={{ fontSize: '0.74rem' }}>
                      District missing
                    </span>
                  )}
                </td>

                <td style={{ padding: '14px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.86rem' }}>
                    {c.qualification || 'Certified Caregiver'}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    {c.experience_years ? `${c.experience_years} years exp` : 'Standard certified'}
                  </div>
                </td>

                <td style={{ padding: '14px' }}>
                  {getShiftBadge(c.shift)}
                </td>

                <td style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '0.86rem',
                      fontWeight: 800,
                      color: isFull ? '#b91c1c' : 'var(--text-main)'
                    }}>
                      {assignedCount} / {maxPatients}
                    </span>
                    {isFull && (
                      <span className="badge badge-alert-new" style={{ fontSize: '0.72rem', backgroundColor: '#fee2e2', color: '#b91c1c' }}>
                        At Capacity
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {isFull ? 'No free slots' : `${maxPatients - assignedCount} slots available`}
                  </div>
                </td>

                <td style={{ padding: '14px' }}>
                  {renderStars(c.rating || c.performance_rating)}
                </td>

                {/* Unified Row Action Dropdown Menu */}
                <td style={{ padding: '14px', textAlign: 'right', position: 'relative', paddingRight: '20px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '6px 8px', borderRadius: '8px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(isMenuOpen ? null : c.id);
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
                          onAssignElderly && onAssignElderly(c);
                        }}
                        role="menuitem"
                      >
                        <Users size={15} style={{ color: 'var(--primary)' }} />
                        <span>Manage Clients ({assignedCount})</span>
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
                          onViewReports && onViewReports(c);
                        }}
                        role="menuitem"
                      >
                        <FileText size={15} style={{ color: '#0284c7' }} />
                        <span>Daily Reports</span>
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
                          onViewPerformance && onViewPerformance(c);
                        }}
                        role="menuitem"
                      >
                        <Award size={15} style={{ color: '#f59e0b' }} />
                        <span>Performance</span>
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
                          onEdit && onEdit(c);
                        }}
                        role="menuitem"
                      >
                        <Edit3 size={15} style={{ color: '#6366f1' }} />
                        <span>Edit Caregiver</span>
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
                          onDelete && onDelete(c);
                        }}
                        role="menuitem"
                      >
                        <Trash2 size={15} />
                        <span>Delete Caregiver</span>
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

export default CaregiverTable;
