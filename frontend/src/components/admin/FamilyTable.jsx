import React from 'react';
import { Eye, Edit3, Trash2, Users, HeartHandshake, AlertCircle, Phone, ShieldCheck } from 'lucide-react';

export const FamilyTable = ({
  familyMembers = [],
  loading = false,
  onLinkElderly,
  onViewEmergencySummary,
  onEdit,
  onDelete
}) => {
  const getRelationshipBadge = (relStr) => {
    const r = (relStr || 'Son/Daughter').toLowerCase();
    let bg = '#e0f2fe';
    let color = '#0369a1';

    if (r.includes('spouse') || r.includes('husband') || r.includes('wife')) { bg = '#fef2f2'; color = '#b91c1c'; }
    else if (r.includes('guardian')) { bg = '#f3e8ff'; color = '#6b21a8'; }
    else if (r.includes('daughter') || r.includes('son')) { bg = '#dcfce7'; color = '#15803d'; }

    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '0.78rem',
        fontWeight: 700,
        backgroundColor: bg,
        color: color
      }}>
        {relStr || 'Family Member'}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        Loading family member records from MongoDB Atlas...
      </div>
    );
  }

  if (!familyMembers || familyMembers.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        No matching family member records found.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
            <th style={{ padding: '12px 14px' }}>Family Member</th>
            <th style={{ padding: '12px 14px' }}>Relationship</th>
            <th style={{ padding: '12px 14px' }}>Emergency Priority</th>
            <th style={{ padding: '12px 14px' }}>Linked Elderly</th>
            <th style={{ padding: '12px 14px' }}>Status</th>
            <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {familyMembers.map((f) => {
            const displayName = f.name || f.full_name || 'Family Member';
            const linkedCount = f.linked_elderly_ids ? f.linked_elderly_ids.length : 0;

            return (
              <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                <td style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {f.profileImage ? (
                      <img
                        src={f.profileImage}
                        alt={displayName}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
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
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{f.email}</div>
                    </div>
                  </div>
                </td>

                <td style={{ padding: '14px' }}>
                  {getRelationshipBadge(f.relationship)}
                </td>

                <td style={{ padding: '14px' }}>
                  {f.is_primary_contact ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      backgroundColor: '#fef3c7',
                      color: '#b45309'
                    }}>
                      <ShieldCheck size={14} />
                      <span>Primary Contact</span>
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Secondary</span>
                  )}
                </td>

                <td style={{ padding: '14px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => onLinkElderly(f)}
                    style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Users size={14} />
                    <span>{linkedCount} Resident{linkedCount !== 1 ? 's' : ''}</span>
                  </button>
                </td>

                <td style={{ padding: '14px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    backgroundColor: f.status === 'Active' ? '#ecfdf5' : '#fef2f2',
                    color: f.status === 'Active' ? '#047857' : '#b91c1c'
                  }}>
                    {f.status || 'Active'}
                  </span>
                </td>

                <td style={{ padding: '14px', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary"
                      title="Emergency Health Summary"
                      onClick={() => onViewEmergencySummary(f)}
                      style={{ padding: '6px 10px' }}
                    >
                      <AlertCircle size={16} />
                    </button>

                    <button
                      className="btn btn-secondary"
                      title="Edit Family Profile"
                      onClick={() => onEdit(f)}
                      style={{ padding: '6px 10px' }}
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      className="btn btn-danger"
                      title="Delete Family Profile"
                      onClick={() => onDelete(f)}
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

export default FamilyTable;
