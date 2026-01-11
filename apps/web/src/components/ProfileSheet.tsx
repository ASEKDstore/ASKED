'use client';

import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { User as UserIcon, X, Package, Shield, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';

import { useTelegramUser } from '@/hooks/useTelegramUser';

import { Overlay } from './Overlay';

interface ProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

// iOS-like spring for profile sheet
const profileSpringConfig = {
  type: 'spring' as const,
  damping: 42,
  stiffness: 450,
  mass: 0.9,
};

// Drag threshold: 28% of sheet height to trigger close
const DRAG_THRESHOLD = 0.28;
const VELOCITY_THRESHOLD = 400; // pixels per second

// Exit spring config (slightly faster for close animation)
const exitSpringConfig = {
  type: 'spring' as const,
  damping: 40,
  stiffness: 400,
  mass: 0.8,
};

export function ProfileSheet({ isOpen, onClose }: ProfileSheetProps): JSX.Element {
  const router = useRouter();
  const { user } = useTelegramUser();
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleOrdersClick = () => {
    router.push('/profile');
    onClose();
  };

  const handleAdminClick = () => {
    // Haptic feedback
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.('light');
    } catch {
      // Ignore if not in Telegram
    }
    // Always pass dev token from environment variable
    const devToken = process.env.NEXT_PUBLIC_ADMIN_DEV_TOKEN || '';
    const adminUrl = devToken ? `/admin?token=${encodeURIComponent(devToken)}` : '/admin';
    router.push(adminUrl);
    onClose();
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const sheetHeight = sheetRef.current?.offsetHeight || 600;
    const threshold = sheetHeight * DRAG_THRESHOLD;
    const shouldClose =
      info.offset.y > threshold || info.velocity.y > VELOCITY_THRESHOLD;

    if (shouldClose) {
      onClose();
    }
    // If threshold not met, the dragConstraints and spring will automatically snap back
  };

  // Variants for the sheet animation
  const sheetVariants = {
    hidden: {
      y: '100%',
      opacity: 0,
      transition: exitSpringConfig,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: profileSpringConfig,
    },
    exit: {
      y: '100%',
      opacity: 0,
      transition: exitSpringConfig,
    },
  };

  const displayName =
    user?.first_name && user?.last_name
      ? `${user.first_name} ${user.last_name}`
      : user?.first_name || 'Гость';

  // Check if user is admin (telegramId 930749603)
  const isAdminUser = user?.id === 930749603;

  return (
    <Overlay isOpen={isOpen} onClose={onClose} blur zIndex={50}>
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="profile-sheet"
            ref={sheetRef}
            data-profile-container
            tabIndex={-1}
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.1 }}
            onDragEnd={handleDragEnd}
            className="absolute inset-x-0 bottom-0 h-[calc(100vh-env(safe-area-inset-bottom,0px))] bg-black/60 backdrop-blur-3xl overflow-hidden flex flex-col rounded-t-[28px] shadow-[0_0_60px_rgba(0,0,0,0.5)] pointer-events-auto"
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar with Title and Close Button */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.25 }}
              className="relative flex items-center justify-between px-6 py-6 flex-shrink-0"
            >
              <h2 className="text-white font-semibold text-[clamp(18px,5vw,20px)] tracking-tight">
                Профиль
              </h2>
              
              {/* Close Button - Glass Style */}
              <button
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 rounded-[20px] bg-black/30 backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.3)] active:opacity-70 transition-opacity duration-150 text-white"
                aria-label="Close profile"
              >
                <X className="w-5 h-5" />
              </button>
            </motion.div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-8">
              {/* Avatar & Name */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="flex flex-col items-center gap-6 pt-8"
              >
                <div className="relative w-24 h-24 rounded-full bg-white/10 overflow-hidden shadow-lg">
                  {user?.photo_url ? (
                    <Image
                      src={user.photo_url}
                      alt={displayName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserIcon className="w-12 h-12 text-white/60" />
                    </div>
                  )}
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-white font-bold text-2xl">{displayName}</h3>
                  {user?.username && (
                    <p className="text-white/60 text-base">@{user.username}</p>
                  )}
                  {user?.id && (
                    <p className="text-white/40 text-sm mt-2">ID: {user.id}</p>
                  )}
                </div>
              </motion.div>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.3 }}
                className="space-y-3 px-2"
              >
                <motion.button
                  onClick={handleOrdersClick}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  className="w-full h-14 rounded-full bg-white/10 hover:bg-white/15 active:bg-white/20 text-white shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all flex items-center justify-center px-6"
                >
                  <Package className="w-5 h-5 mr-3" />
                  <span className="text-base font-medium">Мои заказы</span>
                </motion.button>

                {isAdminUser && (
                  <motion.button
                    onClick={handleAdminClick}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="w-full h-14 rounded-full bg-white/10 hover:bg-white/15 active:bg-white/20 text-white shadow-[0_4px_16px_rgba(0,0,0,0.2)] transition-all flex items-center justify-center px-6"
                  >
                    <Shield className="w-5 h-5 mr-3" />
                    <span className="text-base font-medium">Войти в админку</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </motion.button>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Overlay>
  );
}

