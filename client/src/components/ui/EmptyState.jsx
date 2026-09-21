import React from 'react';
import { FiInbox } from 'react-icons/fi';
import Button from './Button';

export default function EmptyState({
  icon: Icon = FiInbox,
  title = 'No Records Found',
  description = 'There are no active records in this view currently.',
  actionLabel,
  onAction
}) {
  return (
    <div className="state-container">
      <div className="state-icon">
        <Icon />
      </div>
      <h4 className="state-title">{title}</h4>
      <p className="state-text">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
