'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export function StarRating({ rating, size = 'md', interactive = false, onRatingChange, className }: StarRatingProps): JSX.Element {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(Math.round(rating));

  const displayRating = interactive ? (hoverRating ?? selectedRating) : rating;
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const stars = Array.from({ length: 5 }, (_, index) => {
    const starValue = index + 1;
    const filled = starValue <= Math.floor(displayRating);
    const half = !filled && starValue - 0.5 <= displayRating;

    return (
      <button
        key={index}
        type="button"
        onClick={() => {
          if (interactive && onRatingChange) {
            setSelectedRating(starValue);
            onRatingChange(starValue);
          }
        }}
        onMouseEnter={() => {
          if (interactive) {
            setHoverRating(starValue);
          }
        }}
        onMouseLeave={() => {
          if (interactive) {
            setHoverRating(null);
          }
        }}
        disabled={!interactive}
        className={interactive ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'}
      >
        <Star
          className={`${sizeClasses[size]} ${filled ? 'fill-yellow-400 text-yellow-400' : half ? 'fill-yellow-400/50 text-yellow-400/50' : 'fill-gray-200 text-gray-200'}`}
        />
      </button>
    );
  });

  return (
    <div className={`flex items-center gap-0.5 ${className || ''}`}>
      {stars}
      {!interactive && rating > 0 && (
        <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}






