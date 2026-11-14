import React, { useEffect, useState, useRef } from 'react';

export default function CountUp({
  from = 0,
  to = 0,
  duration = 0.8,
  prefix = '',
  suffix = '',
  separator = ',',
  className = '',
  style = {},
}) {
  const [current, setCurrent] = useState(from);
  const animRef = useRef(null);
  const prevValRef = useRef(from);

  useEffect(() => {
    // Cancel any running animation
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const startVal = prevValRef.current;
    const endVal = Number(to) || 0;

    const startTime = performance.now();
    const durationMs = Math.max(300, duration * 1000);

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const val = Math.round(startVal + (endVal - startVal) * easeProgress);

      setCurrent(val);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        prevValRef.current = endVal;
      }
    };

    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [to, duration]);

  const formatted = current.toString().replace(/\B(?=(\d{3})+(?!\d))/g, separator);

  return (
    <span className={className} style={style}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
