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
        animation: `fadeContentIn ${duration}s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s backwards`,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// Global keyframe — faqat bir marta DOM ga qo'shiladi
if (typeof document !== 'undefined' && !document.getElementById('fade-content-keyframes')) {
  const style = document.createElement('style');
  style.id = 'fade-content-keyframes';
  style.textContent = `
    @keyframes fadeContentIn {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}
