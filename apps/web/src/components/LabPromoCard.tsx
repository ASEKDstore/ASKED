'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export function LabPromoCard(): JSX.Element {
  const router = useRouter();

  const handleLabClick = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    } catch { /* noop */ }
    router.push('/lab');
  };

  const handleCustomClick = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    } catch { /* noop */ }
    router.push('/lab');
  };

  // Shared animation timing for mascot and shadow synchronization
  const sharedAnimationConfig = {
    duration: 4.2,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  };

  // Levitation animation for mascot
  const levitationAnimation = {
    y: [0, -12, 0] as [number, number, number],
    rotate: [0, 2, -2, 0] as [number, number, number, number],
    transition: sharedAnimationConfig,
  };

  // Shadow animation - inverse to mascot (when mascot goes up, shadow gets smaller and lighter)
  const shadowAnimation = {
    scale: [1.05, 0.85, 1.05] as [number, number, number],
    opacity: [0.45, 0.25, 0.45] as [number, number, number],
    transition: sharedAnimationConfig,
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
        <div className="relative flex flex-col md:flex-row items-start md:items-center gap-6 p-6 md:p-8">
          {/* Content Section (Left) */}
          <div className="flex-1 space-y-4 z-10">
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

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {/* Primary Button */}
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

              {/* Secondary Button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleCustomClick}
                className="flex items-center justify-center gap-2 rounded-full px-6 py-3 
                         bg-white/8 hover:bg-white/12 text-white/90 font-medium 
                         backdrop-blur-md border border-white/20 
                         transition-colors duration-200 text-[clamp(14px,3.5vw,16px)]"
              >
                Заказать кастом
              </motion.button>
            </div>
          </div>

          {/* Mascot Section (Right) - Absolutely positioned to overflow */}
          <div className="relative flex-shrink-0 w-[clamp(120px,30vw,200px)] h-[clamp(120px,30vw,200px)] 
                        md:w-[clamp(160px,25vw,240px)] md:h-[clamp(160px,25vw,240px)]
                        md:absolute md:right-[-clamp(20px,5vw,40px)] md:bottom-[-clamp(20px,5vw,40px)]
                        self-center md:self-auto">
            {/* Soft Glow behind mascot */}
            <div 
              className="absolute inset-0 rounded-full blur-2xl opacity-40"
              style={{
                background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                transform: 'scale(1.2)',
              }}
            />

            {/* Levitating Shadow - synchronized with mascot */}
            <motion.div
              animate={shadowAnimation}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[60%] z-0"
              style={{
                width: 'clamp(80px, 20vw, 140px)',
                height: 'clamp(20px, 5vw, 35px)',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.4)',
                filter: 'blur(28px)',
                willChange: 'transform, opacity',
              }}
            />

            {/* Levitating Mascot */}
            <motion.div
              animate={levitationAnimation}
              className="relative w-full h-full z-10"
            >
              <Image
                src="/lab/mascot.png"
                alt="ASKED LAB Mascot"
                fill
                className="object-contain drop-shadow-2xl"
                sizes="(max-width: 768px) 120px, 240px"
                unoptimized
              />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

