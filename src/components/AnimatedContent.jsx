import React from 'react';
import { motion } from 'motion/react';

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

  // If single child or simple container
  if (Array.isArray(children)) {
    return (
      <motion.div
        className={className}
        style={style}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        {...props}
      >
        {children.map((child, idx) => (
          <motion.div key={idx} variants={itemVariants}>
            {child}
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      style={style}
      initial={{
        opacity: 0,
        x: isHorizontal ? -distance : 0,
        y: !isHorizontal ? distance : 0,
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
      }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration, ease, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
