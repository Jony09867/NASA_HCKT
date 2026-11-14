import React, { useEffect, useState } from 'react';
import './ShinyText.css';

export default function ShinyText({
  text = '',
  color = '#ff8a58',
  shineColor = '#fff1df',
  speed = 3,
  delay = 3,
  shineWidth = 25,
  softness = 0.8,
  trigger = 'loop',
  glow = 0,
  followPointer = false,
  className = '',
  children,
}) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const content = children || text;

  if (prefersReducedMotion) {
    return (
      <span
        className={`shiny-text-static ${className}`.trim()}
        style={{ color }}
      >
        {content}
      </span>
    );
  }

  const animationDuration = `${speed}s`;
  const animationDelay = `${delay}s`;

  return (
    <span
      className={`shiny-text ${className}`.trim()}
      style={{
        '--shiny-color': color,
        '--shiny-highlight': shineColor,
        '--shiny-speed': animationDuration,
        '--shiny-delay': animationDelay,
        '--shiny-width': `${shineWidth}%`,
        color,
      }}
    >
      {content}
    </span>
  );
}
