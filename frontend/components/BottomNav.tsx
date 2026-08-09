'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaCogs, FaHome, FaWallet, FaBolt, FaUser } from 'react-icons/fa';

const nav = [
  { href: '/', label: 'Home', icon: FaHome },
  { href: '/wallet', label: 'Wallet', icon: FaWallet },
  { href: '/mine', label: 'Mine', icon: FaBolt, center: true },
  { href: '/profile', label: 'Profile', icon: FaUser },
  { href: '/settings', label: 'Settings', icon: FaCogs },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto flex max-w-5xl items-center justify-between gap-1 border border-white/70 bg-white/80 px-3 py-2 shadow-soft backdrop-blur-xl sm:px-5 lg:hidden">
      {nav.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`group flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1.5 text-[10px] font-semibold transition ${
              item.center
                ? 'relative -top-4 h-14 w-14 rounded-[24px] bg-cmblue-600 text-white shadow-[0_20px_40px_rgba(14,161,255,0.28)]'
                : isActive
                ? 'bg-cmblue-50 text-cmblue-700'
                : 'text-slate-500 hover:text-cmblue-600'
            }`}
          >
            <item.icon className="mb-0.5 h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}