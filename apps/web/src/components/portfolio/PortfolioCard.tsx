'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

import { StarRating } from './StarRating';

interface PortfolioWork {
  id: string;
  title: string;
  description: string;
  images: string[];
  rating: number;
  reviewCount: number;
}

interface PortfolioCardProps {
  work: PortfolioWork;
}

export function PortfolioCard({ work }: PortfolioCardProps): JSX.Element {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const hasMultipleImages = work.images.length > 1;

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? work.images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === work.images.length - 1 ? 0 : prev + 1));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-[20px] bg-black/30 backdrop-blur-xl 
                 border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.3)]
                 overflow-hidden"
    >
      {/* Image Gallery */}
      <div className="relative aspect-[4/3] bg-black/20 overflow-hidden">
        {work.images.length > 0 ? (
          <>
            <Image
              src={work.images[currentImageIndex] || work.images[0] || ''}
              alt={work.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              unoptimized
            />
            {/* Navigation Buttons */}
            {hasMultipleImages && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 
                           w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 
                           backdrop-blur-md border border-white/20
                           flex items-center justify-center text-white
                           transition-colors duration-200 z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 
                           w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 
                           backdrop-blur-md border border-white/20
                           flex items-center justify-center text-white
                           transition-colors duration-200 z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                {/* Image Indicators */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {work.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImageIndex(index);
                      }}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        index === currentImageIndex
                          ? 'bg-white w-4'
                          : 'bg-white/40 hover:bg-white/60'
                      }`}
                      aria-label={`Go to image ${index + 1}`}
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

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="text-[clamp(18px, 4.5vw, 20px)] font-bold text-white tracking-tight">
          {work.title}
        </h3>

        {/* Description */}
        <p className="text-[clamp(13px, 3vw, 14px)] text-white/70 leading-relaxed line-clamp-2">
          {work.description}
        </p>

        {/* Rating */}
        <StarRating rating={work.rating} reviewCount={work.reviewCount} />
      </div>
    </motion.div>
  );
}

