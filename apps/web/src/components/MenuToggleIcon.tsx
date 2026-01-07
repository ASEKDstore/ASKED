'use client';

import { motion } from 'framer-motion';

interface MenuToggleIconProps {
  isOpen: boolean;
  className?: string;
}

/**
 * Animated burger-to-X icon morph animation
 * iOS-like spring animation with 3 lines morphing into X
 */
export function MenuToggleIcon({ isOpen, className = '' }: MenuToggleIconProps): JSX.Element {
  // iOS-like spring configuration
  const springConfig = {
    type: 'spring' as const,
    stiffness: 400,
    damping: 28,
    mass: 0.75,
  };

  return (
    <div className={`relative w-5 h-5 flex flex-col justify-center items-center ${className}`} aria-hidden="true">
      {/* Top line */}
      <motion.div
        className="absolute w-full h-0.5 bg-current rounded-full"
        animate={
          isOpen
            ? {
                rotate: 45,
                y: 0,
              }
            : {
                rotate: 0,
                y: -6,
              }
        }
        transition={springConfig}
        style={{ transformOrigin: 'center' }}
      />

      {/* Middle line */}
      <motion.div
        className="absolute w-full h-0.5 bg-current rounded-full"
        animate={
          isOpen
            ? {
                opacity: 0,
                scaleX: 0,
              }
            : {
                opacity: 1,
                scaleX: 1,
              }
        }
        transition={springConfig}
        style={{ transformOrigin: 'center' }}
      />

      {/* Bottom line */}
      <motion.div
        className="absolute w-full h-0.5 bg-current rounded-full"
        animate={
          isOpen
            ? {
                rotate: -45,
                y: 0,
              }
            : {
                rotate: 0,
                y: 6,
              }
        }
        transition={springConfig}
        style={{ transformOrigin: 'center' }}
      />
    </div>
  );
}

