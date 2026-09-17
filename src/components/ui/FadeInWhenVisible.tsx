'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface FadeInWhenVisibleProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function FadeInWhenVisible({
  children,
  delay = 0,
  className = '',
}: FadeInWhenVisibleProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay, ease: [0.25, 1, 0.5, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
