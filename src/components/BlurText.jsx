import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export default function BlurText({
  wordsList = null,
  text = '',
  className = '',
  effect = 'blur',
  animateBy = 'words',
  direction = 'bottom',
  staggerFrom = 'start',
  trigger = 'load',
  delay = 120,
  stepDuration = 0.35,
  blur = 10,
  distance = 18,
  loop = false,
  as: Tag = 'h1',
  onAnimationComplete,
}) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const offset = direction === 'top' ? -distance : distance;

  // Default words if not custom list
  const lines = wordsList || [
    [{ text: 'Fire' }, { text: 'behaves' }],
    [{ text: 'differently', className: 'hero-muted' }],
    [{ text: 'up' }, { text: 'here', hasDot: true }],
  ];

  if (prefersReducedMotion) {
    return (
      <Tag className={`blur-text ${className}`.trim()}>
        {lines.map((lineWords, lineIdx) => (
          <span key={lineIdx} className="hero-line">
            {lineWords.map((w, wIdx) => (
              <span key={wIdx} className={w.className || ''}>
                {w.text}
                {w.hasDot && <span className="orange">.</span>}
                {wIdx < lineWords.length - 1 ? ' ' : ''}
              </span>
            ))}
          </span>
        ))}
      </Tag>
    );
  }

  // Calculate flat index for stagger
  let globalWordIndex = 0;

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: delay / 1000,
      },
    },
  };

  const wordVariants = {
    hidden: {
      opacity: 0,
      filter: effect === 'blur' ? `blur(${blur}px)` : 'none',
      y: offset,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      transition: {
        duration: stepDuration,
        ease: [0.2, 0.65, 0.2, 1],
      },
    },
  };

  return (
    <Tag className={`blur-text ${className}`.trim()}>
      <motion.span
        style={{ display: 'block' }}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        onAnimationComplete={onAnimationComplete}
      >
        {lines.map((lineWords, lineIdx) => (
          <span key={lineIdx} className="hero-line" style={{ display: 'block' }}>
            {lineWords.map((w, wIdx) => {
              const currentIdx = globalWordIndex++;
              return (
                <motion.span
                  key={wIdx}
                  variants={wordVariants}
                  style={{
                    display: 'inline-block',
                    marginRight: wIdx < lineWords.length - 1 ? '0.28em' : '0',
                  }}
                  className={w.className || ''}
                >
                  {w.text}
                  {w.hasDot && <span className="orange">.</span>}
                </motion.span>
              );
            })}
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
