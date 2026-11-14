import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, useInView } from 'motion/react';

export default function ScrollReveal({
  children,
  text = '',
  mode = 'enter',
  splitBy = 'words',
  effect = 'fade',
  stagger = 0.07,
  duration = 0.8,
  baseOpacity = 0.2,
  baseRotation = 0,
  baseOffset = 0,
  enableBlur = true,
  blurStrength = 3,
  highlightColor = '',
  className = '',
  as: Tag = 'h2',
}) {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.2 });
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const items = useMemo(() => {
    if (children) return null;
    if (splitBy === 'words') {
      return text.split(' ');
    }
    return [text];
  }, [children, text, splitBy]);

  if (prefersReducedMotion) {
    return (
      <Tag className={`scroll-reveal-static ${className}`.trim()}>
        {children || text}
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

  const itemVariants = {
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
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  };

  if (children) {
    return (
      <Tag ref={containerRef} className={`scroll-reveal ${className}`.trim()}>
        <motion.span
          style={{ display: 'block' }}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          variants={containerVariants}
        >
          {React.Children.map(children, (child, idx) => (
            <motion.span
              key={idx}
              variants={itemVariants}
              style={{ display: 'block' }}
            >
              {child}
            </motion.span>
          ))}
        </motion.span>
      </Tag>
    );
  }

  return (
    <Tag ref={containerRef} className={`scroll-reveal ${className}`.trim()}>
      <motion.span
        style={{ display: 'inline-block' }}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        variants={containerVariants}
      >
        {items.map((word, idx) => (
          <motion.span
            key={idx}
            variants={itemVariants}
            style={{
              display: 'inline-block',
              marginRight: '0.25em',
              color: highlightColor || undefined,
            }}
          >
            {word}
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  );
}
