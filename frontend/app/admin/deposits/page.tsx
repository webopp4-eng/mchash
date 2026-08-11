'use client';

import { useEffect, useState } from 'react';
import { FaArrowDown } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';
import { shortenAddress } from '@/lib/wallet';

export default function AdminDeposits() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeposits();
  }, []);

  const loadDeposits = async () => {
    try {
      const res = await apiFetch('/api/admin/deposits');
      setDeposits(res.deposits || []);
    } catch (err) {
      console.error('Failed to load deposits:', err);
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold">Deposit Management</h1>
        <p className="mt-1 text-sm text-slate-400">View all platform deposits</p>
      </div>

      <div className="overflow-x-auto rounded-[24px] border border-white/10 bg-white/5 backdrop-blur-xl">
        <table className="w-full min-w-[800px] text-left">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-slate-500">User</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-slate-500">Amount</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-slate-500">Token</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-slate-500">From</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-slate-500">Status</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-slate-500">Date</th>
            </tr>
          </thead>
          <tbody>
            {deposits.map((deposit) => (
              <tr key={deposit.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3">
                  <p className="text-xs font-semibold">{deposit.user?.username || 'Unknown'}</p>
                  <p className="text-[10px] text-slate-500">{shortenAddress(deposit.user?.walletAddress || '', 6)}</p>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-emerald-400">+${Number(deposit.amount).toFixed(2)}</td>
                <td className="px-4 py-3 text-xs">{deposit.token}</td>
                <td className="px-4 py-3 text-[10px] text-slate-400">{shortenAddress(deposit.walletAddress, 8)}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-medium ${
                    deposit.status === 'confirmed' ? 'text-emerald-400' :
                    deposit.status === 'failed' ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    {deposit.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[10px] text-slate-500">{new Date(deposit.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {deposits.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">No deposits found</p>
        )}
      </div>
    </div>
  );
}