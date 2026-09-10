export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="glass-card max-w-md w-full p-8 rounded-2xl border border-white/10 shadow-glow-emerald">
        <h1 className="text-2xl font-bold tracking-tight text-emerald-400">
          FinPulse
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          Personal Financial Intelligence & Wealth Tracker
        </p>
        <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Fondasi Teknis Siap Digunakan
        </div>
      </div>
    </main>
  );
}
