'use client';

export function MaintenanceScreen(): JSX.Element {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center min-h-[100dvh] min-h-screen p-4 overflow-hidden bg-[#0a0a0a] bg-[url('/splash-bg.jpg'),linear-gradient(135deg,#1a1a1a_0%,#0a0a0a_100%)] bg-cover bg-center">
      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 30%, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.55) 55%, rgba(0, 0, 0, 0.82) 100%), linear-gradient(180deg, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.85))',
        }}
      />
      {/* Grain overlay */}
      <div
        className="absolute inset-[-40%] pointer-events-none opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.35'/%3E%3C/svg%3E")`,
          transform: 'rotate(8deg)',
        }}
      />

      {/* Content */}
      <main className="relative z-10 w-full max-w-[520px] px-6 py-8 flex flex-col items-center">
        <section className="relative w-full rounded-[26px] p-6 bg-[rgba(20,20,22,0.25)] border border-[rgba(255,255,255,0.08)] shadow-[0_18px_60px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-[16px] -webkit-backdrop-blur-[16px] flex flex-col items-start">
          <div className="text-center w-full mb-6">
            <h1 className="text-[32px] font-extrabold leading-tight text-[rgba(255,255,255,0.96)] mb-2">
              Опаньки
            </h1>
            <p className="text-[15px] leading-relaxed text-[rgba(255,255,255,0.72)]">
              Ведутся работы, наберись терпения торопыга
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

