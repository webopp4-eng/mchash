export default function AdminPanelPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-white/10 bg-white/6 p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-slate-500">Users</p>
            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-bold text-emerald-300">Active</span>
          </div>
          <p className="mt-6 text-4xl font-black text-white">24</p>
          <p className="mt-2 text-[10px] text-slate-500">Active platform users</p>
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/6 p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-slate-500">Revenue</p>
            <span className="rounded-full bg-cmblue-500/10 px-3 py-1 text-[10px] font-bold text-cmblue-200">Live</span>
          </div>
          <p className="mt-6 text-4xl font-black text-white">$12.9k</p>
          <p className="mt-2 text-[10px] text-slate-500">Monthly recurring revenue</p>
        </article>

        <article className="rounded-3xl border border-white/10 bg-white/6 p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-slate-500">Alerts</p>
            <span className="rounded-full bg-amber-400/10 px-3 py-1 text-[10px] font-bold text-amber-300">2</span>
          </div>
          <p className="mt-6 text-4xl font-black text-white">03</p>
          <p className="mt-2 text-[10px] text-slate-500">Open monitoring alerts</p>
        </article>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-slate-500">Admin Operations</p>
            <h3 className="mt-1 text-2xl font-bold text-white">Maintenance Queue</h3>
          </div>
          <button className="rounded-2xl bg-cmblue-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-cmblue-400">Run task</button>
        </div>
        <div className="space-y-3">
          {['Sync miner inventory', 'Validate wallet signatures', 'Refresh reward schedule'].map((item, index) => (
            <div className="flex items-center justify-between rounded-2xl border border-white/6 px-4 py-3" key={item}>
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full bg-cmblue-300" />
                <div>
                  <p className="text-sm font-bold text-white">{item}</p>
                  <p className="text-[10px] text-slate-500">Priority {index + 1}</p>
                </div>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-bold text-slate-300">Queued</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
