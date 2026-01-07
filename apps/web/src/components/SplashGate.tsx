'use client';

import React, { useEffect, useState, useCallback } from 'react';

const SPLASH_DURATION_MS = 5000;

function getTelegramName(): string | null {
  try {
    const tg = (window as any)?.Telegram?.WebApp;
    const name = tg?.initDataUnsafe?.user?.first_name;
    return typeof name === 'string' && name.trim().length ? name.trim() : null;
  } catch {
    return null;
  }
}

interface SplashGateProps {
  children: React.ReactNode;
}

export function SplashGate({ children }: SplashGateProps): JSX.Element {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [name, setName] = useState<string | null>(null);

  const hideSplash = useCallback(() => {
    setIsFadingOut(true);
    // Wait for fade-out animation to complete
    setTimeout(() => {
      setIsVisible(false);
    }, 400);
  }, []);

  useEffect(() => {
    // Get Telegram user name
    setName(getTelegramName());

    // Hide splash after duration
    const timer = setTimeout(hideSplash, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
  }, [hideSplash]);

  const userLabel = name || 'друг';

  const version =
    process.env.NEXT_PUBLIC_APP_VERSION ||
    (typeof window !== 'undefined' ? (window as any).__ASKED_VERSION__ : null) ||
    'v1.0.0';

  return (
    <>
      {children}

      {isVisible && (
        <div
          className={`splash-overlay ${isFadingOut ? 'splash-overlay--fade-out' : ''}`}
          aria-hidden={isFadingOut}
        >
          <div className="splash-vignette" />
          <div className="splash-grain" />

          <main className="splash-center">
            <section className="splash-glass">
              <div className="splash-sticker" aria-label="ASKED Store">
                <div className="splash-sticker__logo">ASKED</div>
                <div className="splash-sticker__sub">STORE</div>
              </div>

              <div className="splash-text">
                <div className="splash-kicker">Добро пожаловать,</div>
                <div className="splash-title">{userLabel}</div>
                <div className="splash-subtitle">
                  Готовим витрину, подтягиваем дропы и магию.
                </div>
              </div>

              <div className="splash-progress" role="progressbar" aria-label="Загрузка">
                <div className="splash-progress__bar" />
              </div>

              <div className="splash-hint">
                Если загрузка зависла — проверь сеть или выкинь свой телефон
              </div>
            </section>
          </main>

          <footer className="splash-footer">
            <div className="splash-footer__row">
              <span className="splash-footer__muted">{version}</span>
              <span className="splash-footer__dot">•</span>
              <span className="splash-footer__muted">ASKED Team</span>
              <span className="splash-footer__dot">•</span>
              <span className="splash-footer__muted">2025</span>
            </div>
            <div className="splash-footer__muted">All rights reserved.</div>
          </footer>

          <style jsx>{`
            .splash-overlay {
              position: fixed;
              inset: 0;
              z-index: 9999;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100dvh;
              min-height: -webkit-fill-available;
              padding: env(safe-area-inset-top, 0) env(safe-area-inset-right, 0)
                env(safe-area-inset-bottom, 0) env(safe-area-inset-left, 0);
              background-color: #0a0a0a;
              background-image: url('/splash-bg.jpg'), linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
              background-size: cover, 100% 100%;
              background-position: center, center;
              background-repeat: no-repeat, no-repeat;
              overflow: hidden;
              opacity: 1;
              transition: opacity 0.4s ease-out;
            }

            .splash-overlay--fade-out {
              opacity: 0;
              pointer-events: none;
            }

            .splash-vignette {
              position: absolute;
              inset: 0;
              background: radial-gradient(
                  circle at 50% 30%,
                  rgba(0, 0, 0, 0.15) 0%,
                  rgba(0, 0, 0, 0.55) 55%,
                  rgba(0, 0, 0, 0.82) 100%
                ),
                linear-gradient(180deg, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.85));
              pointer-events: none;
            }

            .splash-grain {
              position: absolute;
              inset: -40%;
              background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E");
              transform: rotate(8deg);
              opacity: 0.08;
              mix-blend-mode: overlay;
              pointer-events: none;
            }

            .splash-center {
              position: relative;
              width: min(92vw, 520px);
              padding: clamp(12px, 4vw, 24px);
              display: flex;
              flex-direction: column;
              align-items: center;
            }

            .splash-glass {
              position: relative;
              width: 100%;
              border-radius: clamp(18px, 5vw, 26px);
              padding: clamp(16px, 5vw, 28px) clamp(14px, 4vw, 22px);
              background: rgba(20, 20, 22, 0.25);
              border: 1px solid rgba(255, 255, 255, 0.08);
              box-shadow:
                0 18px 60px rgba(0, 0, 0, 0.35),
                inset 0 1px 0 rgba(255, 255, 255, 0.05);
              backdrop-filter: blur(16px);
              -webkit-backdrop-filter: blur(16px);
              display: flex;
              flex-direction: column;
              align-items: flex-start;
            }

            .splash-sticker {
              width: clamp(110px, 30vw, 140px);
              border-radius: clamp(14px, 4vw, 18px);
              padding: clamp(10px, 3vw, 14px) clamp(12px, 3.5vw, 16px);
              background: rgba(10, 10, 12, 0.95);
              color: rgba(255, 255, 255, 0.96);
              box-shadow:
                0 10px 26px rgba(0, 0, 0, 0.55),
                inset 0 1px 0 rgba(255, 255, 255, 0.15);
              transform: rotate(-2.2deg);
              border: 1px solid rgba(255, 255, 255, 0.12);
              margin-bottom: clamp(12px, 3vw, 18px);
            }

            .splash-sticker__logo {
              font-weight: 800;
              letter-spacing: 0.24em;
              font-size: clamp(14px, 4vw, 18px);
            }

            .splash-sticker__sub {
              margin-top: clamp(2px, 1vw, 4px);
              font-weight: 700;
              letter-spacing: 0.42em;
              font-size: clamp(9px, 2.5vw, 12px);
              opacity: 0.85;
            }

            .splash-text {
              padding: clamp(4px, 1.5vw, 8px) clamp(2px, 1vw, 4px);
              width: 100%;
            }

            .splash-kicker {
              font-size: clamp(12px, 3.5vw, 15px);
              letter-spacing: 0.06em;
              opacity: 0.75;
              color: rgba(255, 255, 255, 0.85);
            }

            .splash-title {
              margin-top: clamp(4px, 1.5vw, 8px);
              font-size: clamp(22px, 7vw, 32px);
              font-weight: 800;
              letter-spacing: 0.01em;
              color: rgba(255, 255, 255, 0.96);
              text-transform: none;
              word-break: break-word;
            }

            .splash-subtitle {
              margin-top: clamp(6px, 2vw, 10px);
              font-size: clamp(12px, 3.5vw, 15px);
              line-height: 1.4;
              color: rgba(255, 255, 255, 0.72);
            }

            .splash-progress {
              margin-top: clamp(14px, 4vw, 22px);
              width: 100%;
              height: clamp(5px, 1.5vw, 7px);
              border-radius: 999px;
              background: rgba(255, 255, 255, 0.10);
              overflow: hidden;
              border: 1px solid rgba(255, 255, 255, 0.10);
            }

            .splash-progress__bar {
              height: 100%;
              width: 38%;
              border-radius: 999px;
              background: rgba(255, 255, 255, 0.92);
              box-shadow: 0 0 18px rgba(255, 255, 255, 0.18);
              animation: splash-move 1.1s ease-in-out infinite;
            }

            @keyframes splash-move {
              0% {
                transform: translateX(-55%);
                opacity: 0.65;
              }
              50% {
                transform: translateX(85%);
                opacity: 1;
              }
              100% {
                transform: translateX(210%);
                opacity: 0.65;
              }
            }

            .splash-hint {
              margin-top: clamp(10px, 3vw, 16px);
              font-size: clamp(10px, 2.8vw, 12px);
              color: rgba(255, 255, 255, 0.50);
              line-height: 1.4;
            }

            .splash-footer {
              position: absolute;
              left: 0;
              right: 0;
              bottom: calc(env(safe-area-inset-bottom, 0px) + clamp(10px, 3vw, 18px));
              text-align: center;
              padding: 0 clamp(12px, 4vw, 20px);
              color: rgba(255, 255, 255, 0.60);
              font-size: clamp(10px, 2.8vw, 12px);
              letter-spacing: 0.04em;
            }

            .splash-footer__row {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: clamp(6px, 2vw, 10px);
              margin-bottom: clamp(4px, 1.5vw, 8px);
              flex-wrap: wrap;
            }

            .splash-footer__dot {
              opacity: 0.45;
            }

            .splash-footer__muted {
              opacity: 0.78;
            }

            /* Handle very small screens */
            @media (max-height: 500px) {
              .splash-center {
                padding: 8px;
              }
              .splash-glass {
                padding: 12px 10px;
              }
              .splash-footer {
                position: relative;
                bottom: auto;
                margin-top: 12px;
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
}

