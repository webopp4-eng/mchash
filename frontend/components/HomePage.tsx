import { FaArrowDown, FaArrowUp, FaBolt, FaCoins, FaGift, FaHistory, FaUserCircle, FaWallet } from 'react-icons/fa';
import WalletConnectionPanel from './WalletConnectionPanel';

const quickStats = [
  { label: 'Total Mined', value: '2.45 TH/s', icon: FaCoins },
  { label: 'Active Plan', value: '7 Days', icon: FaWallet },
  { label: 'Earnings', value: '$24.60', icon: FaArrowUp },
  { label: 'Next Payout', value: '05:24:10', icon: FaHistory },
];

const transactions = [
  { label: 'Mining Reward', value: '+ $2.45', time: '2 min ago', type: 'Mining', icon: FaBolt, iconBg: 'bg-cmblue-50', iconColor: 'text-cmblue-600', positive: true },
  { label: 'Deposit', value: '+ $50.00', time: 'Aug 05, 2025', type: 'Deposit', icon: FaArrowDown, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', positive: true },
  { label: 'Withdrawal', value: '- $25.00', time: 'Aug 04, 2025', type: 'Withdrawal', icon: FaArrowUp, iconBg: 'bg-rose-50', iconColor: 'text-rose-600', positive: false },
  { label: 'Referral Bonus', value: '+ $10.00', time: 'Aug 03, 2025', type: 'Bonus', icon: FaGift, iconBg: 'bg-amber-50', iconColor: 'text-amber-600', positive: true },
  { label: 'Mining Reward', value: '+ $2.45', time: 'Aug 02, 2025', type: 'Mining', icon: FaBolt, iconBg: 'bg-cmblue-50', iconColor: 'text-cmblue-600', positive: true },
];

export default function HomePage() {
  return (
    <div className="min-h-screen px-4 pb-28 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Mobile View */}
        <section className="mobile-only glass-card mb-4 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/80 bg-white/80 px-2.5 py-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cmblue-50 text-cmblue-700">
                <FaUserCircle className="h-3.5 w-3.5" />
              </span>
              <div>
                <p className="text-xs font-medium text-slate-900">MSa Monistar</p>
                <p className="text-[9px] text-slate-500">msa@monistar.com</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500">Welcome back,</p>
              <h1 className="mt-0.5 text-base font-semibold text-slate-900">CM HASH</h1>
            </div>
          </div>

          <div className="relative mt-4 overflow-hidden rounded-[24px] bg-gradient-to-br from-cmblue-600 to-cmblue-500 p-4 text-white shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
            <div className="pointer-events-none absolute right-3 top-3 text-[3rem] opacity-10">💼</div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-cmblue-100/70">Total Balance</p>
            <p className="mt-2 text-2xl font-semibold">$1,578.25</p>
            <p className="mt-0.5 text-[10px] text-cmblue-100/80">+12.45% this week</p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {quickStats.map((item) => (
              <div key={item.label} className="rounded-[18px] border border-slate-200 bg-slate-50 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                <div className="flex items-center gap-2 text-slate-900">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-cmblue-600 shadow-sm">
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold">{item.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="rounded-2xl bg-cmblue-600 px-3 py-2 text-[11px] font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.24)] transition hover:bg-cmblue-700">
              Deposit
            </button>
            <button className="rounded-2xl border border-white/80 bg-white px-3 py-2 text-[11px] font-semibold text-slate-900 shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition hover:bg-slate-100">
              Withdraw
            </button>
          </div>

          <div className="mt-3">
            <WalletConnectionPanel compact showTitle={false} />
          </div>
        </section>

        {/* Desktop View */}
        <section className="desktop-only hidden glass-card p-5">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cmblue-50 text-cmblue-700">
                <FaUserCircle className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-slate-900">MSa Monistar</p>
                <p className="text-[10px] text-slate-500">msa@monistar.com</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Welcome back,</p>
              <h1 className="text-xl font-semibold text-slate-900">CM HASH Dashboard</h1>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-cmblue-600 to-cmblue-500 p-5 text-white shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
                <div className="pointer-events-none absolute right-6 top-6 text-[3rem] opacity-10">💼</div>
                <p className="text-[10px] uppercase tracking-[0.28em] text-cmblue-100/80">Total Balance</p>
                <p className="mt-2 text-3xl font-semibold">$1,578.25</p>
                <p className="mt-0.5 text-[11px] text-cmblue-100/80">+12.45% this week</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button className="rounded-2xl bg-white/20 px-3 py-2 text-[11px] font-semibold text-white backdrop-blur transition hover:bg-white/30">
                    Deposit
                  </button>
                  <button className="rounded-2xl border border-white/40 bg-white/10 px-3 py-2 text-[11px] font-semibold text-white backdrop-blur transition hover:bg-white/20">
                    Withdraw
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {quickStats.map((item) => (
                  <div key={item.label} className="rounded-[18px] bg-slate-50 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                    <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] bg-white/90 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)]">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Recent Activity</p>
                  <h2 className="text-base font-semibold text-slate-900">Transactions</h2>
                </div>
                <button className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-900 shadow-sm transition hover:bg-slate-50">
                  View all
                </button>
              </div>
              <div className="space-y-2">
                {transactions.slice(0, 3).map((item) => (
                  <div key={item.label + item.time} className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-xl ${item.iconBg} ${item.iconColor}`}>
                        <item.icon className="h-3 w-3" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{item.label}</p>
                        <p className="text-[10px] text-slate-500">{item.time}</p>
                      </div>
                    </div>
                    <p className={`text-xs font-semibold ${item.positive ? 'text-emerald-600' : 'text-rose-600'}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] bg-white/90 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)]">
              <WalletConnectionPanel compact showTitle={true} darkMode={false} />
            </div>
          </div>
        </section>

        {/* Transaction History - visible on both mobile & desktop */}
        <section className="mt-4 glass-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Complete account activity</p>
              <h2 className="text-base font-semibold text-slate-900">Transaction History</h2>
            </div>
            <button className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-900 shadow-sm transition hover:bg-slate-50">
              View all
            </button>
          </div>
          <div className="grid gap-2 lg:grid-cols-2">
            {transactions.map((item) => (
              <div key={item.label + item.time} className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${item.iconBg} ${item.iconColor}`}>
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.time} • {item.type}</p>
                  </div>
                </div>
                <p className={`text-xs font-semibold ${item.positive ? 'text-emerald-600' : 'text-rose-600'}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}