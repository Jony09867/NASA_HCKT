import React, { useRef, useState } from 'react';

export default function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(255, 138, 88, 0.22)',
  spotlightSize = 260,
  isActive = false,
  onClick,
  style = {},
  ...props
}) {
  const cardRef = useRef(null);
  const [pos, setPos] = useState({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState(false);

  const handlePointerMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handlePointerEnter = () => setIsHovered(true);
  const handlePointerLeave = () => {
    setIsHovered(false);
    setPos({ x: -1000, y: -1000 });
  };

  return (
    <div
      ref={cardRef}
      className={`spotlight-card-wrapper ${isActive ? 'is-active' : ''} ${className}`}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '14px',
        border: isActive
          ? '1.5px solid #ff8a58'
          : '1px solid rgba(255, 255, 255, 0.08)',
        background: isActive
          ? 'rgba(255, 138, 88, 0.08)'
          : 'rgba(255, 255, 255, 0.02)',
        boxShadow: isActive
          ? '0 0 28px rgba(255, 138, 88, 0.18)'
          : 'none',
        transition: 'border-color 0.25s ease, background-color 0.25s ease, transform 0.2s ease, box-shadow 0.25s ease',
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      {...props}
    >
      {/* Dynamic Cursor Spotlight Layer */}
      <div
        aria-hidden="true"
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.25s ease',
          background: `radial-gradient(${spotlightSize}px circle at ${pos.x}px ${pos.y}px, ${spotlightColor}, transparent 70%)`,
        }}
      />
      {children}
    </div>
  );
}
