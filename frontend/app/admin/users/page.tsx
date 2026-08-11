'use client';

import { useEffect, useState } from 'react';
import { FaSearch, FaUsers, FaWallet, FaBolt } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';
import { shortenAddress } from '@/lib/wallet';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await apiFetch('/api/admin/users');
      setUsers(res.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiFetch(`/api/admin/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      loadUsers();
    } catch (err) {
      console.error('Failed to update user:', err);
    }
  };

  const filtered = users.filter((u) =>
    !search || u.walletAddress?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="mt-1 text-sm text-slate-400">Manage platform users</p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by wallet or username..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-3 text-sm text-white outline-none transition focus:border-cmblue-500/50"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-[24px] border border-white/10 bg-white/5 backdrop-blur-xl">
        <table className="w-full min-w-[800px] text-left">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-slate-500">User</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-slate-500">Wallet</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-slate-500">Balance</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-slate-500">Status</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cmblue-500/20 text-cmblue-400">
                      <FaUsers className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold">{user.username}</p>
                      <p className="text-[10px] text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs">{shortenAddress(user.walletAddress, 6)}</p>
                  <p className="text-[10px] capitalize text-slate-500">{user.chain}</p>
                </td>
                <td className="px-4 py-3 text-sm font-semibold">${Number(user.platformBalance || 0).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-medium ${
                    user.status === 'active' ? 'text-emerald-400' :
                    user.status === 'suspended' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {user.status !== 'active' && (
                      <button
                        onClick={() => updateStatus(user.id, 'active')}
                        className="rounded-lg bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500/30"
                      >
                        Activate
                      </button>
                    )}
                    {user.status !== 'suspended' && (
                      <button
                        onClick={() => updateStatus(user.id, 'suspended')}
                        className="rounded-lg bg-amber-500/20 px-2 py-1 text-[10px] font-semibold text-amber-400 hover:bg-amber-500/30"
                      >
                        Suspend
                      </button>
                    )}
                    {user.status !== 'banned' && (
                      <button
                        onClick={() => updateStatus(user.id, 'banned')}
                        className="rounded-lg bg-rose-500/20 px-2 py-1 text-[10px] font-semibold text-rose-400 hover:bg-rose-500/30"
                      >
                        Ban
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">No users found</p>
        )}
      </div>
    </div>
  );
}