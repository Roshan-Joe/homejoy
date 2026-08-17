import React from 'react';
import { getRiskConfig } from '../../services/wellnessRiskService';

/**
 * WellnessRiskBadge — displays the wellness risk level in a clearly labeled badge.
 * Always renders the phrasing "Wellness Risk: X" — never a medical diagnosis.
 */
export const WellnessRiskBadge = ({ riskLevel = 'Low', size = 'md' }) => {
  const config = getRiskConfig(riskLevel);

  const riskLower = (riskLevel || 'low').toLowerCase();
  let badgeClass = 'badge-risk-low';
  if (riskLower === 'moderate' || riskLower === 'medium') badgeClass = 'badge-risk-moderate';
  else if (riskLower === 'high' || riskLower === 'critical') badgeClass = 'badge-risk-high';

  const sizeStyles = size === 'lg'
    ? { padding: '10px 20px', fontSize: '1rem', borderRadius: '12px', gap: '8px' }
    : { padding: '5px 14px', fontSize: '0.8rem', borderRadius: '9999px', gap: '6px' };

  return (
    <span
      className={`badge ${badgeClass}`}
      style={{
        fontWeight: 700,
        letterSpacing: '0.3px',
        ...sizeStyles,
      }}
    >
      <span style={{ fontSize: size === 'lg' ? '1.1rem' : '0.85rem' }}>{config.icon}</span>
      {config.label}
    </span>
  );
};
