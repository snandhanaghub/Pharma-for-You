import React from 'react';
import './Chip.css';

const Chip = ({ children, onRemove, variant = 'default' }) => {
  return (
    <div className={`chip chip-${variant}`}>
      <span className="chip-text">{children}</span>
      {onRemove && (
        <button className="chip-remove" onClick={onRemove}>
          ×
        </button>
      )}
    </div>
  );
};

export default Chip;
