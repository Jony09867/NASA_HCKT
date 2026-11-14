import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function AnimatedContent({
  children,
  distance = 15,
  direction = 'vertical',
  duration = 0.6,
  ease = [0.16, 1, 0.3, 1],
  stagger = 0.07,
  delay = 0,
  className = '',
  style = {},
  // animateKey: when this changes, re-runs the entrance animation
  animateKey,
  ...props
}) {
  const isHorizontal = direction === 'horizontal';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
    exit: { opacity: 0 },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      x: isHorizontal ? -distance : 0,
      y: !isHorizontal ? distance : 0,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        ease,
      },
    },
  };

  if (Array.isArray(children)) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={animateKey ?? 'animated-content'}
          className={className}
          style={style}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          viewport={{ once: false, amount: 0.05 }}
          {...props}
        >
          {children.map((child, idx) => (
            <motion.div key={idx} variants={itemVariants}>
              {child}
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={animateKey ?? 'animated-single'}
        className={className}
        style={style}
        initial={{
          opacity: 0,
          x: isHorizontal ? -distance : 0,
          y: !isHorizontal ? distance : 0,
        }}
        animate={{
          opacity: 1,
          x: 0,
          y: 0,
        }}
        exit={{ opacity: 0 }}
        transition={{ duration, ease, delay }}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
