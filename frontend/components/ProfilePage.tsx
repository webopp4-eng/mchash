'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FaBell, FaCogs, FaHeadset, FaLock, FaPencilAlt, FaSignOutAlt, FaUserCircle, FaCheck } from 'react-icons/fa';
import { getUser, logout, User } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { shortenAddress } from '@/lib/wallet';

const items = [
  { icon: FaCogs, label: 'Settings', desc: 'Manage your preferences', href: '/dashboard/settings' },
  { icon: FaHeadset, label: 'Support', desc: 'Get help & contact us', href: '/dashboard/support' },
  { icon: FaBell, label: 'Notifications', desc: 'View all notifications', href: '/dashboard/withdrawals' },
  { icon: FaLock, label: 'Security', desc: 'Manage account security', href: '/dashboard/settings' },
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('User');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(username);

  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);
    if (currentUser?.username) {
      setUsername(currentUser.username);
      setEditValue(currentUser.username);
    }
  }, []);

  const handleSaveUsername = () => {
    if (editValue.trim()) {
      setUsername(editValue.trim());
    }
    setIsEditing(false);
  };

  const avatarClass = user?.avatar === 'avatar-1' ? 'bg-gradient-to-br from-cmblue-500 to-cmblue-700' :
    user?.avatar === 'avatar-2' ? 'bg-gradient-to-br from-emerald-500 to-teal-700' :
    user?.avatar === 'avatar-3' ? 'bg-gradient-to-br from-amber-500 to-orange-700' :
    user?.avatar === 'avatar-4' ? 'bg-gradient-to-br from-rose-500 to-pink-700' :
    'bg-gradient-to-br from-violet-500 to-purple-700';

  return (
    <div className="mc-page max-w-6xl">
      {/* Social-Media Style Profile */}
      <section className="mc-card overflow-hidden p-0">
        {/* Cover Banner */}
        <div className="relative h-28 bg-gradient-to-r from-cmblue-700 via-cmblue-600 to-cmblue-400 sm:h-36">
          <div className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-10 left-1/4 h-28 w-28 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute right-1/3 top-4 h-16 w-16 rounded-full bg-white/10" />
        </div>

        {/* Profile Info */}
        <div className="px-4 pb-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-end">
              {/* Avatar */}
              <div className={`-mt-10 flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-white text-white shadow-[0_8px_24px_rgba(0,0,0,0.24)] sm:-mt-12 sm:h-24 sm:w-24 ${avatarClass}`}>
                <span className="text-2xl font-extrabold sm:text-3xl">{username?.slice(0, 2).toUpperCase() || 'MC'}</span>
              </div>

              <div className="text-center sm:text-left">
                {/* Editable Username */}
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  {isEditing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveUsername()}
                        className="mc-input w-40"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveUsername}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-cmblue-600 text-white transition hover:bg-cmblue-700"
                      >
                        <FaCheck className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-lg font-semibold text-slate-950 sm:text-xl">{username}</h1>
                      <button
                        onClick={() => {
                          setEditValue(username);
                          setIsEditing(true);
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-cmblue-50 text-cmblue-600 transition hover:bg-cmblue-100"
                      >
                        <FaPencilAlt className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{user?.walletAddress ? shortenAddress(user.walletAddress, 8) : 'No wallet connected'}</p>
                <p className="mt-1 inline-flex items-center gap-1 mc-status bg-cmblue-50 text-cmblue-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  User ID: {user?.referralCode || 'CMH-0000'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 sm:justify-end">
              <span className="mc-status bg-emerald-50 text-emerald-600">Verified</span>
              <span className="mc-status bg-cmblue-50 text-cmblue-600">Online</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-3 text-center">
              <p className="text-base font-bold text-slate-950">${Number(user?.platformBalance || 0).toFixed(2)}</p>
              <p className="text-[9px] font-bold uppercase text-slate-500 tracking-[0.16em]">Balance</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-3 text-center">
              <p className="text-base font-bold text-slate-950">{user?.chain || 'N/A'}</p>
              <p className="text-[9px] font-bold uppercase text-slate-500 tracking-[0.16em]">Network</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-3 text-center">
              <p className="text-base font-bold text-slate-950">{user?.walletType || 'Wallet'}</p>
              <p className="text-[9px] font-bold uppercase text-slate-500 tracking-[0.16em]">Type</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        {/* Settings & Menu */}
        <section className="mc-card">
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase text-cmblue-600">Menu</p>
            <h2 className="mt-1 text-base font-bold text-slate-950">Account Options</h2>
          </div>

          <div className="grid gap-2">
            {items.map((item) => (
              <Link
                key={item.label}
                href={item.href || '#'}
                className="flex items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50/50 p-3 transition hover:border-cmblue-200 hover:bg-cmblue-50/80"
              >
                <div className="flex items-center gap-2.5">
                  <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600">
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-950">{item.label}</p>
                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-cmblue-600">→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Account Activity */}
        <section className="mc-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-cmblue-600">Security</p>
              <h2 className="mt-1 text-base font-bold text-slate-950">Account Activity</h2>
            </div>
            <span className="mc-status bg-cmblue-50 text-cmblue-600">Online</span>
          </div>

          <div className="space-y-2">
            <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
              <p className="text-xs text-slate-500">Wallet address</p>
              <p className="mt-1 break-all text-base font-bold text-slate-950">{user?.walletAddress || 'No wallet connected'}</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
              <p className="text-xs text-slate-500">Verification</p>
              <p className="mt-1 text-base font-bold text-slate-950">User verified by wallet signature</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
              <p className="text-xs text-slate-500">Member since</p>
              <p className="mt-1 text-base font-bold text-slate-950">{user?.referralCode ? 'Active member' : 'New member'}</p>
            </div>
            <button onClick={() => logout(router)} className="mt-2 w-full rounded-[22px] bg-gradient-to-r from-rose-500 to-rose-600 px-3 py-2.5 text-xs font-bold text-white transition hover:shadow-[0_10px_24px_rgba(239,68,68,0.22)]">
              <FaSignOutAlt className="mr-1.5 inline-block h-3.5 w-3.5" />
              Log Out
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}