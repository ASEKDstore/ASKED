'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';

import { CustomSteps } from '@/components/CustomSteps';
import { HEADER_HEIGHT_PX } from '@/components/Header';
import { ArtistCard } from '@/components/lab/ArtistCard';
import { LabOrderFlow } from '@/components/lab/LabOrderFlow';
import { LabProductsCarousel } from '@/components/lab/LabProductsCarousel';
import { LabSplash } from '@/components/lab/LabSplash';
import { LabWorksCarousel } from '@/components/lab/LabWorksCarousel';
import { Button } from '@/components/ui/button';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';
import { useTelegram } from '@/hooks/useTelegram';
import { getTokenFromUrl } from '@/lib/admin-nav';
import { api } from '@/lib/api';
import { useLabLockStore } from '@/lib/lab-lock-store';

// Use local background image
const BG_IMAGE_URL = '/home-bg.jpg';

interface ProgressData {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
  isStepVisible: (index: number) => boolean;
  onBack: () => void;
}

export default function LabPage(): JSX.Element {
  const router = useRouter();
  const { initData, webApp } = useTelegram();
  const token = getTokenFromUrl();
  const hasDevToken = !!token && process.env.NEXT_PUBLIC_ADMIN_DEV_TOKEN === token;
  const [showSplash, setShowSplash] = useState(true);
  const [showOrderFlow, setShowOrderFlow] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const { labMaintenance, disableLabLockMode } = useLabLockStore();

  // Lock body scroll on LAB page
  useLockBodyScroll(true);

  // Calculate header height with safe area
  const headerTotalHeight = `calc(${HEADER_HEIGHT_PX}px + env(safe-area-inset-top, 0px))`;

  // Check if user is admin
  const { data: adminData } = useQuery({
    queryKey: ['admin', 'me', 'lab-page', token],
    queryFn: () => api.getAdminMe(null),
    enabled: (!!initData || hasDevToken) && labMaintenance,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const isAdmin = !!adminData;

  // Check LAB maintenance status
  const { data: labStatus } = useQuery({
    queryKey: ['lab-status'],
    queryFn: () => api.getLabStatus(),
    refetchOnWindowFocus: true,
    staleTime: 60 * 1000,
  });

  const isMaintenance = (labStatus?.maintenance === true || labMaintenance) && !isAdmin;

  // Handle exit from maintenance screen
  const handleExitMaintenance = useCallback(() => {
    // Disable lock mode to allow navigation
    disableLabLockMode();

    // Try to go back in history, fallback to home if no history
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      // No history, go to home
      router.replace('/');
    }
  }, [disableLabLockMode, router]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleOrderClick = () => {
    setShowOrderFlow(true);
  };

  const handleOrderComplete = async (data: {
    clothingType: string | null;
    size: string | null;
    colorChoice: string | null;
    customColor: string | null;
    placement: string | null;
    description: string;
    attachment: File | null;
  }) => {
    try {
      // Upload attachment if provided
      const attachmentUrl: string | null = null;
      if (data.attachment) {
        // TODO: Implement file upload to storage (S3, Cloudinary, etc.)
        // For now, we'll skip attachment upload
        console.warn('Attachment upload not yet implemented');
      }

      // Get user info from Telegram
      const telegramUser = webApp?.initDataUnsafe?.user;
      const customerName = telegramUser
        ? `${telegramUser.first_name || ''} ${telegramUser.last_name || ''}`.trim() || telegramUser.username || 'Не указано'
        : 'Не указано';
      const customerPhone = telegramUser?.username ? `@${telegramUser.username}` : 'Не указано';

      // Send LAB order to backend
      await api.createLabOrder(initData, {
        clothingType: data.clothingType,
        size: data.size,
        colorChoice: data.colorChoice,
        customColor: data.customColor,
        placement: data.placement,
        description: data.description,
        attachmentUrl,
        customerName,
        customerPhone,
      });

      // Close flow - success screen is shown in LabOrderFlow
      setShowOrderFlow(false);
    } catch (error) {
      console.error('Failed to submit LAB order:', error);
      // Show error to user
      console.error('Failed to submit LAB order:', error);
      alert('Не удалось отправить заказ. Попробуйте позже.');
    }
  };

  const handleCloseOrderFlow = () => {
    setShowOrderFlow(false);
    setProgress(null);
  };

  const handleProgressChange = (progressData: ProgressData) => {
    setProgress(progressData);
  };

  if (showOrderFlow) {
    return (
      <div className="fixed inset-0 overflow-hidden bg-black">
        {/* Background */}
        <div className="fixed inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
            style={{ backgroundImage: `url(${BG_IMAGE_URL})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black/80" />
        </div>

        {/* Order Flow */}
        <div
          className="relative z-10 h-full overflow-y-auto"
          style={{
            paddingTop: headerTotalHeight,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="relative">
            {/* Wizard Header with Back Button */}
            <div className="sticky top-0 z-30 bg-black/40 backdrop-blur-xl border-b border-white/10">
              <div className="flex items-center p-4">
                {/* Back Button */}
                {progress && (
                  <button
                    onClick={progress.onBack}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-black/30 backdrop-blur-xl 
                             border border-white/10 text-white hover:bg-black/40 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Назад</span>
                  </button>
                )}
              </div>
            </div>
            <LabOrderFlow onComplete={handleOrderComplete} onProgressChange={handleProgressChange} onExit={handleCloseOrderFlow} />
          </div>
        </div>
      </div>
    );
  }

  // Show maintenance screen if maintenance is ON and user is not admin
  if (isMaintenance && !showSplash) {
    return (
      <div className="fixed inset-0 overflow-hidden">
        {/* Fixed Background Layers */}
        <div className="fixed inset-0 z-0">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: `url(${BG_IMAGE_URL})`,
              backgroundAttachment: 'fixed',
            }}
          />
          {/* Dark Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/75" />
          {/* Blur Layer */}
          <div
            className="absolute inset-0 backdrop-blur-[12px]"
            style={{
              WebkitBackdropFilter: 'blur(12px)',
            }}
          />
          {/* Subtle Grain Texture */}
          <div
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E")`,
              backgroundSize: '180px 180px',
            }}
          />
        </div>

        {/* Maintenance Content */}
        <div
          className="relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-none flex items-center justify-center"
          style={{
            paddingTop: headerTotalHeight,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            paddingLeft: 'clamp(16px, 4vw, 24px)',
            paddingRight: 'clamp(16px, 4vw, 24px)',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="w-full max-w-md text-center space-y-6">
            {/* Message */}
            <div className="space-y-3">
              <h1 className="text-[clamp(24px, 6vw, 32px)] font-bold text-white mb-2">
                Опаньки, ведутся работы, наберись терпения торопыга
              </h1>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              {/* Exit button - primary */}
              <Button
                onClick={handleExitMaintenance}
                size="lg"
                className="w-full bg-white/95 text-black hover:bg-white border border-white/50 shadow-lg font-medium"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Назад
              </Button>

              {/* Secondary buttons */}
              <Button
                onClick={() => router.push('/profile')}
                size="lg"
                variant="outline"
                className="w-full bg-white/10 text-white hover:bg-white/20 border border-white/30 shadow-lg font-medium"
              >
                <User className="w-5 h-5 mr-2" />
                Профиль
              </Button>
              <Button
                onClick={() => router.push('/orders')}
                size="lg"
                variant="outline"
                className="w-full bg-white/10 text-white hover:bg-white/20 border border-white/30 shadow-lg font-medium"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Мои заказы
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Splash Screen */}
      {showSplash && <LabSplash onComplete={handleSplashComplete} />}

      {/* Main Content */}
      {!showSplash && (
        <div className="fixed inset-0 overflow-hidden">
          {/* Fixed Background Layers */}
          <div className="fixed inset-0 z-0">
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: `url(${BG_IMAGE_URL})`,
                backgroundAttachment: 'fixed',
              }}
            />

            {/* Dark Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/75" />

            {/* Blur Layer */}
            <div
              className="absolute inset-0 backdrop-blur-[12px]"
              style={{
                WebkitBackdropFilter: 'blur(12px)',
              }}
            />

            {/* Subtle Grain Texture */}
            <div
              className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E")`,
                backgroundSize: '180px 180px',
              }}
            />
          </div>

          {/* Scrollable Content Container */}
          <div
            className="relative z-10 h-full overflow-y-auto overflow-x-hidden overscroll-none"
            style={{
              paddingTop: headerTotalHeight,
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <div className="min-h-full flex flex-col items-center justify-start pb-16">
              {/* Artist Card - Hero */}
              <div className="w-full" style={{ paddingTop: 'clamp(24px, 6vw, 40px)', paddingBottom: 'clamp(24px, 6vw, 32px)' }}>
                <ArtistCard onOrderClick={handleOrderClick} />
              </div>

              {/* Ready Custom Works Carousel */}
              <LabProductsCarousel />

              {/* How It Works Section */}
              <div className="w-full" style={{ paddingBottom: 'clamp(32px, 8vw, 48px)' }}>
                <CustomSteps />
              </div>

              {/* Ready Works Carousel */}
              <div className="w-full" style={{ paddingBottom: 'clamp(32px, 8vw, 48px)' }}>
                <LabWorksCarousel />
              </div>

              {/* Bottom Spacing */}
              <div className="h-16" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
