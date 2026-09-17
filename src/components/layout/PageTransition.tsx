'use client';

import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className="w-full">{children}</div>;
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
