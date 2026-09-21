import React from 'react';

export default function Input({
  label,
  error,
  required = false,
  icon: Icon,
  className = '',
  wrapperClassName = '',
  id,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`form-group ${wrapperClassName}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {Icon && (
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Icon />
          </div>
        )}
        <input
          id={inputId}
          className={`form-input ${Icon ? 'has-icon' : ''} ${className}`}
          style={Icon ? { paddingLeft: 38 } : undefined}
          {...props}
        />
      </div>
      {error && <p className="form-error-msg">{error}</p>}
    </div>
  );
}
