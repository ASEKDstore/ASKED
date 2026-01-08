'use client';

import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Home,
  ShoppingCart,
  Grid3x3,
  FlaskConical,
  Star,
  Minus,
  Info,
  FileText,
  HelpCircle,
  Users,
  X,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useRef } from 'react';

import { Overlay } from './Overlay';

interface MenuItem {
  label: string;
  icon: LucideIcon;
  href: string;
  divider?: boolean;
}

const menuItems: MenuItem[] = [
  { label: 'Главная', icon: Home, href: '/' },
  { label: 'Корзина', icon: ShoppingCart, href: '/cart' },
  { label: 'Каталог', icon: Grid3x3, href: '/catalog' },
  { label: 'Lab mod', icon: FlaskConical, href: '/lab' },
  { label: 'Отзывы', icon: Star, href: '/reviews' },
  { label: '', icon: Minus, href: '', divider: true },
  { label: 'О нас', icon: Info, href: '/about' },
  { label: 'Доки', icon: FileText, href: '/docs' },
  { label: 'Помощь', icon: HelpCircle, href: '/help' },
  { label: 'Сотрудничество', icon: Users, href: '/partners' },
];

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

// iOS-like spring configuration for menu sheet
const menuSpringConfig = {
  type: 'spring' as const,
  damping: 42,
  stiffness: 450,
  mass: 0.9,
};

// iOS-like spring for menu items
const itemSpringConfig = {
  type: 'spring' as const,
  damping: 38,
  stiffness: 480,
  mass: 0.7,
};

// Drag threshold: 28% of sheet width to trigger close
const DRAG_THRESHOLD = 0.28;
const VELOCITY_THRESHOLD = 300; // pixels per second

export function SideMenu({ isOpen, onClose }: SideMenuProps): JSX.Element {
  const router = useRouter();
  const pathname = usePathname();
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleItemClick = (href: string) => {
    if (href && !href.startsWith('#')) {
      router.push(href);
      onClose();
    }
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const sheetWidth = sheetRef.current?.offsetWidth || 360;
    const threshold = sheetWidth * DRAG_THRESHOLD;
    const shouldClose =
      info.offset.x > threshold || info.velocity.x > VELOCITY_THRESHOLD;

    if (shouldClose) {
      onClose();
    }
  };

  return (
    <Overlay isOpen={isOpen} onClose={onClose} blur zIndex={40}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={sheetRef}
            data-menu-container
            tabIndex={-1}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={menuSpringConfig}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.08 }}
            onDragEnd={handleDragEnd}
            className="absolute top-0 right-0 h-full w-[min(85vw,360px)] bg-black/60 backdrop-blur-3xl overflow-hidden flex flex-col rounded-tl-[28px] rounded-bl-[28px] shadow-[0_0_60px_rgba(0,0,0,0.5)]"
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Close Button */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.25 }}
              className="relative flex items-center justify-between px-6 py-6"
            >
              <h2 className="text-white font-semibold text-[clamp(18px,5vw,20px)] tracking-tight">
                Меню
              </h2>
              
              {/* Close Button - Glass Style */}
              <button
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 rounded-[20px] bg-black/30 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.3)] active:opacity-70 transition-opacity duration-150 text-white"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto py-3 px-4">
              {menuItems.map((item, index) => {
                if (item.divider) {
                  return (
                    <motion.div
                      key={`divider-${index}`}
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{
                        delay: index * 0.035 + 0.1,
                        duration: 0.3,
                        type: 'spring',
                        stiffness: 300,
                        damping: 25,
                      }}
                      className="h-[0.5px] bg-white/10 mx-4 my-4"
                    />
                  );
                }

                if (!item.icon) {
                  return null;
                }

                const Icon = item.icon;
                const isActive = pathname === item.href;
                const isMainItem = index < 5; // First 5 items are main
                const staggerDelay = index * 0.035 + 0.08;
                
                return (
                  <motion.button
                    key={item.href || `item-${index}`}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{
                      delay: staggerDelay,
                      ...itemSpringConfig,
                    }}
                    onClick={() => handleItemClick(item.href)}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full flex items-center gap-4 px-5 py-4 text-left rounded-2xl transition-all min-h-[48px] mb-1 ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/90 hover:bg-white/6 active:bg-white/8'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${
                        isActive ? 'text-white' : 'text-white/80'
                      }`}
                      strokeWidth={isMainItem ? 2 : 2}
                    />
                    <span
                      className={`text-[clamp(15px,4vw,16px)] ${
                        isMainItem ? 'font-semibold' : 'font-normal'
                      }`}
                    >
                      {item.label}
                    </span>
                  </motion.button>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </Overlay>
  );
}

