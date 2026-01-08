'use client';

import { motion, useAnimation } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function LabPromoCard(): JSX.Element {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const mascotControls = useAnimation();
  const shadowControls = useAnimation();

  const handleLabClick = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    } catch { /* noop */ }
    router.push('/lab');
  };

  // Entrance + Levitation animation sequence
  useEffect(() => {
    const sequence = async () => {
      // Phase 1: Entrance animation
      await mascotControls.start({
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
          duration: 0.45,
          ease: [0.22, 1, 0.36, 1],
          delay: 0.14,
        },
      });

      // Phase 2: Continuous levitation
      mascotControls.start({
        y: [0, -8, 0, 8, 0],
        rotate: [0, 1.2, 0, -1.2, 0],
        transition: {
          duration: 4.5,
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
          duration: 0.45,
          ease: [0.22, 1, 0.36, 1],
          delay: 0.14,
        },
      });

      shadowControls.start({
        scale: [1.05, 0.88, 1.05, 1.12, 1.05],
        opacity: [0.45, 0.28, 0.45, 0.52, 0.45],
        transition: {
          duration: 4.5,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      });
    };

    sequence();
    shadowSequence();
  }, [mascotControls, shadowControls]);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.2,
      }}
      whileTap={{ scale: 0.99 }}
      className="relative w-full max-w-[95vw] mx-auto px-4"
      style={{ paddingBottom: 'clamp(24px, 6vw, 40px)' }}
    >
      {/* Glass Card Container - overflow visible to allow mascot to extend outside */}
      <div className="relative overflow-visible rounded-[28px] bg-black/40 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-white/10">
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6 p-6 md:p-8 min-h-[300px] md:min-h-[360px]">
          {/* Content Section (Left) */}
          <div className="flex-1 space-y-4 z-10 sm:pr-[120px] md:pr-[160px] lg:pr-[200px]">
            {/* Kicker */}
            <div className="text-[clamp(11px,2.5vw,12px)] font-semibold tracking-[0.15em] uppercase text-white/70">
              ASKED LAB
            </div>

            {/* Title */}
            <h2 className="text-[clamp(22px,5.5vw,32px)] font-bold text-white leading-tight tracking-tight">
              Место, где рождается кастом
            </h2>

            {/* Subtitle */}
            <p className="text-[clamp(14px,3.5vw,16px)] text-white/75 leading-relaxed max-w-md">
              Экспериментальные продукты и уникальные решения для тех, кто ищет нечто особенное
            </p>

            {/* Button */}
            <div className="pt-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleLabClick}
                className="flex items-center justify-center gap-2 rounded-full px-6 py-3 
                         bg-white/15 hover:bg-white/20 text-white font-medium 
                         backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.2)] 
                         transition-colors duration-200 text-[clamp(14px,3.5vw,16px)]"
              >
                Перейти в LAB
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Mascot Section (Right/Bottom) - Large hero element that overflows */}
          <div className="relative flex-shrink-0 
                        w-[clamp(170px,40vw,280px)] h-[clamp(170px,40vw,280px)]
                        md:absolute 
                        md:right-[clamp(-28px,-6vw,-12px)] 
                        md:bottom-[clamp(-42px,-7vw,-18px)]
                        self-center md:self-auto
                        pointer-events-none">
            {/* Soft Glow behind mascot - subtle premium effect */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.25 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="absolute inset-0 rounded-full blur-3xl"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 75%)',
                transform: 'scale(1.4)',
              }}
            />

            {/* Levitating Shadow - synchronized with mascot, larger for bigger mascot */}
            <motion.div
              initial={shadowInitial}
              animate={shadowControls}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[68%] z-0"
              style={{
                width: 'clamp(110px, 26vw, 200px)',
                height: 'clamp(26px, 6.5vw, 48px)',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.4)',
                filter: 'blur(36px)',
                willChange: 'transform, opacity',
              }}
            />

            {/* Levitating Mascot with entrance animation */}
            <motion.div
              initial={mascotInitial}
              animate={mascotControls}
              className="relative w-full h-full z-10"
            >
              <Image
                src="/lab/mascot.png"
                alt="ASKED LAB Mascot"
                fill
                className="object-contain drop-shadow-2xl"
                sizes="(max-width: 768px) 170px, 280px"
                unoptimized
                priority
                onError={() => setImageError(true)}
                style={{ display: imageError ? 'none' : 'block' }}
              />
              {imageError && (
                <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-white/5 rounded-full border border-white/10">
                  <Sparkles className="w-16 h-16 text-white/40" />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

