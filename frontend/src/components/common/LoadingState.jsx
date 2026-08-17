import React from 'react';

export const LoadingState = ({ message = 'Loading details...', size = 'md' }) => {
  return (
    <div className="state-card">
      <div className="state-icon-wrapper state-icon-primary">
        <div className={`spinner ${size === 'sm' ? 'spinner-sm' : size === 'lg' ? 'spinner-lg' : ''}`} />
      </div>
      <p className="state-title">{message}</p>
    </div>
  );
};
