import React from 'react';
import './Avatar.css';

const Avatar = ({ src, alt = 'Avatar', size = 40, name }) => {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
  
  return (
    <div className="avatar" style={{ width: size, height: size }}>
      {src ? (
        <img src={src} alt={alt} className="avatar-image" />
      ) : (
        <div className="avatar-initials">{initials}</div>
      )}
    </div>
  );
};

export default Avatar;
