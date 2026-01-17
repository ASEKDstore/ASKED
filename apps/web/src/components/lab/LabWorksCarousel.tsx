'use client';

import { useQuery } from '@tanstack/react-query';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';

import { StarRating } from '@/components/reviews/StarRating';
import { api } from '@/lib/api';

export function LabWorksCarousel(): JSX.Element {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const { data: labWorks, isLoading } = useQuery({
    queryKey: ['lab-works'],
    queryFn: () => api.getLabWorks(50),
  });

  const publishedWorks = labWorks?.filter((w) => w.status === 'PUBLISHED') || [];

  if (isLoading) {
    return (
      <div className="w-full px-4 mb-12">
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[280px] h-[320px] rounded-[24px] bg-black/20 backdrop-blur-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (publishedWorks.length === 0) {
    return <div />;
  }

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.2,
      }}
      className="w-full px-4 mb-12"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-[clamp(22px,5.5vw,32px)] font-bold text-white mb-2 tracking-tight">
          Готовые работы
        </h2>
        <p className="text-[clamp(14px,3.5vw,16px)] text-white/70">
          Примеры кастомных изделий, созданных в LAB
        </p>
      </div>

      {/* Carousel */}
      <div
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {publishedWorks.map((work, index) => {
          const firstMedia = work.media?.[0];
          const hasMultipleMedia = (work.media?.length || 0) > 1;

          return (
            <motion.div
              key={work.id}
              initial={{ opacity: 0, x: 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
              transition={{
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.3 + index * 0.1,
              }}
              whileTap={{ scale: 0.98 }}
              className="flex-shrink-0 w-[280px] rounded-[24px] bg-black/30 backdrop-blur-xl 
                       border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.3)]
                       overflow-hidden cursor-pointer transition-all duration-200
                       hover:bg-black/35"
              style={{ scrollSnapAlign: 'start' }}
            >
              <Link href={`/lab/works/${work.id}`}>
                {/* Image */}
                <div className="relative w-full h-[180px] bg-black/20">
                  {firstMedia && firstMedia.type === 'IMAGE' && !imageErrors[work.id] ? (
                    <>
                      <Image
                        src={firstMedia.url}
                        alt={work.title}
                        fill
                        className="object-cover"
                        sizes="280px"
                        unoptimized
                        onError={() => setImageErrors((prev) => ({ ...prev, [work.id]: true }))}
                      />
                      {hasMultipleMedia && (
                        <div className="absolute bottom-2 right-2 flex gap-1">
                          {work.media?.slice(0, 3).map((_, idx) => (
                            <div
                              key={idx}
                              className="w-1.5 h-1.5 rounded-full bg-white/60"
                            />
                          ))}
                          {(work.media?.length || 0) > 3 && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/40">
                      No image
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-white font-semibold text-base mb-1 line-clamp-1">
                    {work.title}
                  </h3>
                  {work.description && (
                    <p className="text-white/70 text-sm mb-3 line-clamp-2">
                      {work.description}
                    </p>
                  )}
                  {work.ratingAvg > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <StarRating rating={work.ratingAvg} size="sm" />
                      <span className="text-white/70 text-sm">
                        {work.ratingAvg.toFixed(1)} ({work.ratingCount})
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </motion.section>
  );
}

