import React from 'react';
import './InputField.css';

const InputField = ({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder,
  error,
  disabled = false,
  ...props 
}) => {
  return (
    <div className="input-field">
      {label && <label className="input-label">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`input ${error ? 'input-error' : ''}`}
        {...props}
      />
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
};

export default InputField;
