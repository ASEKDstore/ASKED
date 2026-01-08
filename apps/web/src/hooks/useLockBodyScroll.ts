'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook to lock/unlock body scroll
 * Useful for modals, overlays, or pages with fixed backgrounds
 */
export function useLockBodyScroll(lock: boolean): void {
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    if (lock) {
      // Save the current scroll position
      scrollYRef.current = window.scrollY;
      
      // Lock body scroll
      const body = document.body;
      const html = document.documentElement;
      
      body.style.position = 'fixed';
      body.style.top = `-${scrollYRef.current}px`;
      body.style.width = '100%';
      body.style.overflow = 'hidden';
      
      // Prevent scroll on html as well for better compatibility
      html.style.overflow = 'hidden';
      
      return () => {
        // Restore scroll position and unlock
        body.style.position = '';
        body.style.top = '';
        body.style.width = '';
        body.style.overflow = '';
        html.style.overflow = '';
        
        // Restore scroll position
        window.scrollTo(0, scrollYRef.current);
      };
    }
    
    return undefined;
  }, [lock]);
}

