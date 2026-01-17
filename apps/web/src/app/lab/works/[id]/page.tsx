'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

import { HEADER_HEIGHT_PX } from '@/components/Header';
import { StarRating } from '@/components/reviews/StarRating';
import { Button } from '@/components/ui/button';
import { useTelegram } from '@/hooks/useTelegram';
import { api, type LabWork } from '@/lib/api';

export default function LabWorkPage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const { initData } = useTelegram();
  const queryClient = useQueryClient();
  const workId = params.id as string;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isRating, setIsRating] = useState(false);

  const { data: work, isLoading, error } = useQuery({
    queryKey: ['lab-work', workId],
    queryFn: () => api.getLabWork(workId),
    enabled: !!workId,
  });

  const rateMutation = useMutation({
    mutationFn: (rating: number) => api.rateLabWork(workId, rating),
    onMutate: async (rating: number) => {
      setIsRating(true);
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['lab-work', workId] });
      const previousWork = queryClient.getQueryData<LabWork>(['lab-work', workId]);
      if (previousWork) {
        queryClient.setQueryData<LabWork>(['lab-work', workId], {
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
        queryClient.setQueryData(['lab-work', workId], context.previousWork);
      }
      setUserRating(null);
    },
    onSuccess: (data) => {
      setUserRating(data.userRating);
      queryClient.invalidateQueries({ queryKey: ['lab-work', workId] });
      queryClient.invalidateQueries({ queryKey: ['lab-works'] });
    },
    onSettled: () => {
      setIsRating(false);
    },
  });

  const images = work?.media?.filter((m) => m.type === 'IMAGE') || [];
  const mainImage = images[currentImageIndex];

  const handleRatingChange = (rating: number) => {
    if (!isRating && initData) {
      rateMutation.mutate(rating);
    }
  };

  if (isLoading) {
    return (
      <div
        className="container mx-auto px-4 py-8"
        style={{ paddingTop: `calc(${HEADER_HEIGHT_PX}px + 1.5rem + env(safe-area-inset-top, 0px))` }}
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Загрузка работы...</p>
        </div>
      </div>
    );
  }

  if (error || !work) {
    return (
      <div
        className="container mx-auto px-4 py-8"
        style={{ paddingTop: `calc(${HEADER_HEIGHT_PX}px + 1.5rem + env(safe-area-inset-top, 0px))` }}
      >
        <div className="text-center">
          <p className="text-red-600 mb-4">Работа не найдена</p>
          <Button onClick={() => router.push('/')}>
            Вернуться на главную
          </Button>
        </div>
      </div>
    );
  }

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div
      className="container mx-auto px-4 py-6"
      style={{ paddingTop: `calc(${HEADER_HEIGHT_PX}px + 1.5rem + env(safe-area-inset-top, 0px))` }}
    >
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Назад
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image gallery */}
        <div className="space-y-4">
          <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
            {mainImage && mainImage.type === 'IMAGE' && !imageErrors[mainImage.id] ? (
              <>
                <Image
                  src={mainImage.url}
                  alt={work.title}
                  fill
                  className="object-contain bg-gray-50"
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
                      <ArrowLeft className="w-4 h-4 rotate-180" />
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
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No image
              </div>
            )}
          </div>
          {images.length > 1 && images.length <= 5 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(0, 4).map((image, idx) => {
                if (image.type !== 'IMAGE') return null;
                return (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`aspect-square relative bg-gray-100 rounded overflow-hidden border-2 transition-colors ${
                      idx === currentImageIndex ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    {!imageErrors[image.id] ? (
                      <Image
                        src={image.url}
                        alt={work.title}
                        fill
                        className="object-cover bg-gray-50"
                        unoptimized
                        onError={() => setImageErrors((prev) => ({ ...prev, [image.id]: true }))}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No image
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Work info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-4">{work.title}</h1>
            {/* Rating summary */}
            {(work.ratingAvg > 0 || work.ratingCount > 0) && (
              <div className="flex items-center gap-3 mb-4">
                <StarRating rating={work.ratingAvg} size="md" />
                <span className="text-sm text-gray-600">
                  {work.ratingCount > 0
                    ? `${work.ratingAvg.toFixed(1)} (${work.ratingCount} ${work.ratingCount === 1 ? 'отзыв' : work.ratingCount < 5 ? 'отзыва' : 'отзывов'})`
                    : 'Нет отзывов'}
                </span>
              </div>
            )}
            {work.description && (
              <p className="text-gray-600 mb-4 whitespace-pre-wrap">{work.description}</p>
            )}
            {/* User rating section */}
            {initData && (
              <div className="mb-6 pt-4 border-t">
                <h3 className="text-sm font-medium mb-2 text-gray-700">Ваша оценка</h3>
                <StarRating
                  rating={userRating ?? work.ratingAvg}
                  size="md"
                  interactive={!isRating}
                  onRatingChange={handleRatingChange}
                />
                {userRating && (
                  <p className="text-sm text-gray-500 mt-2">Вы оценили: {userRating} из 5</p>
                )}
                {isRating && (
                  <p className="text-sm text-gray-500 mt-2">Сохранение...</p>
                )}
              </div>
            )}
          </div>

          {/* CTA Button */}
          <div className="space-y-4 pt-6 border-t">
            <Link href="/lab" className="block">
              <Button size="lg" className="w-full">
                Хочу такой кастом
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

