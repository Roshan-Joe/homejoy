import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'Unable to load data at this time. Please verify your connection or try again.',
  onRetry
}) => {
  return (
    <div className="state-card animate-fade-in" style={{ borderColor: 'var(--danger-border)' }}>
      <div className="state-icon-wrapper state-icon-danger">
        <AlertTriangle size={32} />
      </div>
      <h3 className="state-title" style={{ color: 'var(--danger)' }}>{title}</h3>
      <p className="state-desc">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary btn-sm">
          <RefreshCw size={16} />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};
