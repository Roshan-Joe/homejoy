/**
 * Wellness Risk Service
 *
 * This module provides the interface for fetching and displaying wellness risk results.
 *
 * IMPORTANT: The backend already computes the risk level during check-in submission
 * and returns it in the CheckInResponse. This service is used on the frontend
 * to provide helper utilities (colors, labels, descriptions) for risk display.
 *
 * Risk levels: 'Low' | 'Moderate' | 'High'
 * These are WELLNESS RISK indicators — never a medical diagnosis.
 */

export const RISK_LEVELS = {
  Low: {
    label: 'Wellness Risk: Low',
    color: '#10b981',      // green
    bgColor: '#d1fae5',
    borderColor: '#6ee7b7',
    icon: '✓',
    description: 'Your wellness indicators look good. Keep up your daily routine.',
  },
  Moderate: {
    label: 'Wellness Risk: Moderate',
    color: '#f59e0b',      // amber
    bgColor: '#fef3c7',
    borderColor: '#fcd34d',
    icon: '⚠',
    description: 'Some wellness indicators need attention. Consider speaking with your caregiver.',
  },
  High: {
    label: 'Wellness Risk: High',
    color: '#ef4444',      // red
    bgColor: '#fee2e2',
    borderColor: '#fca5a5',
    icon: '!',
    description: 'Several wellness indicators need attention. Please reach out to your caregiver today.',
  },
};

/**
 * Returns risk display config for a given risk level string.
 * Falls back to 'Low' if the level is unrecognised.
 * @param {string} riskLevel - 'Low' | 'Moderate' | 'High'
 */
export function getRiskConfig(riskLevel) {
  return RISK_LEVELS[riskLevel] || RISK_LEVELS.Low;
}

/**
 * Formats a risk level for display.
 * Always returns the correct "Wellness Risk: X" phrasing — never a diagnosis.
 * @param {string} riskLevel
 */
export function formatRiskLabel(riskLevel) {
  const config = getRiskConfig(riskLevel);
  return config.label;
}
