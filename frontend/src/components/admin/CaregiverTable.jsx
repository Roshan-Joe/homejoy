import React from 'react';
import { Edit3, Trash2, FileText, Award, Users, Star } from 'lucide-react';
import { LoadingState } from '../common/LoadingState';
import { EmptyState } from '../common/EmptyState';

export const CaregiverTable = ({
  caregivers = [],
  loading = false,
  onAssignElderly,
  onViewReports,
  onViewPerformance,
  onEdit,
  onDelete
}) => {
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

  if (loading) {
    return <LoadingState message="Fetching caregiver staff directory..." />;
  }

  if (!caregivers || caregivers.length === 0) {
    return (
      <EmptyState
        title="No caregivers found"
        description="No caregiver profiles match the specified filters."
      />
    );
  }

  return (
    <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
      <table className="table">
        <thead>
          <tr>
            <th>Caregiver</th>
            <th>Qualification & Exp</th>
            <th>Shift Schedule</th>
            <th>Assigned Residents</th>
            <th>Performance Rating</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {caregivers.map((c) => {
            const displayName = c.name || c.full_name || 'Caregiver';
            const assignedCount = c.assigned_elderly_ids ? c.assigned_elderly_ids.length : 0;

            return (
              <tr key={c.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {c.profileImage ? (
                      <img
                        src={c.profileImage}
                        alt={displayName}
                        style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--risk-low-bg)',
                        color: 'var(--risk-low-text)',
                        border: '1px solid var(--risk-low-border)',
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
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.email}</div>
                    </div>
                  </div>
                </td>

                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{c.qualification}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.experience_years} Years Experience</div>
                </td>

                <td>
                  {getShiftBadge(c.shift)}
                </td>

                <td>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onAssignElderly(c)}
                    style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                  >
                    <Users size={14} />
                    <span>{assignedCount} Resident{assignedCount !== 1 ? 's' : ''}</span>
                  </button>
                </td>

                <td>
                  {renderStars(c.performance_rating)}
                </td>

                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      title="View Daily Reports"
                      onClick={() => onViewReports(c)}
                      style={{ padding: '6px 10px' }}
                    >
                      <FileText size={15} />
                    </button>

                    <button
                      className="btn btn-secondary btn-sm"
                      title="Caregiver Performance Scorecard"
                      onClick={() => onViewPerformance(c)}
                      style={{ padding: '6px 10px' }}
                    >
                      <Award size={15} />
                    </button>

                    <button
                      className="btn btn-secondary btn-sm"
                      title="Edit Caregiver Profile"
                      onClick={() => onEdit(c)}
                      style={{ padding: '6px 10px' }}
                    >
                      <Edit3 size={15} />
                    </button>

                    <button
                      className="btn btn-danger btn-sm"
                      title="Delete Caregiver Profile"
                      onClick={() => onDelete(c)}
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

export default CaregiverTable;
