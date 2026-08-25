'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaWallet, FaBolt, FaStore, FaUser } from 'react-icons/fa';

// Mobile bottom navigation order: Home | Plans | MINING (center) | Wallet | Profile
const nav = [
  { href: '/dashboard', label: 'Home', icon: FaHome },
  { href: '/dashboard/plans', label: 'Plans', icon: FaStore },
  { href: '/dashboard/mining', label: 'Mining', icon: FaBolt, featured: true },
  { href: '/dashboard/wallet', label: 'Wallet', icon: FaWallet },
  { href: '/dashboard/profile', label: 'Profile', icon: FaUser },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    // Mobile-only navigation (hidden on desktop where SideNav takes over)
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
      <div className="relative mx-auto max-w-md">
        {/* Soft glowing gradient halo behind the dock */}
        <div
          aria-hidden
          className="absolute -inset-1 rounded-[30px] bg-gradient-to-r from-cmblue-400/30 via-sky-300/40 to-cmblue-400/30 blur-md"
        />

        {/* Floating glass dock */}
        <div className="relative grid grid-cols-5 items-end gap-1 rounded-[26px] border border-white/80 bg-white/95 p-1.5 shadow-[0_18px_44px_rgba(0,130,255,0.22)] backdrop-blur-xl">
          {nav.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            // Featured Mining button — circular, slightly larger than the other
            // nav buttons, raised above the dock, exactly in the center slot.
            if (item.featured) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex flex-col items-center justify-end gap-1"
                  aria-label={item.label}
                >
                  <span
                    className={`relative -mt-8 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-cmblue-400 via-cmblue-500 to-sky-500 text-white shadow-[0_12px_28px_rgba(0,130,255,0.45)] ring-4 ring-white transition-all duration-200 ${
                      isActive ? 'scale-110 shadow-[0_16px_34px_rgba(0,130,255,0.55)]' : 'group-hover:scale-105'
                    }`}
                  >
                    {/* animated glow ring */}
                    <span
                      aria-hidden
                      className={`absolute inset-0 rounded-full bg-cmblue-400/40 ${isActive ? 'animate-ping' : ''}`}
                    />
                    <item.icon className="relative h-6 w-6 drop-shadow" />
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
                    ? 'bg-gradient-to-br from-cmblue-500 to-sky-500 text-white shadow-[0_8px_20px_rgba(0,130,255,0.35)]'
                    : 'text-slate-500 hover:bg-sky-50 hover:text-cmblue-600'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}