'use client';

import { useEffect, useState } from 'react';
import { FaArrowUp, FaCheck, FaCheckCircle, FaTimes, FaClock } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';
import { refreshFinancialData } from '@/lib/financialData';
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
      
      // Refresh financial data across the app (user balances may have changed)
      await refreshFinancialData();
      
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
    <div className="mc-page">
      <div className="mc-page-header">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase text-cmblue-600">Rewards & Activity</p>
            <h1 className="mc-title">Withdrawal Requests</h1>
            <p className="mc-subtitle max-w-2xl">Review pending withdrawals, approve requests, and complete payouts manually.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
              <p className="text-[10px] font-bold uppercase text-amber-600">Pending</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-950">{pendingCount}</p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-[10px] font-bold uppercase text-emerald-600">Approved</p>
              <p className="mt-2 text-2xl font-extrabold text-slate-950">{approvedCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mc-table-wrap p-2">
        <table className="mc-table">
          <thead>
            <tr className="mc-table-head">
              <th className="mc-th">User</th>
              <th className="mc-th">Amount</th>
              <th className="mc-th">Destination</th>
              <th className="mc-th">Status</th>
              <th className="mc-th">Date</th>
              <th className="mc-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((wd) => (
              <tr key={wd.id} className="mc-row">
                <td className="mc-td">
                  <p className="text-xs font-bold text-slate-950">{wd.user?.username || 'Unknown'}</p>
                  <p className="text-[10px] text-slate-500">{shortenAddress(wd.user?.walletAddress || '', 6)}</p>
                </td>
                <td className="mc-td text-sm font-bold text-rose-600">-${Number(wd.amount).toFixed(2)}</td>
                <td className="mc-td text-[10px] text-slate-500">{shortenAddress(wd.destinationAddress, 8)}</td>
                <td className="mc-td">
                  <span className={`mc-status ${
                    wd.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                    wd.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                    wd.status === 'approved' ? 'bg-cmblue-50 text-cmblue-700' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {wd.status}
                  </span>
                  {wd.status !== 'pending' && (wd.processedByName || wd.processedByRole) && (
                    <p className="mt-1 text-[10px] font-semibold text-slate-500">
                      {wd.status === 'approved' ? 'Approved' : wd.status === 'rejected' ? 'Rejected' : 'Completed'} by{' '}
                      {wd.processedByName || 'Staff'}
                      {wd.processedByRole ? ` (${wd.processedByRole === 'SUPER_ADMIN' || wd.processedByRole === 'admin' ? 'Admin' : 'Employee'})` : ''}
                      {wd.processedAt ? ` · ${new Date(wd.processedAt).toLocaleString()}` : ''}
                    </p>
                  )}
                </td>
                <td className="mc-td text-[10px] text-slate-500">{new Date(wd.requestedAt).toLocaleDateString()}</td>
                <td className="mc-td">
                  <div className="flex gap-1.5">
                    {wd.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(wd.id, 'approved')}
                          className="flex items-center gap-1 rounded-lg bg-cmblue-50 px-2 py-1 text-[10px] font-bold text-cmblue-700 hover:bg-cmblue-100"
                        >
                          <FaCheck className="h-3 w-3" /> Approve
                        </button>
                        <button
                          onClick={() => updateStatus(wd.id, 'rejected')}
                          className="flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-100"
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
                        className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600 hover:bg-emerald-100"
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
