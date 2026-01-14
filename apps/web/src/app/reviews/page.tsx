'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { HEADER_HEIGHT_PX } from '@/components/Header';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import { StarRating } from '@/components/reviews/StarRating';
import { api } from '@/lib/api';

export default function ReviewsPage(): JSX.Element {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', 'all'],
    queryFn: () => api.getReviews({ page: 1, pageSize: 50 }),
  });

  const averageRating = useMemo(() => {
    if (!reviews || reviews.items.length === 0) return 0;
    const sum = reviews.items.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.items.length;
  }, [reviews]);

  const reviewsCount = reviews?.meta.total || 0;

  return (
    <div
      className="container mx-auto px-4 py-8"
      style={{ paddingTop: `calc(${HEADER_HEIGHT_PX}px + 2rem + env(safe-area-inset-top, 0px))` }}
    >
      <h1 className="text-3xl font-bold mb-6">Отзывы</h1>

      {/* Rating summary */}
      {reviewsCount > 0 && (
        <div className="flex items-center gap-3 mb-8">
          <StarRating rating={averageRating} size="md" />
          <span className="text-sm text-gray-600">
            {reviewsCount} {reviewsCount === 1 ? 'отзыв' : reviewsCount < 5 ? 'отзыва' : 'отзывов'}
          </span>
        </div>
      )}

      {/* Reviews list */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">
          Загрузка отзывов...
        </div>
      ) : reviews && reviews.items.length > 0 ? (
        <ReviewsList reviews={reviews.items} />
      ) : (
        <div className="text-center py-8 text-gray-500">
          Пока нет отзывов
        </div>
      )}
    </div>
  );
}
