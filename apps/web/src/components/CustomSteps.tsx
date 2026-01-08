'use client';

import { motion, useInView } from 'framer-motion';
import { Lightbulb, Palette, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Step {
  number: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    number: '01',
    icon: Lightbulb,
    title: 'Идея',
    description: 'Расскажи, что хочешь. Уточняем стиль и детали.',
  },
  {
    number: '02',
    icon: Palette,
    title: 'Создание',
    description: 'Художник делает дизайн. Согласовываем по шагам.',
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'Результат',
    description: 'Получаешь уникальную вещь, которой нет ни у кого.',
  },
];

export function CustomSteps(): JSX.Element {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [showShine, setShowShine] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        staggerChildren: 0.08,
        delayChildren: 0.12, // Cards start while line is drawing
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 14,
      scale: 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
  };

  // Progress line animation - draws from left to right
  const progressLineVariants = {
    hidden: { scaleX: 0, opacity: 0 },
    visible: {
      scaleX: 1,
      opacity: 1,
      transition: {
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        delay: 0.05, // Start slightly before cards
      },
    },
  };

  // Shine effect - one-time sweep across the line
  const shineVariants = {
    hidden: { x: '-10%', opacity: 0 },
    visible: {
      x: '110%',
      opacity: [0, 0.45, 0.45, 0],
      transition: {
        duration: 1.0,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
        delay: 0.25, // Start after line draw begins
        times: [0, 0.2, 0.8, 1], // Fade in, stay visible, fade out
      },
    },
  };

  // Trigger shine when section enters view
  useEffect(() => {
    if (isInView && !showShine) {
      setShowShine(true);
    }
  }, [isInView, showShine]);

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={containerVariants}
      className="relative w-full max-w-[95vw] mx-auto px-4"
      style={{ paddingBottom: 'clamp(32px, 8vw, 48px)' }}
    >
      {/* Content Container */}
      <div className="relative">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-[clamp(24px, 6vw, 36px)] font-bold text-white mb-3 tracking-tight">
            Как работает кастом
          </h2>
          <p className="text-[clamp(14px, 3.5vw, 16px)] text-white/70 max-w-2xl mx-auto">
            Три простых шага — и вещь становится твоей.
          </p>
        </div>

        {/* Steps Grid Container - relative for line positioning */}
        <div className="relative">
          {/* Progress Line - behind cards on desktop, hidden on mobile */}
          <motion.div
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={progressLineVariants}
            className="hidden md:block absolute left-0 right-0 h-[1.5px] bg-white/18"
            style={{
              top: '50%',
              transform: 'translateY(-50%)',
              transformOrigin: 'left',
              filter: 'blur(0.5px)',
            }}
          >
            {/* Shine Effect - one-time sweep, only on desktop */}
            {showShine && (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={shineVariants}
                className="absolute top-0 left-0 h-full w-[80px] pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.5) 50%, transparent 100%)',
                  willChange: 'transform, opacity',
                }}
                onAnimationComplete={() => {
                  // Hide shine after animation completes
                  setTimeout(() => setShowShine(false), 100);
                }}
              />
            )}
          </motion.div>

          {/* Steps Grid */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 z-10">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                variants={cardVariants}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.99 }}
                className="relative rounded-[24px] bg-black/30 backdrop-blur-xl 
                         border border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.3)]
                         p-6 md:p-8 transition-all duration-200"
              >
                {/* Step Number */}
                <div className="text-[clamp(32px, 8vw, 48px)] font-bold text-white/20 mb-4 tracking-tight">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="mb-4">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/10 
                                flex items-center justify-center backdrop-blur-md">
                    <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-[clamp(18px, 4.5vw, 22px)] font-bold text-white mb-2 tracking-tight">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-[clamp(14px, 3.5vw, 15px)] text-white/75 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

