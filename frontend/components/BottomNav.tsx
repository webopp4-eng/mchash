'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaWallet, FaBolt, FaHeadset, FaUser } from 'react-icons/fa';

const nav = [
  { href: '/dashboard', label: 'Home', icon: FaHome },
  { href: '/dashboard/wallet', label: 'Wallets', icon: FaWallet },
  { href: '/dashboard/mining', label: 'Mining', icon: FaBolt },
  { href: '/dashboard/support', label: 'Support', icon: FaHeadset },
  { href: '/dashboard/profile', label: 'Profile', icon: FaUser },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex max-w-5xl items-center justify-around gap-0 border-t border-slate-200/80 bg-white px-2 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-4px_24px_rgba(15,23,42,0.08)] lg:hidden">
      {nav.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-semibold transition-all duration-200 ${
              isActive
                ? 'text-cmblue-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <span className={`flex h-8 w-14 items-center justify-center rounded-full transition-all duration-200 ${
              isActive ? 'bg-cmblue-50' : 'bg-transparent'
            }`}>
              <item.icon className={`h-5 w-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}