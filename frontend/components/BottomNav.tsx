'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaWallet, FaBolt, FaUsers, FaUser } from 'react-icons/fa';

const nav = [
  { href: '/dashboard', label: 'Home', icon: FaHome },
  { href: '/dashboard/mining', label: 'Mining', icon: FaBolt },
  { href: '/dashboard/referrals', label: 'Team', icon: FaUsers },
  { href: '/dashboard/wallet', label: 'Wallet', icon: FaWallet },
  { href: '/dashboard/profile', label: 'Profile', icon: FaUser },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-sky-100 bg-white/92 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-16px_38px_rgba(0,139,255,0.12)] backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1 rounded-[22px] bg-sky-50/70 p-1 ring-1 ring-sky-100">
        {nav.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-[18px] text-[10px] font-bold transition-all ${
                isActive
                  ? 'bg-cmblue-500 text-white shadow-[0_10px_24px_rgba(0,130,255,0.28)]'
                  : 'text-slate-500 hover:bg-white hover:text-cmblue-700'
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
