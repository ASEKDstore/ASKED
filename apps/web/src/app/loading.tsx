'use client';

import React from 'react';

function getTelegramName(): string | null {
  try {
    const tg = window.Telegram?.WebApp;
    const name = tg?.initDataUnsafe?.user?.first_name;
    return typeof name === 'string' && name.trim().length ? name.trim() : null;
  } catch {
    return null;
  }
}

export default function Loading() {
  const [name, setName] = React.useState<string | null>(null);

  React.useEffect(() => {
    setName(getTelegramName());
  }, []);

  const userLabel = name ? name : 'друг';

  // Версию можно прокинуть через NEXT_PUBLIC_APP_VERSION, либо просто захардкодить.
  const version =
    process.env.NEXT_PUBLIC_APP_VERSION ||
    (typeof window !== 'undefined' && '__ASKED_VERSION__' in window
      ? String((window as { __ASKED_VERSION__?: unknown }).__ASKED_VERSION__ || '')
      : null) ||
    'v1.0.0';

  return (
    <div className="asked-splash">
      <div className="asked-splash__vignette" />
      <div className="asked-splash__grain" />

      <main className="asked-splash__center">
        <section className="asked-glass">
          <div className="asked-sticker" aria-label="ASKED Store">
            <div className="asked-sticker__logo">ASKED</div>
            <div className="asked-sticker__sub">STORE</div>
          </div>

          <div className="asked-text">
            <div className="asked-kicker">Добро пожаловать,</div>
            <div className="asked-title">{userLabel}</div>
            <div className="asked-subtitle">
              Готовим витрину, подтягиваем дропы и магию.
            </div>
          </div>

          <div className="asked-progress" role="progressbar" aria-label="Загрузка">
            <div className="asked-progress__bar" />
          </div>

          <div className="asked-hint">
            Если загрузка зависла — проверь сеть или перезапусти мини-апп.
          </div>
        </section>
      </main>

      <footer className="asked-footer">
        <div className="asked-footer__row">
          <span className="asked-footer__muted">{version}</span>
          <span className="asked-footer__dot">•</span>
          <span className="asked-footer__muted">ASKED Team</span>
          <span className="asked-footer__dot">•</span>
          <span className="asked-footer__muted">2025</span>
        </div>
        <div className="asked-footer__muted">All rights reserved.</div>
      </footer>

      <style jsx>{`
        .asked-splash {
          position: fixed;
          inset: 0;
          display: grid;
          place-items: center;
          background-image: url('https://i.pinimg.com/736x/6d/f0/af/6df0afde8de5dc77ad878c8917ec6ff0.jpg');
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

        /* Лёгкий "шум" как у премиальных UI */
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
          box-shadow:
            0 18px 60px rgba(0, 0, 0, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        /* "Наклейка" */
        .asked-sticker {
          width: 138px;
          border-radius: 18px;
          padding: 12px 14px 10px;
          background: rgba(245, 245, 245, 0.92);
          color: #0b0b0c;
          box-shadow:
            0 10px 26px rgba(0, 0, 0, 0.38),
            inset 0 1px 0 rgba(255, 255, 255, 0.65);
          transform: rotate(-2.2deg);
          border: 1px solid rgba(0, 0, 0, 0.08);
          margin-bottom: 14px;
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

        /* тонкий "живой" бар */
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

        .asked-hint {
          margin-top: 12px;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.55);
        }

        .asked-footer {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 14px;
          text-align: center;
          padding: 0 14px;
          color: rgba(255, 255, 255, 0.62);
          font-size: 12px;
          letter-spacing: 0.04em;
        }

        .asked-footer__row {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }

        .asked-footer__dot {
          opacity: 0.45;
        }

        .asked-footer__muted {
          opacity: 0.78;
        }
      `}</style>
    </div>
  );
}

