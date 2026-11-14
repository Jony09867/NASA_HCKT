import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'motion/react';

export default function ScrollReveal({
  text = '',
  lines = null,
  mode = 'enter',
  splitBy = 'words',
  effect = 'fade',
  stagger = 0.08,
  duration = 0.8,
  baseOpacity = 0.15,
  baseRotation = 2,
  baseOffset = 10,
  enableBlur = true,
  blurStrength = 4,
  highlightColor = '',
  className = '',
  as: Tag = 'h2',
}) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.25 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const structuredLines = lines || [
    [{ text: 'Better' }, { text: 'knowledge.' }],
    [{ text: 'Safer', isEm: true }, { text: 'exploration.', isEm: true }],
  ];

  if (prefersReducedMotion) {
    return (
      <Tag className={`scroll-reveal-static ${className}`.trim()}>
        {structuredLines.map((lineWords, lineIdx) => (
          <span key={lineIdx} style={{ display: 'block' }}>
            {lineWords.map((w, wIdx) => (
              <span key={wIdx} className={w.isEm ? 'hero-muted' : ''}>
                {w.text}
                {wIdx < lineWords.length - 1 ? ' ' : ''}
              </span>
            ))}
          </span>
        ))}
      </Tag>
    );
  }

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
      },
    },
  };

  const wordVariants = {
    hidden: {
      opacity: baseOpacity,
      filter: enableBlur ? `blur(${blurStrength}px)` : 'none',
      y: baseOffset,
      rotate: baseRotation,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      y: 0,
      rotate: 0,
      transition: {
        duration,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <Tag ref={containerRef} className={`scroll-reveal ${className}`.trim()}>
      <motion.span
        style={{ display: 'block' }}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={containerVariants}
      >
        {structuredLines.map((lineWords, lineIdx) => (
          <span key={lineIdx} style={{ display: 'block' }}>
            {lineWords.map((w, wIdx) => (
              <motion.span
                key={wIdx}
                variants={wordVariants}
                style={{
                  display: 'inline-block',
                  marginRight: wIdx < lineWords.length - 1 ? '0.28em' : '0',
                }}
                className={w.isEm ? 'hero-muted' : ''}
              >
                {w.text}
              </motion.span>
            ))}
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
