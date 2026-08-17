import React from 'react';

export const RoleDropdown = ({ value, onChange, includeAllOption = false, className = 'form-select', style = {} }) => {
  const roles = [
    { label: 'Admin', value: 'Admin' },
    { label: 'Elderly', value: 'Elderly' },
    { label: 'Caregiver', value: 'Caregiver' },
    { label: 'Doctor', value: 'Doctor' },
    { label: 'Family Member', value: 'Family Member' },
  ];

  return (
    <select
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ padding: '8px 12px', fontSize: '0.88rem', borderRadius: '8px', ...style }}
    >
      {includeAllOption && <option value="all">All Roles</option>}
      {roles.map((r) => (
        <option key={r.value} value={r.value}>
          {r.label}
        </option>
      ))}
    </select>
  );
};

export default RoleDropdown;
