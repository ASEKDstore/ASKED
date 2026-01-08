'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

import { CustomSteps } from '@/components/CustomSteps';
import { HEADER_HEIGHT_PX } from '@/components/Header';
import { ArtistCard } from '@/components/lab/ArtistCard';
import { LabOrderFlow } from '@/components/lab/LabOrderFlow';
import { LabProductsCarousel } from '@/components/lab/LabProductsCarousel';
import { LabSplash } from '@/components/lab/LabSplash';
import { useLockBodyScroll } from '@/hooks/useLockBodyScroll';

// Use local background image
const BG_IMAGE_URL = '/home-bg.jpg';

export default function LabPage(): JSX.Element {
  const [showSplash, setShowSplash] = useState(true);
  const [showOrderFlow, setShowOrderFlow] = useState(false);

  // Lock body scroll on LAB page
  useLockBodyScroll(true);

  // Calculate header height with safe area
  const headerTotalHeight = `calc(${HEADER_HEIGHT_PX}px + env(safe-area-inset-top, 0px))`;

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleOrderClick = () => {
    setShowOrderFlow(true);
  };

  const handleOrderComplete = (data: {
    clothingType: string | null;
    size: string | null;
    color: string | null;
    placement: string | null;
    description: string;
  }) => {
    // TODO: Send order to backend API
    console.log('Order submitted:', data);
    // For now, just close the flow
    setShowOrderFlow(false);
    // Show success message or navigate
  };

  const handleCloseOrderFlow = () => {
    setShowOrderFlow(false);
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
            {/* Close Button */}
            <div className="sticky top-0 z-30 flex justify-end p-4 bg-black/40 backdrop-blur-xl">
              <button
                onClick={handleCloseOrderFlow}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-black/30 backdrop-blur-xl 
                         border border-white/10 text-white hover:bg-black/40 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <LabOrderFlow onComplete={handleOrderComplete} />
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

              {/* Bottom Spacing */}
              <div className="h-16" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
