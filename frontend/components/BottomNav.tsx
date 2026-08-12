'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaWallet, FaBolt, FaHeadset, FaUser } from 'react-icons/fa';

const nav = [
  { href: '/dashboard', label: 'Home', icon: FaHome },
  { href: '/dashboard/wallet', label: 'Wallets', icon: FaWallet },
  { href: '/dashboard/mining', label: 'Mining', icon: FaBolt, center: true },
  { href: '/dashboard/support', label: 'Support', icon: FaHeadset },
  { href: '/dashboard/profile', label: 'Profile', icon: FaUser },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex max-w-5xl items-center justify-between gap-1 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl sm:px-5 lg:hidden">
      {nav.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1.5 text-[10px] font-semibold transition-all duration-200 ${
              item.center
                ? '-mt-6 h-14 w-14 rounded-full bg-gradient-to-br from-cmblue-600 to-cmblue-500 text-white shadow-[0_10px_30px_rgba(14,161,255,0.35)] ring-4 ring-white'
                : isActive
                ? 'text-cmblue-600'
                : 'text-slate-400 hover:text-cmblue-500'
            }`}
          >
            <item.icon className={`mb-0.5 h-5 w-5 transition-transform duration-200 ${isActive && !item.center ? 'scale-110' : ''}`} />
            {item.label}
            {isActive && !item.center && (
              <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-cmblue-500" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}