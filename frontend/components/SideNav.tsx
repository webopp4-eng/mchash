'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaCogs, FaHome, FaWallet, FaBolt, FaUser } from 'react-icons/fa';
import Logo from './Logo';

const nav = [
  { href: '/', label: 'Home', icon: FaHome },
  { href: '/wallet', label: 'Wallet', icon: FaWallet },
  { href: '/mine', label: 'Mine', icon: FaBolt },
  { href: '/profile', label: 'Profile', icon: FaUser },
  { href: '/settings', label: 'Settings', icon: FaCogs },
];

export default function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-72 flex-col gap-6 border-r border-white/70 bg-white/70 p-6 shadow-soft backdrop-blur-xl lg:flex lg:sticky lg:top-0">
      <div className="mb-6 flex items-center gap-3">
        <Logo size={48} />
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-cmblue-600">CM HASH</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">Cloud Mining</h2>
        </div>
      </div>

      <nav className="space-y-2.5">
        {nav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-[22px] border-2 px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                isActive
                  ? 'border-cmblue-400 bg-gradient-to-r from-cmblue-50 to-white text-cmblue-700 shadow-[0_0_24px_rgba(14,161,255,0.35),0_8px_24px_rgba(14,161,255,0.2)]'
                  : 'border-cmblue-200/70 bg-white/60 text-slate-700 shadow-[0_4px_16px_rgba(14,161,255,0.12)] hover:-translate-y-0.5 hover:border-cmblue-400 hover:bg-cmblue-50/60 hover:text-cmblue-700 hover:shadow-[0_8px_28px_rgba(14,161,255,0.22)]'
              }`}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-cmblue-600 text-white shadow-[0_4px_12px_rgba(14,161,255,0.4)]'
                    : 'bg-cmblue-50 text-cmblue-600 group-hover:bg-cmblue-600 group-hover:text-white'
                }`}
              >
                <item.icon className="h-4 w-4" />
              </span>
              {item.label}
              {isActive && (
                <span className="absolute right-3 h-2 w-2 rounded-full bg-cmblue-500 shadow-[0_0_8px_rgba(14,161,255,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[28px] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 shadow-sm">
        <p className="font-semibold text-slate-900">Unlock premium mining</p>
        <p className="mt-2">Choose a contract and watch your balance grow with simulated rewards.</p>
      </div>
    </aside>
  );
}