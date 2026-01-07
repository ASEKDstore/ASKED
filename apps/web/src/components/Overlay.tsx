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
}: OverlayProps): JSX.Element | null {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            onClick={onClose}
            className={`fixed inset-0 ${blur ? 'backdrop-blur-xl' : ''} bg-black/50 ${className}`}
            style={{ zIndex }}
            aria-hidden="true"
          />
          {/* Content */}
          <div
            className="fixed inset-0"
            style={{ zIndex: zIndex + 1 }}
          >
            {children}
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

