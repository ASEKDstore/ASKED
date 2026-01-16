'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { PortfolioCard } from './PortfolioCard';

interface PortfolioWork {
  id: string;
  title: string;
  description: string;
  images: string[];
  rating: number;
  reviewCount: number;
}

interface PortfolioSectionProps {
  onOrderClick: () => void;
}

// Mock data - will be replaced with API data later
const mockWorks: PortfolioWork[] = [
  {
    id: '1',
    title: 'Кастомная худи с принтом',
    description: 'Уникальный дизайн с персонализированным принтом. Качественная ткань и долговечная печать.',
    images: ['/lab/hudi.png', '/lab/mascot.png'],
    rating: 4.8,
    reviewCount: 12,
  },
  {
    id: '2',
    title: 'Футболка с авторским дизайном',
    description: 'Эксклюзивный принт, созданный специально для клиента. Яркие цвета и стойкая печать.',
    images: ['/lab/t-short.png'],
    rating: 4.9,
    reviewCount: 8,
  },
  {
    id: '3',
    title: 'Кастомная толстовка',
    description: 'Индивидуальный дизайн с учетом всех пожеланий. Премиум качество материалов.',
    images: ['/lab/mascot.png', '/lab/hudi.png'],
    rating: 4.7,
    reviewCount: 15,
  },
];

export function PortfolioSection({ onOrderClick }: PortfolioSectionProps): JSX.Element {
  const handleOrderClick = () => {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    } catch { /* noop */ }
    onOrderClick();
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-[95vw] mx-auto px-4"
      style={{ paddingBottom: 'clamp(32px, 8vw, 48px)' }}
    >
      {/* Header */}
      <div className="text-center mb-8 md:mb-12">
        <h2 className="text-[clamp(24px, 6vw, 36px)] font-bold text-white mb-3 tracking-tight">
          Готовые работы
        </h2>
        <p className="text-[clamp(14px, 3.5vw, 16px)] text-white/70 max-w-2xl mx-auto">
          Примеры кастомов от ASKED LAB
        </p>
      </div>

      {/* Portfolio Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {mockWorks.map((work) => (
          <PortfolioCard key={work.id} work={work} />
        ))}
      </div>

      {/* CTA Button */}
      <div className="flex justify-center">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleOrderClick}
          className="flex items-center justify-center gap-2 rounded-full px-6 py-3
                    bg-white/15 hover:bg-white/20 text-white font-medium
                    backdrop-blur-md shadow-[0_4px_16px_rgba(0,0,0,0.2)]
                    transition-colors duration-200 text-[clamp(14px,3.5vw,16px)]"
        >
          Хочу такой же кастом
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.section>
  );
}

