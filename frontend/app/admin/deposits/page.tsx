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
    <div className="mc-page">
      <div className="mc-page-header">
        <div>
          <p className="text-[10px] font-bold uppercase text-cmblue-600">Transactions</p>
          <h1 className="mc-title">Deposit Management</h1>
          <p className="mc-subtitle">View incoming platform deposits and confirmation status.</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-extrabold text-emerald-600 ring-1 ring-emerald-100">
          {deposits.length} deposits
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['All', 'Deposit', 'Withdrawal', 'Transfer', 'Mining Reward', 'Team Reward', 'Service Charge'].map((tab) => (
          <button
            key={tab}
            className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold ${
              tab === 'Deposit'
                ? 'bg-cmblue-500 text-white shadow-[0_10px_24px_rgba(0,130,255,0.22)]'
                : 'border border-sky-100 bg-white/80 text-slate-500 hover:bg-cmblue-50 hover:text-cmblue-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mc-table-wrap">
        <table className="mc-table">
          <thead>
            <tr className="mc-table-head">
              <th className="mc-th">User</th>
              <th className="mc-th">Amount</th>
              <th className="mc-th">Token</th>
              <th className="mc-th">From</th>
              <th className="mc-th">Status</th>
              <th className="mc-th">Date</th>
            </tr>
          </thead>
          <tbody>
            {deposits.map((deposit) => (
              <tr key={deposit.id} className="mc-row">
                <td className="mc-td">
                  <p className="text-xs font-bold text-slate-950">{deposit.user?.username || 'Unknown'}</p>
                  <p className="text-[10px] text-slate-500">{shortenAddress(deposit.user?.walletAddress || '', 6)}</p>
                </td>
                <td className="mc-td text-sm font-bold text-emerald-600">+${Number(deposit.amount).toFixed(2)}</td>
                <td className="mc-td text-xs font-semibold">{deposit.token}</td>
                <td className="mc-td text-[10px] text-slate-500">{shortenAddress(deposit.walletAddress, 8)}</td>
                <td className="mc-td">
                  <span className={`mc-status ${
                    deposit.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                    deposit.status === 'failed' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {deposit.status}
                  </span>
                </td>
                <td className="mc-td text-[10px] text-slate-500">{new Date(deposit.createdAt).toLocaleDateString()}</td>
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
