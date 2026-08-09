export default function DashboardHomePage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total Mined', '2.45 TH/s', '+12%'],
          ['Current Balance', '$1,578.25', '+$45.22'],
          ['Active Contracts', '07', '3 pending'],
          ['Network Hash Rate', '86.2 PH/s', 'Healthy'],
        ].map(([label, value, status]) => (
          <article className="rounded-3xl border border-white/10 bg-white/6 p-5 shadow-soft backdrop-blur-xl" key={label}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-500">{label}</span>
              <span className="rounded-full border border-emerald-300/40 px-3 py-1 text-[10px] font-bold text-emerald-300">{status}</span>
            </div>
            <p className="mt-6 text-3xl font-black tracking-tight text-white">{value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-3xl border border-white/10 bg-white/6 p-5 shadow-soft">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-slate-500">Mining Performance</p>
              <h3 className="mt-1 text-xl font-bold text-white">Live Operations</h3>
            </div>
            <span className="rounded-full border border-cmblue-300/50 px-3 py-1 text-[10px] font-bold text-cmblue-200">Running</span>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {[35, 50, 40, 72, 63, 80, 54, 66, 61, 78, 44, 58].map((value, index) => (
              <div className="flex h-32 items-end" key={index}>
                <div className="w-full rounded-t-xl bg-gradient-to-t from-cmblue-500 to-cmblue-300" style={{ height: `${value}%` }} />
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/6 p-5 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-slate-500">Recent Activity</p>
              <h3 className="mt-1 text-xl font-bold text-white">System Feed</h3>
            </div>
            <button className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold text-slate-300 transition hover:bg-white/10">Open</button>
          </div>
          <div className="space-y-3">
            {['Mining session synced', 'Wallet address verified', 'Reward payout approved'].map((event, index) => (
              <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-slate-950/30 px-3 py-2" key={event}>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                <div>
                  <p className="text-sm font-semibold text-white">{event}</p>
                  <p className="text-[10px] font-medium text-slate-500">{index === 0 ? '2 min ago' : index === 1 ? '15 min ago' : '42 min ago'}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
