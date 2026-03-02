import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  onClick, 
  type = 'button',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  ...props 
}) => {
  const buttonClass = `btn btn-${variant} ${fullWidth ? 'btn-full' : ''} ${disabled || loading ? 'btn-disabled' : ''}`;
  
  return (
    <button 
      className={buttonClass}
      onClick={onClick}
      type={type}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="btn-spinner"></span>
      ) : (
        <>
          {icon && <span className="btn-icon">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
