import React from 'react';
import './SeverityBadge.css';

const SeverityBadge = ({ severity }) => {
  const severityLower = severity?.toLowerCase().replace(/\s+/g, '-') || 'no-significant-interaction';
  
  return (
    <span className={`severity-badge severity-${severityLower}`}>
      {severity}
    </span>
  );
};

export default SeverityBadge;
