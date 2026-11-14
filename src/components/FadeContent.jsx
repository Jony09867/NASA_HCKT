import React from 'react';

export default function FadeContent({
  children,
  duration = 0.25,
  delay = 0,
  className = '',
  style = {},
  ...props
}) {
  return (
    <div
      className={`fade-content-entry ${className}`}
      style={{
        animation: `fadeContentIn ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both`,
        ...style,
      }}
      {...props}
    >
      <style>{`
        @keyframes fadeContentIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      {children}
    </div>
  );
}
