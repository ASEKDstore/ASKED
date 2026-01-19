'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

interface LabLoadingScreenProps {
  progress?: number; // 0 to 1, or undefined for looping
  userName?: string;
  avatarUrl?: string;
}

export function LabLoadingScreen({
  progress,
  userName,
  avatarUrl,
}: LabLoadingScreenProps): JSX.Element {
  const [strokeDashoffset, setStrokeDashoffset] = useState(0);
  
  // Generate unique gradient ID to avoid conflicts if multiple instances
  const gradientId = useMemo(() => `lab-progress-gradient-${Math.random().toString(36).substr(2, 9)}`, []);

  // Get user data from Telegram if not provided
  const [telegramUser, setTelegramUser] = useState<{
    name: string;
    avatarUrl?: string;
  } | null>(null);

  useEffect(() => {
    if (!userName && typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
      const user = window.Telegram.WebApp.initDataUnsafe.user;
      setTelegramUser({
        name: user.first_name || 'Пользователь',
        avatarUrl: user.photo_url,
      });
    }
  }, [userName]);

  const displayName = userName || telegramUser?.name || 'Пользователь';
  const displayAvatarUrl = avatarUrl || telegramUser?.avatarUrl;

  // Get user initials for fallback
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0]?.toUpperCase() || 'U';
  };

  // Path length for the oval (calculated for a rounded rectangle with radius 80px)
  // Width: ~320px (max-w-[320px] + padding), Height: ~200px (estimated)
  // For rounded rect: 2*(width - 2*r) + 2*(height - 2*r) + 2*π*r
  // Simplified: approximately 2*(160 + 40) + 2*π*80 ≈ 400 + 502 ≈ 902
  const pathLength = 920;

  // Calculate stroke animation
  useEffect(() => {
    if (progress !== undefined) {
      const offset = pathLength * (1 - progress);
      setStrokeDashoffset(offset);
    }
  }, [progress, pathLength]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Background with vignette */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/splash-bg.jpg')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-black/80" />
      <div
        className="absolute inset-0 opacity-10 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E")`,
          backgroundSize: '180px 180px',
        }}
      />

      {/* Center content */}
      <div className="relative z-10 w-full max-w-[320px] px-6">
        {/* Glass oval pill container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-[80px] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-8 pb-10"
          style={{
            boxShadow: '0 18px 60px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* SVG progress stroke on border */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 320 200"
            preserveAspectRatio="none"
            style={{ borderRadius: '80px' }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.4)" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0.8)" />
              </linearGradient>
            </defs>
            {/* Rounded rectangle path: traces the border of the pill */}
            <path
              d="M 80,0 Q 0,0 0,80 L 0,120 Q 0,200 80,200 L 240,200 Q 320,200 320,120 L 320,80 Q 320,0 240,0 L 80,0 Z"
              vectorEffect="non-scaling-stroke"
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLength}
              strokeDashoffset={progress === undefined ? strokeDashoffset : strokeDashoffset}
              className={progress === undefined ? 'lab-loading-stroke-animate' : ''}
              style={{
                opacity: 0.85,
                transition: progress !== undefined ? 'stroke-dashoffset 0.15s ease-out' : undefined,
                '--path-length': `${pathLength}`,
              } as React.CSSProperties & { '--path-length': string }}
            />
          </svg>
          {/* CSS for looping animation */}
          <style>{`
            @keyframes labLoadingStrokeLoop {
              0% {
                stroke-dashoffset: ${pathLength};
              }
              100% {
                stroke-dashoffset: 0;
              }
            }
            .lab-loading-stroke-animate {
              animation: labLoadingStrokeLoop 2s linear infinite;
            }
          `}</style>

          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-white/10 border-2 border-white/20 flex items-center justify-center">
              {displayAvatarUrl ? (
                <Image
                  src={displayAvatarUrl}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <span className="text-white/90 text-2xl font-bold">
                  {getInitials(displayName)}
                </span>
              )}
            </div>
          </div>

          {/* User name */}
          <div className="text-center mb-2">
            <h2 className="text-[clamp(20px, 5vw, 24px)] font-bold text-white tracking-tight">
              {displayName}
            </h2>
          </div>

          {/* LAB MOD text */}
          <div className="text-center mb-6">
            <p className="text-sm font-semibold text-white/80 tracking-[0.2em] uppercase">
              LAB MOD
            </p>
          </div>

          {/* ASKED store - tiny, subtle */}
          <div className="text-center">
            <p className="text-[10px] text-white/40 tracking-[0.15em] uppercase">
              ASKED store
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

