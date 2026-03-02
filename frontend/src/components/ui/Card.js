import React from 'react';
import './Card.css';

const Card = ({ 
  children, 
  className = '', 
  noPadding = false,
  borderLeft = false,
  borderTop = false,
  borderColor = 'primary'
}) => {
  const cardClasses = `
    card 
    ${noPadding ? 'card-no-padding' : ''} 
    ${borderLeft ? `card-border-left card-border-${borderColor}` : ''} 
    ${borderTop ? `card-border-top card-border-${borderColor}` : ''}
    ${className}
  `.trim();
  
  return (
    <div className={cardClasses}>
      {children}
    </div>
  );
};

export default Card;
