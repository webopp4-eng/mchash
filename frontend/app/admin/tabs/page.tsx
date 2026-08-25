'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FaBell,
  FaChartLine,
  FaChartPie,
  FaCogs,
  FaExternalLinkAlt,
  FaHeadset,
  FaHome,
  FaLayerGroup,
  FaStore,
  FaTable,
  FaThLarge,
  FaUsers,
  FaWallet,
  FaCoins,
} from 'react-icons/fa';
import { getUser } from '@/lib/auth';

interface TabItem {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  superAdminOnly?: boolean;
}

// Every admin page, grouped by section so mobile users can reach them all
const TAB_SECTIONS: { title: string; items: TabItem[] }[] = [
  {
    title: 'Overview',
    items: [
      {
        href: '/admin',
        label: 'Dashboard',
        description: 'Admin overview & key metrics',
        icon: FaHome,
      },
      {
        href: '/admin',
        label: 'Analytics',
        description: 'Charts & performance insights',
        icon: FaChartLine,
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        href: '/admin/plans',
        label: 'Mining Center',
        description: 'Manage mining plans & contracts',
        icon: FaLayerGroup,
      },
      {
        href: '/admin/users',
        label: 'Bubble Team',
        description: 'Manage users & team members',
        icon: FaUsers,
      },
      {
        href: '/admin/treasury',
        label: 'Wallet',
        description: 'Treasury & wallet controls',
        icon: FaWallet,
        superAdminOnly: true,
      },
    ],
  },
  {
    title: 'Finance & Activity',
    items: [
      {
        href: '/admin/deposits',
        label: 'Transactions',
        description: 'All deposits & transactions',
        icon: FaTable,
      },
      {
        href: '/admin/withdrawals',
        label: 'Rewards & Activity',
        description: 'Withdrawals & reward payouts',
        icon: FaCoins,
      },
      {
        href: '/admin/deposits',
        label: 'Reports',
        description: 'Financial reports & exports',
        icon: FaChartPie,
      },
    ],
  },
  {
    title: 'System',
    items: [
      {
        href: '/admin/plans',
        label: 'Marketplace',
        description: 'Store & marketplace offerings',
        icon: FaStore,
      },
      {
        href: '/admin/settings',
        label: 'Settings',
        description: 'Platform settings & employees',
        icon: FaCogs,
      },
      {
        href: '/admin/support',
        label: 'Support',
        description: 'Support tickets & messages',
        icon: FaHeadset,
      },
      {
        href: '/admin/withdrawals',
        label: 'Notifications',
        description: 'Alerts & notification history',
        icon: FaBell,
      },
    ],
  },
];

export default function AdminTabs() {
  const [isMounted, setIsMounted] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    try {
      setRole(getUser()?.role ?? null);
    } catch {
      setRole(null);
    }
  }, []);

  const isSuperAdmin = role === 'SUPER_ADMIN';

  if (!isMounted) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Page header */}
      <div className="rounded-3xl border border-sky-100 bg-gradient-to-br from-cmblue-50 via-white to-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cmblue-500 text-white shadow-[0_10px_24px_rgba(0,130,255,0.35)]">
            <FaThLarge className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold text-slate-950 sm:text-2xl">Tabs</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Quick access to every admin page — built for mobile.
            </p>
          </div>
        </div>
      </div>

      {/* All pages, grouped by section */}
      {TAB_SECTIONS.map((section) => {
        const items = section.items.filter(
          (item) => !item.superAdminOnly || isSuperAdmin
        );
        return (
          <section key={section.title} className="space-y-3">
            <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-slate-400">
              {section.title}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={`${section.title}-${item.label}`}
                    href={item.href}
                    className="group flex flex-col gap-2 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cmblue-300 hover:shadow-[0_12px_28px_rgba(0,130,255,0.18)] active:scale-[0.98]"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-cmblue-600 transition-colors duration-200 group-hover:bg-cmblue-500 group-hover:text-white">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-bold leading-tight text-slate-900">
                      {item.label}
                    </span>
                    <span className="text-[11px] font-medium leading-snug text-slate-500">
                      {item.description}
                    </span>
                    <span className="mt-auto flex items-center gap-1 pt-1 text-[11px] font-semibold text-cmblue-600 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      Open <FaExternalLinkAlt className="h-2.5 w-2.5" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

