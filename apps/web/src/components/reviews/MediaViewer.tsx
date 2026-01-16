'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import type { ReviewMedia } from '@/lib/api';
import { normalizeImageUrl } from '@/lib/image-utils';

interface MediaViewerProps {
  media: ReviewMedia[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export function MediaViewer({ media, initialIndex, isOpen, onClose }: MediaViewerProps): JSX.Element | null {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, media.length, onClose]);

  if (!isOpen || media.length === 0) return null;

  const currentMedia = media[currentIndex];
  const normalizedUrl = currentMedia ? normalizeImageUrl(currentMedia.url) : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* Navigation buttons */}
        {media.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-colors"
              aria-label="Предыдущее"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0))}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/10 flex items-center justify-center transition-colors"
              aria-label="Следующее"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </>
        )}

        {/* Media content */}
        <div className="w-full h-full flex items-center justify-center p-4">
          {normalizedUrl && currentMedia.type === 'IMAGE' ? (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full max-w-7xl max-h-full"
            >
              <Image
                src={normalizedUrl}
                alt="Review media"
                fill
                className="object-contain"
                priority
              />
            </motion.div>
          ) : normalizedUrl && currentMedia.type === 'VIDEO' ? (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full max-w-7xl max-h-full"
            >
              <video
                src={normalizedUrl}
                controls
                className="w-full h-full object-contain"
                autoPlay
              />
            </motion.div>
          ) : (
            <div className="text-white">Медиа не найдено</div>
          )}
        </div>

        {/* Indicator */}
        {media.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {media.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? 'bg-white' : 'bg-white/40'}`}
                aria-label={`Перейти к медиа ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}


