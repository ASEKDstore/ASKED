'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  className?: string;
}

export function StarRating({ rating, reviewCount, className = '' }: StarRatingProps): JSX.Element {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-0.5">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative w-4 h-4">
            <Star className="absolute w-4 h-4 fill-none text-gray-400" />
            <div className="absolute overflow-hidden w-2 h-4">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className="w-4 h-4 fill-none text-gray-400" />
        ))}
      </div>
      <span className="text-sm font-medium text-white/90">{rating.toFixed(1)}</span>
      {reviewCount !== undefined && reviewCount > 0 && (
        <span className="text-xs text-white/60">({reviewCount} отзывов)</span>
      )}
    </div>
  );
}

