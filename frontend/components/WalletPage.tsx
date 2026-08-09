import { FaArrowDown, FaArrowUp, FaHistory, FaWifi } from 'react-icons/fa';

const actions = [
  { label: 'Deposit', description: 'Add funds to your account', icon: FaArrowDown },
  { label: 'Withdraw', description: 'Request your earnings', icon: FaArrowUp },
  { label: 'Transaction History', description: 'View all transactions', icon: FaHistory },
];

const recent = [
  { label: 'Mining Reward', value: '+ $2.45', status: 'Completed' },
  { label: 'Deposit', value: '+ $50.00', status: 'Completed' },
  { label: 'Withdrawal', value: '- $25.00', status: 'Completed' },
];

export default function WalletPage() {
  return (
    <div className="min-h-screen px-4 pb-28 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Mobile View */}
        <section className="mobile-only glass-card mb-4 p-4">
          <div className="mb-3">
            <p className="text-[10px] text-slate-500">Wallet</p>
            <h1 className="mt-0.5 text-base font-semibold text-slate-900">CM HASH Wallet</h1>
          </div>

          {/* Credit/Debit Card Style Balance */}
          <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-cmblue-700 via-cmblue-600 to-cmblue-500 p-5 text-white shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
            <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-12 -left-6 h-36 w-36 rounded-full bg-white/5" />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.24em] text-cmblue-100/80">CM HASH</p>
                  <p className="mt-0.5 text-[10px] text-cmblue-100/60">Cloud Mining</p>
                </div>
                <FaWifi className="h-4 w-4 rotate-90 text-cmblue-100/70" />
              </div>

              <div className="mt-6">
                <p className="text-[9px] uppercase tracking-[0.2em] text-cmblue-100/70">Available Balance</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight">$1,578.25</p>
              </div>

              <div className="mt-6 flex items-end justify-between">
                <div>
                  <p className="text-[8px] uppercase tracking-[0.18em] text-cmblue-100/60">Card Holder</p>
                  <p className="mt-0.5 text-xs font-medium">MSa Monistar</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] uppercase tracking-[0.18em] text-cmblue-100/60">Expires</p>
                  <p className="mt-0.5 text-xs font-medium">12/28</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] uppercase tracking-[0.18em] text-cmblue-100/60">CVV</p>
                  <p className="mt-0.5 text-xs font-medium">•••</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 grid gap-2">
            {actions.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-[20px] border border-slate-200 bg-slate-50 px-3 py-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-cmblue-50 text-cmblue-600">
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.description}</p>
                  </div>
                </div>
                <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold text-slate-600">Go</span>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-[20px] border border-slate-200 bg-slate-50 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Recent Transactions</p>
              <button className="text-xs font-medium text-cmblue-600 transition hover:text-cmblue-700">View All</button>
            </div>
            <div className="mt-3 space-y-2">
              {recent.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-[18px] bg-white px-3 py-2.5 shadow-sm">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.status}</p>
                  </div>
                  <p className={`text-xs font-semibold ${item.value.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Desktop View */}
        <section className="desktop-only hidden glass-card p-5">
          <div className="mb-4">
            <p className="text-xs text-slate-500">Wallet</p>
            <h1 className="text-lg font-semibold text-slate-900">CM HASH Wallet</h1>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            {/* Credit/Debit Card Style Balance */}
            <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-cmblue-700 via-cmblue-600 to-cmblue-500 p-6 text-white shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
              <div className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full bg-white/10" />
              <div className="pointer-events-none absolute -bottom-14 -left-8 h-44 w-44 rounded-full bg-white/5" />
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-cmblue-100/80">CM HASH</p>
                    <p className="mt-0.5 text-[11px] text-cmblue-100/60">Cloud Mining</p>
                  </div>
                  <FaWifi className="h-5 w-5 rotate-90 text-cmblue-100/70" />
                </div>

                <div className="mt-8">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-cmblue-100/70">Available Balance</p>
                  <p className="mt-1 text-4xl font-semibold tracking-tight">$1,578.25</p>
                </div>

                <div className="mt-8 flex items-end justify-between">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.18em] text-cmblue-100/60">Card Holder</p>
                    <p className="mt-0.5 text-sm font-medium">MSa Monistar</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-[0.18em] text-cmblue-100/60">Expires</p>
                    <p className="mt-0.5 text-sm font-medium">12/28</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-[0.18em] text-cmblue-100/60">CVV</p>
                    <p className="mt-0.5 text-sm font-medium">•••</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              {actions.map((item) => (
                <div key={item.label} className="rounded-[20px] border border-white/70 bg-white/70 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-cmblue-50 text-cmblue-600">
                        <item.icon className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{item.label}</p>
                        <p className="text-[10px] text-slate-500">{item.description}</p>
                      </div>
                    </div>
                    <button className="rounded-full bg-cmblue-600 px-2.5 py-1 text-[10px] font-semibold text-white transition hover:bg-cmblue-700">Go</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Transaction History</p>
                <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
              </div>
              <button className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-900 shadow-sm transition hover:bg-slate-50">View all</button>
            </div>
            <div className="space-y-2">
              {recent.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-cmblue-50 text-cmblue-600">
                      <FaHistory className="h-3 w-3" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{item.label}</p>
                      <p className="text-[10px] text-slate-500">{item.status}</p>
                    </div>
                  </div>
                  <p className={`text-xs font-semibold ${item.value.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}