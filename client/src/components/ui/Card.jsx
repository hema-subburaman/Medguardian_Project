import React from 'react';

export default function Card({
  title,
  subtitle,
  headerAction,
  children,
  className = '',
  ...props
}) {
  return (
    <div className={`card ${className}`} {...props}>
      {(title || headerAction) && (
        <div className="card-header">
          <div>
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {headerAction && <div className="card-header-action">{headerAction}</div>}
        </div>
      )}
      <div className="card-body">{children}</div>
    </div>
  );
}
