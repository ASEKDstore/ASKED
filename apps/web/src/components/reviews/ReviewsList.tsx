'use client';

import { useState } from 'react';

import type { Review } from '@/lib/api';

import { MediaGallery } from './MediaGallery';
import { MediaViewer } from './MediaViewer';
import { StarRating } from './StarRating';

interface ReviewsListProps {
  reviews: Review[];
}

function formatReviewDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'сегодня';
  } else if (diffDays === 1) {
    return 'вчера';
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'день' : diffDays < 5 ? 'дня' : 'дней'} назад`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'неделю' : weeks < 5 ? 'недели' : 'недель'} назад`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'} назад`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'} назад`;
  }
}

export function ReviewsList({ reviews }: ReviewsListProps): JSX.Element {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [viewerMedia, setViewerMedia] = useState<Review['media']>([]);

  const handleMediaClick = (reviewMedia: Review['media'], index: number) => {
    setViewerMedia(reviewMedia);
    setViewerIndex(index);
  };

  const handleCloseViewer = () => {
    setViewerIndex(null);
  };

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Пока нет отзывов
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {reviews.map((review) => {
          const userName = review.user
            ? review.user.username || review.user.firstName || 'Пользователь'
            : 'Пользователь';
          const reviewDate = new Date(review.createdAt);

          return (
            <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              {/* User info and rating */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="font-medium text-gray-900">{userName}</div>
                    <div className="text-sm text-gray-500">
                      {formatReviewDate(reviewDate)}
                    </div>
                  </div>
                  <StarRating rating={review.rating} size="sm" />
                </div>
              </div>

              {/* Review text */}
              {review.text && (
                <p className="text-gray-700 mt-3 whitespace-pre-wrap">{review.text}</p>
              )}

              {/* Media gallery */}
              {review.media && review.media.length > 0 && (
                <MediaGallery
                  media={review.media}
                  onMediaClick={(index) => handleMediaClick(review.media, index)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Media viewer */}
      {viewerIndex !== null && (
        <MediaViewer
          media={viewerMedia}
          initialIndex={viewerIndex}
          isOpen={viewerIndex !== null}
          onClose={handleCloseViewer}
        />
      )}
    </>
  );
}

