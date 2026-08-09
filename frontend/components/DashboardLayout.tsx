import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07111c] text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-80 border-r border-white/10 bg-slate-950/70 p-6 lg:block">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cmblue-500 text-xl font-black text-white">
              CM
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-cmblue-300">CM HASH</p>
              <h1 className="text-2xl font-bold tracking-tight text-white">Control</h1>
            </div>
          </div>

          <nav className="space-y-2">
            <a className="flex items-center justify-between rounded-2xl border border-cmblue-400/40 bg-cmblue-500/10 px-4 py-3 text-sm font-semibold text-cmblue-100" href="/dashboard">
              <span>Overview</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </a>
            <a className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white" href="/dashboard">
              <span>Mining</span>
              <span className="text-xs text-slate-500">Live</span>
            </a>
            <a className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white" href="/dashboard">
              <span>Wallets</span>
              <span className="text-xs text-slate-500">2</span>
            </a>
            <a className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white" href="/admin">
              <span>Admin</span>
              <span className="text-xs text-slate-500">Panel</span>
            </a>
          </nav>

          <div className="mt-10 rounded-3xl border border-cmblue-300/30 bg-cmblue-500/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cmblue-200">Hash Output</p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-white">2.45</p>
                <p className="text-[10px] text-slate-400">TH/s</p>
              </div>
              <span className="rounded-full border border-emerald-300/50 bg-emerald-300/10 px-3 py-1 text-[10px] font-bold text-emerald-300">Online</span>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-5 lg:p-8">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-500">Mining Dashboard</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">CM HASH Admin Console</h2>
            </div>
            <div className="hidden items-center gap-4 lg:flex">
              <button className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">Notifications</button>
              <button className="rounded-2xl bg-cmblue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cmblue-400">Create contract</button>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
