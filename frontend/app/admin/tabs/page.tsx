'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FaBell,
  FaChartLine,
  FaChartPie,
  FaCogs,
  FaHeadset,
  FaHome,
  FaLayerGroup,
  FaStore,
  FaTable,
  FaThLarge,
  FaUsers,
  FaWallet,
  FaCoins,
  FaClipboardList,
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
        href: '/admin/actions',
        label: 'Actions',
        description: 'Activity & audit log',
        icon: FaClipboardList,
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
    <div className="mx-auto max-w-5xl space-y-10">
      {/* Page header - centered */}
      <div className="rounded-3xl border border-sky-100 bg-gradient-to-br from-cmblue-50 via-white to-white p-8 text-center shadow-sm sm:p-10">
        <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-[22px] bg-cmblue-500 text-white shadow-[0_12px_28px_rgba(0,130,255,0.4)] ring-4 ring-white">
          <FaThLarge className="h-7 w-7" />
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Tabs</h1>
        <p className="mx-auto mt-2 max-w-md text-sm font-medium text-slate-500 sm:text-base">
          Quick access to every admin page — built for mobile.
        </p>
      </div>

      {/* All pages, grouped by section */}
      {TAB_SECTIONS.map((section) => {
        const items = section.items.filter(
          (item) => !item.superAdminOnly || isSuperAdmin
        );
        return (
          <section key={section.title} className="space-y-4">
            <h2 className="text-center text-xs font-bold uppercase tracking-widest text-slate-400">
              {section.title}
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={`${section.title}-${item.label}`}
                    href={item.href}
                    className="group flex flex-col items-center gap-2 rounded-3xl border border-sky-100 bg-white p-5 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-cmblue-300 hover:shadow-[0_12px_28px_rgba(0,130,255,0.18)] active:scale-[0.98]"
                  >
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-sky-50 text-cmblue-600 transition-colors duration-200 group-hover:bg-cmblue-500 group-hover:text-white">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="text-[15px] font-bold leading-tight text-slate-900">
                      {item.label}
                    </span>
                    <span className="text-xs font-medium leading-snug text-slate-500">
                      {item.description}
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

