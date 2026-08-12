'use client';

import { useEffect, useState } from 'react';
import { FaArrowUp, FaCheck, FaCheckCircle, FaTimes, FaClock } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';
import { shortenAddress } from '@/lib/wallet';

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      const res = await apiFetch('/api/admin/withdrawals');
      setWithdrawals(res.withdrawals || []);
    } catch (err) {
      console.error('Failed to load withdrawals:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string, txHash?: string) => {
    try {
      await apiFetch(`/api/admin/withdrawals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, txHash }),
      });
      loadWithdrawals();
    } catch (err) {
      console.error('Failed to update withdrawal:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
      </div>
    );
  }

  const pendingCount = withdrawals.filter((wd) => wd.status === 'pending').length;
  const approvedCount = withdrawals.filter((wd) => wd.status === 'approved').length;

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Withdrawal Requests</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">Review pending withdrawals, approve requests, and complete payouts manually.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-cmblue-500/10 p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Pending</p>
              <p className="mt-2 text-2xl font-semibold text-cmblue-100">{pendingCount}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-emerald-500/10 p-4">
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Approved</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-100">{approvedCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <table className="w-full min-w-[800px] text-left">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-slate-500">User</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-slate-500">Amount</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-slate-500">Destination</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-slate-500">Status</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-slate-500">Date</th>
              <th className="px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((wd) => (
              <tr key={wd.id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3">
                  <p className="text-xs font-semibold">{wd.user?.username || 'Unknown'}</p>
                  <p className="text-[10px] text-slate-500">{shortenAddress(wd.user?.walletAddress || '', 6)}</p>
                </td>
                <td className="px-4 py-3 text-sm font-semibold">${Number(wd.amount).toFixed(2)}</td>
                <td className="px-4 py-3 text-[10px] text-slate-400">{shortenAddress(wd.destinationAddress, 8)}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-medium ${
                    wd.status === 'completed' ? 'text-emerald-400' :
                    wd.status === 'rejected' ? 'text-rose-400' :
                    wd.status === 'approved' ? 'text-cmblue-400' : 'text-amber-400'
                  }`}>
                    {wd.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[10px] text-slate-500">{new Date(wd.requestedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    {wd.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(wd.id, 'approved')}
                          className="flex items-center gap-1 rounded-lg bg-cmblue-500/20 px-2 py-1 text-[10px] font-semibold text-cmblue-400 hover:bg-cmblue-500/30"
                        >
                          <FaCheck className="h-3 w-3" /> Approve
                        </button>
                        <button
                          onClick={() => updateStatus(wd.id, 'rejected')}
                          className="flex items-center gap-1 rounded-lg bg-rose-500/20 px-2 py-1 text-[10px] font-semibold text-rose-400 hover:bg-rose-500/30"
                        >
                          <FaTimes className="h-3 w-3" /> Reject
                        </button>
                      </>
                    )}
                    {wd.status === 'approved' && (
                      <button
                        onClick={() => {
                          const hash = prompt('Enter transaction hash:');
                          if (hash) updateStatus(wd.id, 'completed', hash);
                        }}
                        className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2 py-1 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500/30"
                      >
                        <FaCheck className="h-3 w-3" /> Complete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {withdrawals.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">No withdrawal requests</p>
        )}
      </div>
    </div>
  );
}