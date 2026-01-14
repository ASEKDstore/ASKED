'use client';

import { Play } from 'lucide-react';
import Image from 'next/image';

import type { ReviewMedia } from '@/lib/api';
import { normalizeImageUrl } from '@/lib/image-utils';

interface MediaGalleryProps {
  media: ReviewMedia[];
  onMediaClick?: (index: number) => void;
}

export function MediaGallery({ media, onMediaClick }: MediaGalleryProps): JSX.Element {
  if (media.length === 0) return <></>;

  return (
    <div className="grid grid-cols-3 gap-2 mt-3">
      {media.map((item, index) => {
        const normalizedUrl = normalizeImageUrl(item.url);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onMediaClick?.(index)}
            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
          >
            {item.type === 'IMAGE' && normalizedUrl ? (
              <Image
                src={normalizedUrl}
                alt="Review media"
                fill
                className="object-cover group-hover:scale-105 transition-transform"
                sizes="(max-width: 768px) 33vw, 150px"
              />
            ) : item.type === 'VIDEO' && normalizedUrl ? (
              <>
                <Image
                  src={normalizedUrl}
                  alt="Video thumbnail"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 33vw, 150px"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Play className="w-6 h-6 text-white" fill="white" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                No media
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

