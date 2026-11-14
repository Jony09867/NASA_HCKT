import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';

export default function BlurText({
  text = '',
  className = '',
  effect = 'blur',
  animateBy = 'words',
  direction = 'bottom',
  staggerFrom = 'start',
  trigger = 'load',
  delay = 120,
  stepDuration = 0.35,
  blur = 8,
  distance = 18,
  loop = false,
  focusOnHover = false,
  as: Tag = 'h1',
  children,
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

  // If children provided, render children with styling
  // Otherwise split text
  const items = useMemo(() => {
    if (children) return null;
    if (animateBy === 'letters') {
      return text.split('');
    }
    return text.split(' ');
  }, [text, children, animateBy]);

  const offset = direction === 'top' ? -distance : distance;

  if (prefersReducedMotion) {
    return (
      <Tag className={`blur-text ${className}`.trim()}>
        {children || text}
      </Tag>
    );
  }

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stepDuration,
        delayChildren: delay / 1000,
      },
    },
  };

  const itemVariants = {
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

  if (children) {
    return (
      <Tag className={`blur-text ${className}`.trim()}>
        <motion.span
          style={{ display: 'inline-block' }}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          onAnimationComplete={onAnimationComplete}
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
    <Tag className={`blur-text ${className}`.trim()}>
      <motion.span
        style={{ display: 'inline-block' }}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        onAnimationComplete={onAnimationComplete}
      >
        {items.map((item, idx) => (
          <motion.span
            key={idx}
            variants={itemVariants}
            style={{ display: 'inline-block', marginRight: animateBy === 'words' ? '0.25em' : '0' }}
          >
            {item}
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  );
}
