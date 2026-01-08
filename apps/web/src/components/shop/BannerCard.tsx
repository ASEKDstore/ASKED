'use client';

import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';


import type { Banner } from '@/lib/api';
import { normalizeImageUrl } from '@/lib/image-utils';

import { Button } from '../ui/button';

interface BannerCardProps {
  banner: Banner;
}

export function BannerCard({ banner }: BannerCardProps): JSX.Element {
  const router = useRouter();
  const normalizedMediaUrl = normalizeImageUrl(banner.mediaUrl);
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    router.push(`/promo/${banner.promoSlug}`);
  };

  return (
    <div
      className="relative flex-shrink-0 w-[300px] h-[200px] rounded-2xl overflow-hidden shadow-lg cursor-pointer group"
      onClick={handleClick}
    >
      {/* Background Media */}
      <div className="absolute inset-0">
        {banner.mediaType === 'IMAGE' && normalizedMediaUrl && !imageError ? (
          <Image
            src={normalizedMediaUrl}
            alt={banner.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="300px"
            unoptimized
            onError={() => setImageError(true)}
          />
        ) : banner.mediaType === 'IMAGE' && imageError ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 text-gray-500">
            No image
          </div>
        ) : normalizedMediaUrl ? (
          <video
            src={normalizedMediaUrl}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-500">
            No media
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-between p-4 z-10">
        <div className="flex-1 flex flex-col justify-end">
          <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">
            {banner.title}
          </h3>
          {banner.subtitle && (
            <p className="text-sm text-white/90 mb-3 drop-shadow-md">{banner.subtitle}</p>
          )}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="w-full rounded-full bg-white/90 backdrop-blur-md text-gray-900 hover:bg-white border border-white/50 shadow-lg font-medium"
          >
            Подробнее
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}

