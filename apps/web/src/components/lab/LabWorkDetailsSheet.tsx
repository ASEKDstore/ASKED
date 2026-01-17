'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { StarRating } from '@/components/reviews/StarRating';
import { Button } from '@/components/ui/button';
import { useTelegram } from '@/hooks/useTelegram';
import { api, type LabWork } from '@/lib/api';

interface LabWorkDetailsSheetProps {
  labWorkId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LabWorkDetailsSheet({ labWorkId, isOpen, onClose }: LabWorkDetailsSheetProps): JSX.Element | null {
  const { initData, webApp } = useTelegram();
  const queryClient = useQueryClient();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [dragY, setDragY] = useState(0);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isRating, setIsRating] = useState(false);

  const { data: work, isLoading, error } = useQuery({
    queryKey: ['lab-work', labWorkId],
    queryFn: () => api.getLabWork(labWorkId!),
    enabled: !!labWorkId && isOpen,
  });

  const rateMutation = useMutation({
    mutationFn: (rating: number) => api.rateLabWork(labWorkId!, rating),
    onMutate: async (rating: number) => {
      setIsRating(true);
      await queryClient.cancelQueries({ queryKey: ['lab-work', labWorkId] });
      const previousWork = queryClient.getQueryData<LabWork>(['lab-work', labWorkId!]);
      if (previousWork) {
        queryClient.setQueryData<LabWork>(['lab-work', labWorkId!], {
          ...previousWork,
          ratingAvg: ((previousWork.ratingAvg * previousWork.ratingCount + rating) / (previousWork.ratingCount + 1)),
          ratingCount: previousWork.ratingCount + (userRating === null ? 1 : 0),
        });
      }
      setUserRating(rating);
      return { previousWork };
    },
    onError: (_err, _rating, context) => {
      if (context?.previousWork) {
        queryClient.setQueryData(['lab-work', labWorkId!], context.previousWork);
      }
      setUserRating(null);
    },
    onSuccess: (data) => {
      setUserRating(data.userRating);
      queryClient.invalidateQueries({ queryKey: ['lab-work', labWorkId] });
      queryClient.invalidateQueries({ queryKey: ['lab-works'] });
    },
    onSettled: () => {
      setIsRating(false);
    },
  });

  // Telegram BackButton integration
  useEffect(() => {
    if (!isOpen || !webApp) return;

    const handleBack = () => {
      onClose();
    };

    const tg = window.Telegram?.WebApp;
    if (tg?.BackButton) {
      tg.BackButton.show();
      tg.BackButton.onClick(handleBack);
    }

    return () => {
      if (tg?.BackButton) {
        tg.BackButton.hide();
        tg.BackButton.offClick(handleBack);
      }
    };
  }, [isOpen, webApp, onClose]);

  // Lock body scroll when open
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

  // Handle escape key
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

  const handleRatingChange = (rating: number) => {
    if (!isRating && initData && labWorkId) {
      rateMutation.mutate(rating);
    }
  };

  const images = work?.media?.filter((m) => m.type === 'IMAGE') || [];
  const mainImage = images[currentImageIndex];

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Reset image index when work changes
  useEffect(() => {
    if (work) {
      setCurrentImageIndex(0);
    }
  }, [work?.id]);

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
          onDrag={(_event, info) => setDragY(Math.max(0, info.offset.y))}
          onDragEnd={handleDragEnd}
          dragMomentum={false}
          className="fixed bottom-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-xl rounded-t-[28px] shadow-2xl max-h-[90vh] flex flex-col overflow-hidden border-t border-white/10"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-white/30 rounded-full" />
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/30 backdrop-blur-xl border border-white/10 hover:bg-black/40 flex items-center justify-center transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white/30"></div>
              </div>
            ) : error || !work ? (
              <div className="text-center py-12 px-4">
                <p className="text-white/70">Работа не найдена</p>
              </div>
            ) : (
              <div className="px-4 py-6 space-y-6">
                {/* Gallery */}
                {images.length > 0 && (
                  <div className="relative aspect-square bg-black/20 rounded-[20px] overflow-hidden">
                    {mainImage && !imageErrors[mainImage.id] ? (
                      <>
                        <Image
                          src={mainImage.url}
                          alt={work.title}
                          fill
                          className="object-contain bg-black/10"
                          priority
                          unoptimized
                          onError={() => setImageErrors((prev) => ({ ...prev, [mainImage.id]: true }))}
                        />
                        {images.length > 1 && (
                          <>
                            <button
                              onClick={handlePrevImage}
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                              aria-label="Previous image"
                            >
                              <ArrowLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleNextImage}
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                              aria-label="Next image"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                              {images.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setCurrentImageIndex(idx)}
                                  className={`w-2 h-2 rounded-full transition-colors ${
                                    idx === currentImageIndex ? 'bg-white' : 'bg-white/40'
                                  }`}
                                  aria-label={`Go to image ${idx + 1}`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/40">
                        No image
                      </div>
                    )}
                  </div>
                )}

                {/* Title */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{work.title}</h2>

                  {/* Rating Summary */}
                  {(work.ratingAvg > 0 || work.ratingCount > 0) && (
                    <div className="flex items-center gap-3 mb-4">
                      <StarRating rating={work.ratingAvg} size="md" />
                      <span className="text-sm text-white/70">
                        {work.ratingCount > 0
                          ? `${work.ratingAvg.toFixed(1)} (${work.ratingCount} ${work.ratingCount === 1 ? 'отзыв' : work.ratingCount < 5 ? 'отзыва' : 'отзывов'})`
                          : 'Нет отзывов'}
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  {work.description && (
                    <p className="text-white/70 mb-4 whitespace-pre-wrap">{work.description}</p>
                  )}

                  {/* User Rating Section */}
                  {initData && (
                    <div className="mb-6 pt-4 border-t border-white/10">
                      <h3 className="text-sm font-medium mb-2 text-white/90">Ваша оценка</h3>
                      <StarRating
                        rating={userRating ?? work.ratingAvg}
                        size="md"
                        interactive={!isRating}
                        onRatingChange={handleRatingChange}
                      />
                      {userRating && (
                        <p className="text-sm text-white/60 mt-2">Вы оценили: {userRating} из 5</p>
                      )}
                      {isRating && (
                        <p className="text-sm text-white/60 mt-2">Сохранение...</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sticky CTA Bar */}
          {work && (
            <div
              className="sticky bottom-0 px-4 pt-4 pb-6 bg-gradient-to-t from-black/95 via-black/95 to-transparent border-t border-white/10"
              style={{
                paddingBottom: `calc(1.5rem + env(safe-area-inset-bottom, 0px))`,
              }}
            >
              <Link href="/lab" className="block">
                <Button size="lg" className="w-full bg-white text-black hover:bg-white/90">
                  Хочу такой кастом
                </Button>
              </Link>
            </div>
          )}
        </motion.div>
      </>
    </AnimatePresence>
  );
}

