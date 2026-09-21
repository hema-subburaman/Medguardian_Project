import React from 'react';
import { FiLoader } from 'react-icons/fi';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const variantClass = `btn-${variant}`;
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <>
          <FiLoader className="spin-loader" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="btn-icon" />}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
