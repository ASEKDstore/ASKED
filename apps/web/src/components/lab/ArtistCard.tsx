'use client';

import { motion, useAnimation } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface ArtistCardProps {
  onOrderClick: () => void;
}

export function ArtistCard({ onOrderClick }: ArtistCardProps): JSX.Element {
  const [imageError, setImageError] = useState(false);
  const mascotControls = useAnimation();
  const shadowControls = useAnimation();
  const glowControls = useAnimation();

  // Entrance + Levitation animation sequence
  useEffect(() => {
    const sequence = async () => {
      // Phase 1: Entrance animation
      await mascotControls.start({
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1],
          delay: 0.2,
        },
      });

      // Phase 2: Continuous levitation
      mascotControls.start({
        y: [0, -10, 0, 10, 0],
        rotate: [0, 1.5, 0, -1.5, 0],
        transition: {
          duration: 5.0,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      });
    };

    // Shadow entrance + breathing
    const shadowSequence = async () => {
      await shadowControls.start({
        opacity: 0.45,
        scale: 1.05,
        transition: {
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1],
          delay: 0.2,
        },
      });

      shadowControls.start({
        scale: [1.05, 0.85, 1.05, 1.15, 1.05],
        opacity: [0.45, 0.28, 0.45, 0.52, 0.45],
        transition: {
          duration: 5.0,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      });
    };

    // Glow entrance
    const glowSequence = async () => {
      await glowControls.start({
        opacity: 0.3,
        scale: 1.3,
        transition: {
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1],
          delay: 0.2,
        },
      });
    };

    sequence();
    shadowSequence();
    glowSequence();
  }, [mascotControls, shadowControls, glowControls]);

  // Initial state for entrance
  const mascotInitial = {
    opacity: 0,
    scale: 0.92,
    y: 10,
  };

  const shadowInitial = {
    opacity: 0,
    scale: 0.9,
  };

  const glowInitial = {
    opacity: 0,
    scale: 1.1,
  };

  const handleOrderClick = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    } catch { /* noop */ }
    onOrderClick();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.1,
      }}
      className="relative w-full max-w-[95vw] mx-auto px-4 mb-12"
    >
      {/* Glass Card Container */}
      <div className="relative overflow-hidden rounded-[28px] bg-black/40 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/10">
        <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8 p-6 md:p-8 min-h-[320px] lg:min-h-[400px]">
          {/* Content Section (Left) */}
          <div className="flex-1 space-y-4 z-10 lg:max-w-[55%]">
            {/* Kicker */}
            <div className="text-[clamp(11px,2.5vw,12px)] font-semibold tracking-[0.15em] uppercase text-white/70">
              Анастасия Морок
            </div>

            {/* Title */}
            <h2 className="text-[clamp(24px,6vw,36px)] font-bold text-white leading-tight tracking-tight">
              Создаём уникальное вместе
            </h2>

            {/* Bio */}
            <p className="text-[clamp(14px,3.5vw,16px)] text-white/75 leading-relaxed">
              Каждая вещь — это история. Мы превращаем твои идеи в реальность, создавая кастомные изделия, которых нет ни у кого.
            </p>

            {/* Button */}
            <div className="pt-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleOrderClick}
                className="flex items-center justify-center gap-2 rounded-full px-6 py-3
                          bg-white/15 hover:bg-white/20 text-white font-medium
                          backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.2)]
                          transition-colors duration-200 text-[clamp(14px,3.5vw,16px)]"
              >
                Заказать кастом
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Mascot Section (Right) - Large hero element */}
          <div className="relative flex-shrink-0
                        w-full lg:w-auto
                        h-[clamp(240px,50vw,400px)] lg:h-[clamp(300px,45vh,450px)]
                        max-w-[clamp(280px,60vw,420px)] lg:max-w-[clamp(350px,40vw,500px)]
                        self-center lg:self-auto
                        pointer-events-none
                        lg:flex-1 lg:max-w-[45%]">
            {/* Soft Glow behind mascot */}
            <motion.div
              initial={glowInitial}
              animate={glowControls}
              className="absolute inset-0 rounded-full blur-3xl opacity-30"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 75%)',
              }}
            />

            {/* Levitating Shadow */}
            <motion.div
              initial={shadowInitial}
              animate={shadowControls}
              className="absolute bottom-0 left-1/2 lg:left-auto lg:right-0 -translate-x-1/2 lg:translate-x-0 translate-y-[65%] z-0"
              style={{
                width: 'clamp(160px, 35vw, 280px)',
                height: 'clamp(36px, 8vw, 64px)',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.4)',
                filter: 'blur(40px)',
                willChange: 'transform, opacity',
              }}
            />

            {/* Levitating Mascot */}
            <motion.div
              initial={mascotInitial}
              animate={mascotControls}
              className="relative w-full h-full z-10 flex items-center justify-center lg:justify-end"
            >
              <Image
                src="/lab/mascot.png"
                alt="ASKED LAB Artist"
                fill
                className="object-contain drop-shadow-2xl"
                sizes="(max-width: 1024px) 280px, 420px"
                unoptimized
                priority
                onError={() => setImageError(true)}
                style={{ display: imageError ? 'none' : 'block' }}
              />
              {imageError && (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-white/5 rounded-full border border-white/10">
                  <Sparkles className="w-20 h-20 text-white/40" />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}








