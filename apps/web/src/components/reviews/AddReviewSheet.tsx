'use client';

import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useTelegram } from '@/hooks/useTelegram';
import { api, type CreateReviewDto } from '@/lib/api';

import { StarRating } from './StarRating';

interface AddReviewSheetProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddReviewSheet({ productId, isOpen, onClose, onSuccess }: AddReviewSheetProps): JSX.Element | null {
  const { initData } = useTelegram();
  const [rating, setRating] = useState<number>(5);
  const [text, setText] = useState<string>('');
  const [media, setMedia] = useState<Array<{ type: 'IMAGE' | 'VIDEO'; url: string }>>([]);
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragY, setDragY] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
    setDragY(0);
  };

  const handleAddMedia = () => {
    if (!mediaUrl.trim()) return;
    if (media.length >= 5) return;

    const url = mediaUrl.trim();
    // Simple URL validation
    try {
      new URL(url);
      setMedia([...media, { type: mediaType, url }]);
      setMediaUrl('');
    } catch {
      // Invalid URL, ignore
    }
  };

  const handleRemoveMedia = (index: number) => {
    setMedia(media.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) return;
    if (!initData) return;

    setIsSubmitting(true);

    try {
      const reviewData: CreateReviewDto = {
        productId,
        rating,
        text: text.trim() || undefined,
        media: media.length > 0 ? media : undefined,
      };

      await api.createReview(initData, reviewData);

      // Reset form
      setRating(5);
      setText('');
      setMedia([]);
      setMediaUrl('');

      // Haptic feedback
      try {
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('success');
      } catch {
        // Ignore
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to create review:', error);
      // Haptic feedback
      try {
        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred?.('error');
      } catch {
        // Ignore
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: dragY > 0 ? dragY : 0 }}
          exit={{ y: '100%' }}
          transition={{
            type: 'spring',
            damping: 30,
            stiffness: 300,
          }}
          drag="y"
          dragConstraints={{ top: 0 }}
          dragElastic={{ top: 0, bottom: 0.2 }}
          onDrag={(_, info) => setDragY(Math.max(0, info.offset.y))}
          onDragEnd={handleDragEnd}
          dragMomentum={false}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[28px] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-6">
            <h2 className="text-2xl font-bold mb-6">Оставить отзыв</h2>

            {/* Star Rating */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Оценка
              </label>
              <StarRating
                rating={rating}
                size="lg"
                interactive
                onRatingChange={setRating}
              />
            </div>

            {/* Review Text */}
            <div className="mb-6">
              <label htmlFor="review-text" className="block text-sm font-medium text-gray-700 mb-2">
                Комментарий (необязательно)
              </label>
              <Textarea
                id="review-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Поделитесь своим мнением..."
                rows={4}
                className="resize-none"
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {text.length}/1000
              </div>
            </div>

            {/* Media Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Фото/видео (до 5 файлов)
              </label>

              {/* Media type selector */}
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setMediaType('IMAGE')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mediaType === 'IMAGE'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Фото
                </button>
                <button
                  type="button"
                  onClick={() => setMediaType('VIDEO')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mediaType === 'VIDEO'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Видео
                </button>
              </div>

              {/* URL input */}
              <div className="flex gap-2 mb-3">
                <Input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder={`Вставьте URL ${mediaType === 'IMAGE' ? 'фото' : 'видео'}`}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddMedia();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddMedia}
                  disabled={!mediaUrl.trim() || media.length >= 5}
                  size="sm"
                >
                  Добавить
                </Button>
              </div>

              {/* Media previews */}
              {media.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {media.map((item, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                      <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(index)}
                          className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                          aria-label="Удалить"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                        {item.type === 'IMAGE' ? '📷' : '🎥'}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {media.length >= 5 && (
                <p className="text-xs text-gray-500 mt-2">Максимум 5 файлов</p>
              )}
            </div>
          </div>

          {/* Sticky CTA Bar */}
          <div
            className="sticky bottom-0 px-4 pt-4 pb-6 bg-gradient-to-t from-white via-white to-transparent border-t border-gray-200"
            style={{
              paddingBottom: `calc(1.5rem + env(safe-area-inset-bottom, 0px))`,
            }}
          >
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || rating < 1 || rating > 5 || !initData}
              size="lg"
              className="w-full"
            >
              {isSubmitting ? 'Отправка...' : 'Отправить отзыв'}
            </Button>
            <p className="text-xs text-center text-gray-500 mt-2">
              Отзыв будет отправлен на модерацию
            </p>
          </div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}

