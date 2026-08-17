import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export const StatusBadge = ({ status, isActive, onClick, disabled = false, interactive = true }) => {
  const active = isActive !== undefined ? isActive : status === 'active';

  const badgeClass = active ? 'badge-risk-low' : 'badge-risk-high';
  const badgeStyle = {
    cursor: disabled || !interactive ? 'default' : 'pointer',
    padding: '4px 10px',
    fontSize: '0.8rem',
    fontWeight: 600,
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.6 : 1,
    background: 'none',
    border: 'none'
  };

  if (!interactive) {
    return (
      <span className={`badge ${badgeClass}`} style={badgeStyle}>
        {active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
        <span>{active ? 'Active' : 'Inactive'}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`badge ${badgeClass}`}
      style={badgeStyle}
      title={active ? 'Click to deactivate user' : 'Click to activate user'}
    >
      {active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      <span>{active ? 'Active' : 'Inactive'}</span>
    </button>
  );
};

export default StatusBadge;
