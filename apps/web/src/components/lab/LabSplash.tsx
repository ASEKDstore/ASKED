'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LabSplashProps {
  onComplete: () => void;
}

export function LabSplash({ onComplete }: LabSplashProps): JSX.Element {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Wait for fade out
    }, 2500); // 2.5s delay

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div className="asked-splash">
            <div className="asked-splash__vignette" />
            <div className="asked-splash__grain" />

            <main className="asked-splash__center">
              <section className="asked-glass">
                <div className="asked-sticker asked-sticker--lab" aria-label="ASKED LAB">
                  <div className="asked-sticker__logo">ASKED</div>
                  <div className="asked-sticker__sub">LAB</div>
                </div>

                <div className="asked-text">
                  <div className="asked-kicker">Здесь создаётся</div>
                  <div className="asked-title">уникальное</div>
                  <div className="asked-subtitle">
                    Место, где идеи превращаются в реальность
                  </div>
                </div>

                <div className="asked-progress" role="progressbar" aria-label="Загрузка">
                  <div className="asked-progress__bar" />
                </div>
              </section>
            </main>

            <style jsx>{`
              .asked-splash {
                position: fixed;
                inset: 0;
                display: grid;
                place-items: center;
                background-image: url('/home-bg.jpg');
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                overflow: hidden;
              }
              .asked-splash__vignette {
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
              .asked-splash__grain {
                position: absolute;
                inset: -40%;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E");
                transform: rotate(8deg);
                opacity: 0.08;
                mix-blend-mode: overlay;
                pointer-events: none;
              }
              .asked-splash__center {
                position: relative;
                width: min(92vw, 520px);
                padding: 18px;
              }
              .asked-glass {
                position: relative;
                border-radius: 26px;
                padding: 22px 18px 18px;
                background: rgba(20, 20, 22, 0.40);
                border: 1px solid rgba(255, 255, 255, 0.10);
                box-shadow: 0 18px 60px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.08);
                backdrop-filter: blur(14px);
                -webkit-backdrop-filter: blur(14px);
              }
              .asked-sticker {
                width: 138px;
                border-radius: 18px;
                padding: 12px 14px 10px;
                background: rgba(245, 245, 245, 0.92);
                color: #0b0b0c;
                box-shadow: 0 10px 26px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.65);
                transform: rotate(-2.2deg);
                border: 1px solid rgba(0, 0, 0, 0.08);
                margin-bottom: 14px;
              }
              .asked-sticker--lab {
                background: rgba(0, 0, 0, 0.6);
                color: rgba(255, 255, 255, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.15);
              }
              .asked-sticker__logo {
                font-weight: 800;
                letter-spacing: 0.24em;
                font-size: 18px;
              }
              .asked-sticker__sub {
                margin-top: 4px;
                font-weight: 700;
                letter-spacing: 0.42em;
                font-size: 12px;
                opacity: 0.85;
              }
              .asked-text {
                padding: 6px 4px 10px;
              }
              .asked-kicker {
                font-size: 14px;
                letter-spacing: 0.06em;
                opacity: 0.75;
                color: rgba(255, 255, 255, 0.85);
              }
              .asked-title {
                margin-top: 6px;
                font-size: 28px;
                font-weight: 800;
                letter-spacing: 0.01em;
                color: rgba(255, 255, 255, 0.96);
                text-transform: none;
              }
              .asked-subtitle {
                margin-top: 8px;
                font-size: 14px;
                line-height: 1.35;
                color: rgba(255, 255, 255, 0.75);
              }
              .asked-progress {
                margin-top: 18px;
                height: 6px;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.10);
                overflow: hidden;
                border: 1px solid rgba(255, 255, 255, 0.10);
              }
              .asked-progress__bar {
                height: 100%;
                width: 38%;
                border-radius: 999px;
                background: rgba(255, 255, 255, 0.92);
                box-shadow: 0 0 18px rgba(255, 255, 255, 0.18);
                animation: move 1.1s ease-in-out infinite;
              }
              @keyframes move {
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
            `}</style>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

