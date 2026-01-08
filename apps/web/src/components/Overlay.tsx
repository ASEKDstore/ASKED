'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';

interface OverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  blur?: boolean;
  zIndex?: number;
}

export function Overlay({
  isOpen,
  onClose,
  children,
  className = '',
  blur = true,
  zIndex = 50,
}: OverlayProps): JSX.Element {
  useEffect(() => {
    if (!isOpen) {
      // Delay unlocking scroll to allow exit animation to complete
      const timer = setTimeout(() => {
        document.body.style.overflow = '';
      }, 450); // Slightly longer than exit animation duration
      return () => clearTimeout(timer);
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen && !children) {
    return <></>;
  }

  return (
    <>
      {/* Backdrop with its own AnimatePresence */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            onClick={onClose}
            className={`fixed inset-0 ${blur ? 'backdrop-blur-xl' : ''} bg-black/50 ${className}`}
            style={{ zIndex }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>
      {/* Content wrapper - always rendered so children can complete exit animations */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: zIndex + 1 }}
      >
        {children}
      </div>
    </>
  );
}

