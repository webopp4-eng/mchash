'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaWallet, FaBolt, FaUsers, FaUser } from 'react-icons/fa';

const nav = [
  { href: '/dashboard', label: 'Home', icon: FaHome },
  { href: '/dashboard/mining', label: 'Mining', icon: FaBolt, featured: true },
  { href: '/dashboard/referrals', label: 'Team', icon: FaUsers },
  { href: '/dashboard/wallet', label: 'Wallet', icon: FaWallet },
  { href: '/dashboard/profile', label: 'Profile', icon: FaUser },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-sky-100 bg-white/92 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-16px_38px_rgba(0,139,255,0.12)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end gap-1 rounded-[22px] bg-sky-50/70 p-1 ring-1 ring-sky-100">
        {nav.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          // Featured Mining button — circular, slightly larger than the other
          // nav buttons, and raised above the bar. It sits in the exact center
          // slot (3rd of 5) of the bottom navigation.
          if (item.featured) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col items-center justify-end gap-1"
                aria-label={item.label}
              >
                <span
                  className={`-mt-7 grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-cmblue-500 to-cmblue-600 text-white shadow-[0_10px_24px_rgba(0,130,255,0.4)] ring-4 ring-white transition-all duration-200 ${
                    isActive ? 'scale-110 shadow-[0_14px_30px_rgba(0,130,255,0.5)]' : 'group-hover:scale-105'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${isActive ? 'animate-pulse-glow' : ''}`} />
                </span>
                <span
                  className={`text-[10px] font-bold transition-colors ${
                    isActive ? 'text-cmblue-600' : 'text-slate-500 group-hover:text-cmblue-600'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[18px] text-[10px] font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-cmblue-500 text-white shadow-[0_10px_24px_rgba(0,130,255,0.28)]'
                  : 'text-slate-500 hover:bg-white hover:text-cmblue-600'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}