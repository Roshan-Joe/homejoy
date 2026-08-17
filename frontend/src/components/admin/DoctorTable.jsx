import React from 'react';
import { Eye, Edit3, Trash2, UserPlus, Stethoscope, FileText, Calendar, Users, Building2 } from 'lucide-react';

export const DoctorTable = ({
  doctors = [],
  loading = false,
  onAssignPatients,
  onViewNotes,
  onViewAppointments,
  onEdit,
  onDelete
}) => {
  const getSpecializationBadge = (specStr) => {
    const s = (specStr || 'Geriatrician').toLowerCase();
    let bg = '#f3e8ff';
    let color = '#6b21a8';

    if (s.includes('cardio')) { bg = '#fef2f2'; color = '#b91c1c'; }
    else if (s.includes('neuro')) { bg = '#e0f2fe'; color = '#0369a1'; }
    else if (s.includes('general')) { bg = '#dcfce7'; color = '#15803d'; }

    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '0.78rem',
        fontWeight: 700,
        backgroundColor: bg,
        color: color
      }}>
        {specStr || 'Geriatrician'}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        Loading medical doctor directory from MongoDB Atlas...
      </div>
    );
  }

  if (!doctors || doctors.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        No matching doctor records found.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
            <th style={{ padding: '12px 14px' }}>Doctor</th>
            <th style={{ padding: '12px 14px' }}>Specialization</th>
            <th style={{ padding: '12px 14px' }}>License & Affiliation</th>
            <th style={{ padding: '12px 14px' }}>Assigned Patients</th>
            <th style={{ padding: '12px 14px' }}>Status</th>
            <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map((d) => {
            const displayName = d.name || d.full_name || 'Doctor';
            const assignedCount = d.assigned_patient_ids ? d.assigned_patient_ids.length : 0;

            return (
              <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.9rem' }}>
                <td style={{ padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {d.profileImage ? (
                      <img
                        src={d.profileImage}
                        alt={displayName}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#f3e8ff',
                        color: '#6b21a8',
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
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{d.email}</div>
                    </div>
                  </div>
                </td>

                <td style={{ padding: '14px' }}>
                  {getSpecializationBadge(d.specialization)}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {d.experience_years} Years Exp.
                  </div>
                </td>

                <td style={{ padding: '14px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.86rem' }}>{d.license_number}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Building2 size={12} />
                    <span>{d.hospital_affiliation || 'HomeJoy Network'}</span>
                  </div>
                </td>

                <td style={{ padding: '14px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => onAssignPatients(d)}
                    style={{ padding: '4px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Users size={14} />
                    <span>{assignedCount} Patient{assignedCount !== 1 ? 's' : ''}</span>
                  </button>
                </td>

                <td style={{ padding: '14px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    backgroundColor: d.status === 'Active' ? '#ecfdf5' : '#fef2f2',
                    color: d.status === 'Active' ? '#047857' : '#b91c1c'
                  }}>
                    {d.status || 'Active'}
                  </span>
                </td>

                <td style={{ padding: '14px', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '6px' }}>
                    <button
                      className="btn btn-secondary"
                      title="View Clinical Notes"
                      onClick={() => onViewNotes(d)}
                      style={{ padding: '6px 10px' }}
                    >
                      <FileText size={16} />
                    </button>

                    <button
                      className="btn btn-secondary"
                      title="View Appointments"
                      onClick={() => onViewAppointments(d)}
                      style={{ padding: '6px 10px' }}
                    >
                      <Calendar size={16} />
                    </button>

                    <button
                      className="btn btn-secondary"
                      title="Edit Doctor Profile"
                      onClick={() => onEdit(d)}
                      style={{ padding: '6px 10px' }}
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      className="btn btn-danger"
                      title="Delete Doctor Profile"
                      onClick={() => onDelete(d)}
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

export default DoctorTable;
