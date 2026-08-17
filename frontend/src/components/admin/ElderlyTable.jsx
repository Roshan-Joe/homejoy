import React from 'react';
import { Eye, Edit3, Trash2, UserPlus, Stethoscope, AlertTriangle, ShieldAlert } from 'lucide-react';

export const ElderlyTable = ({
  elderly = [],
  loading = false,
  onViewMedicalProfile,
  onEdit,
  onAssign,
  onDelete
}) => {
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

    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '0.78rem',
        fontWeight: 700,
        backgroundColor: bg,
        color: color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        {l === 'high' && <ShieldAlert size={13} />}
        <span>{label} ({(score * 100).toFixed(0)}%)</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        Loading elderly patient records from MongoDB Atlas...
      </div>
    );
  }

  if (!elderly || elderly.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        No matching elderly patient records found.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
            <th style={{ padding: '12px 14px' }}>Patient</th>
            <th style={{ padding: '12px 14px' }}>Age & Blood</th>
            <th style={{ padding: '12px 14px' }}>AI Risk Score</th>
            <th style={{ padding: '12px 14px' }}>Assigned Caregiver</th>
            <th style={{ padding: '12px 14px' }}>Assigned Doctor</th>
            <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {elderly.map((p) => {
            const displayName = p.name || p.full_name || 'Elderly Patient';

            return (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                <td style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {p.profileImage ? (
                      <img
                        src={p.profileImage}
                        alt={displayName}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.9rem'
                      }}>
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{displayName}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.email}</div>
                    </div>
                  </div>
                </td>

                <td style={{ padding: '14px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.age} yrs ({p.gender || 'F'})</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Blood: <strong>{p.blood_group || 'O+'}</strong></div>
                </td>

                <td style={{ padding: '14px' }}>
                  {getRiskBadge(p.risk_level, p.ai_risk_score)}
                </td>

                <td style={{ padding: '14px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: p.assigned_caregiver_name !== 'Not Assigned' ? 600 : 400, color: p.assigned_caregiver_name !== 'Not Assigned' ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {p.assigned_caregiver_name}
                  </div>
                </td>

                <td style={{ padding: '14px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: p.assigned_doctor_name !== 'Not Assigned' ? 600 : 400, color: p.assigned_doctor_name !== 'Not Assigned' ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {p.assigned_doctor_name}
                  </div>
                </td>

                <td style={{ padding: '14px', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary"
                      title="View Medical Profile"
                      onClick={() => onViewMedicalProfile(p)}
                      style={{ padding: '6px 10px' }}
                    >
                      <Eye size={16} />
                    </button>

                    <button
                      className="btn btn-secondary"
                      title="Assign Caregiver / Doctor"
                      onClick={() => onAssign(p)}
                      style={{ padding: '6px 10px' }}
                    >
                      <UserPlus size={16} />
                    </button>

                    <button
                      className="btn btn-secondary"
                      title="Edit Profile"
                      onClick={() => onEdit(p)}
                      style={{ padding: '6px 10px' }}
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      className="btn btn-danger"
                      title="Delete Patient Profile"
                      onClick={() => onDelete(p)}
                      style={{ padding: '6px 10px' }}
                    >
                      <Trash2 size={16} />
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

export default ElderlyTable;
