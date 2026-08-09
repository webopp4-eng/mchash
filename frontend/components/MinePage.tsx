import { FaBolt, FaClock, FaChartLine, FaCoins, FaCalendarAlt, FaCheckCircle, FaLink, FaGift, FaWallet } from 'react-icons/fa';

const stats = [
  { label: 'Mining Plan', value: '7 Days', icon: FaClock },
  { label: 'Daily Earnings', value: '$2.45', icon: FaBolt },
  { label: 'Total Earned', value: '$24.60', icon: FaChartLine },
];

const miningDetails = [
  { label: 'Mining Plan', value: 'Gold Plan', icon: FaBolt, badge: 'Active', badgeColor: 'bg-emerald-50 text-emerald-700' },
  { label: 'Paid Plan', value: '$50.00', icon: FaWallet, badge: 'Paid', badgeColor: 'bg-cmblue-50 text-cmblue-700' },
  { label: 'Status', value: 'Mining in progress', icon: FaCheckCircle, badge: 'Running', badgeColor: 'bg-emerald-50 text-emerald-700' },
  { label: 'Contract Address', value: '0x8f3C...aB72', icon: FaLink, badge: 'Verified', badgeColor: 'bg-cmblue-50 text-cmblue-700' },
  { label: 'Hash Rate', value: '2.45 TH/s', icon: FaBolt, badge: 'Optimal', badgeColor: 'bg-emerald-50 text-emerald-700' },
  { label: 'Start Time', value: 'Aug 01, 2025 09:00', icon: FaCalendarAlt, badge: '-', badgeColor: 'bg-slate-100 text-slate-600' },
  { label: 'End Time', value: 'Aug 08, 2025 09:00', icon: FaCalendarAlt, badge: '-', badgeColor: 'bg-slate-100 text-slate-600' },
  { label: 'Live Countdown', value: '5D 12h 24m 36s', icon: FaClock, badge: '72%', badgeColor: 'bg-cmblue-50 text-cmblue-700' },
  { label: 'Daily Earnings', value: '$2.45 / day', icon: FaBolt, badge: '+', badgeColor: 'bg-emerald-50 text-emerald-700' },
  { label: 'Total Earnings', value: '$24.60', icon: FaChartLine, badge: '+', badgeColor: 'bg-emerald-50 text-emerald-700' },
  { label: 'Bonus Rewards', value: '$10.00', icon: FaGift, badge: 'Claimed', badgeColor: 'bg-amber-50 text-amber-700' },
];

export default function MinePage() {
  return (
    <div className="min-h-screen px-4 pb-28 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Mobile View */}
        <section className="mobile-only glass-card mb-4 p-4">
          <div className="flex flex-col gap-3 text-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.26em] text-cmblue-600">Mining Dashboard</p>
              <h1 className="mt-1 text-base font-semibold text-slate-900">CM HASH Mine</h1>
            </div>
            <div className="relative mx-auto flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-cmblue-500 to-cmblue-300 shadow-[0_0_40px_rgba(0,0,0,0.28)]">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/40 spin-slow" />
              <div className="absolute inset-4 rounded-full border border-white/50 bg-white/20 pulse-ring" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cmblue-200 spin-reverse" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white text-slate-900 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                <div>
                  <p className="text-xl font-semibold">2.45</p>
                  <p className="text-[9px] uppercase tracking-[0.22em] text-slate-500">TH/s</p>
                </div>
              </div>
            </div>
            <span className="inline-flex items-center justify-center rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-cmblue-700 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
              Status: Active
            </span>
          </div>

          <div className="mt-4 grid gap-2">
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Mining Plan</p>
                <span className="rounded-full bg-cmblue-50 px-2.5 py-0.5 text-[10px] font-semibold text-cmblue-700">Active</span>
              </div>
              <p className="mt-1.5 text-lg font-semibold text-slate-900">7 Days</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {stats.map((item) => (
                <div key={item.label} className="rounded-[18px] border border-slate-200 bg-slate-50 p-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Time Remaining</p>
                <p className="text-[10px] font-semibold text-slate-900">72%</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-72 rounded-full bg-gradient-to-r from-cmblue-600 to-cmblue-400"></div>
              </div>
              <p className="mt-1.5 text-[10px] text-slate-500">5 Days 12h 24m remaining</p>
            </div>
          </div>
        </section>

        {/* Desktop View - Based on Mobile Mining Design */}
        <section className="desktop-only hidden glass-card p-5">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.26em] text-cmblue-600">Mining Dashboard</p>
              <h1 className="mt-1 text-lg font-semibold text-slate-900">CM HASH Mine</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 shadow-[0_4px_16px_rgba(16,185,129,0.18)]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cmblue-50 px-3 py-1.5 text-[11px] font-semibold text-cmblue-700 shadow-[0_4px_16px_rgba(14,161,255,0.18)]">
                <span className="h-1.5 w-1.5 rounded-full bg-cmblue-500" />
                Gold Plan
              </span>
            </div>
          </div>

          {/* Centered Progress Circle */}
          <div className="mb-5 flex items-center justify-center">
            <div className="relative flex h-44 w-44 items-center justify-center rounded-full bg-gradient-to-br from-cmblue-500 to-cmblue-300 shadow-[0_0_48px_rgba(14,161,255,0.35)]">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/40 spin-slow" />
              <div className="absolute inset-4 rounded-full border border-white/50 bg-white/20 pulse-ring" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cmblue-200 spin-reverse" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white text-slate-900 shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
                <div className="text-center">
                  <p className="text-2xl font-semibold">2.45</p>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">TH/s</p>
                </div>
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-cmblue-700 shadow-[0_4px_16px_rgba(14,161,255,0.24)]">
                Status: Active
              </div>
            </div>
          </div>

          {/* Mining Plan Summary Bar */}
          <div className="mb-5 grid gap-2 rounded-[24px] border border-slate-200 bg-slate-50 p-4 lg:grid-cols-3">
            <div className="flex items-center justify-between rounded-[18px] bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cmblue-50 text-cmblue-600">
                  <FaClock className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500">Mining Plan</p>
                  <p className="text-sm font-semibold text-slate-900">7 Days</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">Active</span>
            </div>
            <div className="flex items-center justify-between rounded-[18px] bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FaChartLine className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500">Daily Earnings</p>
                  <p className="text-sm font-semibold text-slate-900">$2.45</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">+</span>
            </div>
            <div className="flex items-center justify-between rounded-[18px] bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cmblue-50 text-cmblue-600">
                  <FaCoins className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500">Total Earned</p>
                  <p className="text-sm font-semibold text-slate-900">$24.60</p>
                </div>
              </div>
              <span className="rounded-full bg-cmblue-50 px-2.5 py-0.5 text-[10px] font-semibold text-cmblue-700">All time</span>
            </div>
          </div>

          {/* Expanded Mining Details */}
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_10px_32px_rgba(14,161,255,0.12)]">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-cmblue-50 text-cmblue-600">
                  <FaBolt className="h-3.5 w-3.5" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-cmblue-700">Mining Details</h2>
                  <p className="text-[10px] text-slate-500">Complete contract information</p>
                </div>
              </div>
              <button className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-900 shadow-sm transition hover:bg-slate-50">
                View Contract
              </button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {miningDetails.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 rounded-[18px] border border-slate-200 bg-slate-50 p-3 transition hover:border-cmblue-200 hover:bg-cmblue-50/40">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-cmblue-600 shadow-sm">
                      <item.icon className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-900">{item.value}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}