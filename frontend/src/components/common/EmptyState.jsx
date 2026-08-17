import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are currently no items available to show.',
  actionText,
  onAction
}) => {
  return (
    <div className="state-card animate-fade-in">
      <div className="state-icon-wrapper state-icon-muted">
        <Icon size={32} />
      </div>
      <h3 className="state-title">{title}</h3>
      {description && <p className="state-desc">{description}</p>}
      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-primary btn-sm">
          {actionText}
        </button>
      )}
    </div>
  );
};
