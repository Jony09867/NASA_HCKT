import React, { useEffect, useState } from 'react';
import './CircularText.css';

export default function CircularText({
  text = 'MICROGRAVITY · COMBUSTION · RESEARCH · ',
  direction = 'clockwise',
  spinDuration = 40,
  onHover = 'pause',
  draggable = false,
  hoverTilt = 0,
  fill = true,
  repeat = 2,
  ring = false,
  fontWeight = 500,
  color = '#d7ba9e',
  className = '',
}) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const fullText = Array(repeat).fill(text).join('');
  const animDirection = direction === 'clockwise' ? 'normal' : 'reverse';
  const animPlayState = prefersReducedMotion || (isPaused && onHover === 'pause') ? 'paused' : 'running';

  return (
    <div
      className={`circular-text-container ${className}`.trim()}
      onMouseEnter={() => {
        if (onHover === 'pause') setIsPaused(true);
      }}
      onMouseLeave={() => {
        if (onHover === 'pause') setIsPaused(false);
      }}
      style={{
        '--spin-duration': `${spinDuration}s`,
        '--spin-direction': animDirection,
        '--spin-state': animPlayState,
        color,
        fontWeight,
      }}
    >
      <svg
        className="circular-text-svg"
        viewBox="0 0 500 500"
        aria-hidden="true"
      >
        <defs>
          <path
            id="circular-text-path"
            d="M 250, 250 m -175, 0 a 175,175 0 1,1 350,0 a 175,175 0 1,1 -350,0"
          />
        </defs>
        {ring && (
          <circle
            cx="250"
            cy="250"
            r="175"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.18"
          />
        )}
        <text
          fill="currentColor"
          textLength={fill ? '1099' : undefined}
          lengthAdjust={fill ? 'spacing' : undefined}
        >
          <textPath href="#circular-text-path" startOffset="0%">
            {fullText}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
