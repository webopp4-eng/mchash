'use client';

import { useEffect, useState } from 'react';
import { FaArrowDown, FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import { apiFetch, getUser } from '@/lib/auth';
import { shortenAddress } from '@/lib/wallet';
import { toastEmitter } from '@/components/NotificationToast';

export default function AdminDeposits() {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  // Action/audit attribution ("Approved by X") is only rendered for the main
  // Admin — the API also strips these fields server-side for other roles.
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    try {
      setIsSuperAdmin(getUser()?.role === 'SUPER_ADMIN');
    } catch {
      setIsSuperAdmin(false);
    }
  }, []);

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

  const handleAction = async (depositId: string, status: 'approved' | 'rejected') => {
    setProcessingId(depositId);
    try {
      const deposit = deposits.find(d => d.id === depositId);
      const res = await apiFetch(`/api/admin/deposits/${depositId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      
      if (res.success) {
        const amount = deposit ? Number(deposit.amount).toFixed(2) : 'unknown';
        const user = deposit?.User?.username || 'User';
        
        if (status === 'approved') {
          toastEmitter.success('Deposit Approved', `$${amount} deposit from ${user} has been credited`);
        } else {
          toastEmitter.warning('Deposit Rejected', `$${amount} deposit from ${user} has been rejected`);
        }
        
        await loadDeposits();
      } else {
        throw new Error(res.error || 'Failed to update deposit');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to process deposit';
      toastEmitter.error('Action Failed', errorMsg);
      console.error('Failed to update deposit:', err);
    } finally {
      setProcessingId(null);
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
          <p className="mc-subtitle">Review pending deposits, confirm receiving accounts, and approve manual deposits.</p>
        </div>
        <div className="rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-extrabold text-emerald-600 ring-1 ring-emerald-100">
          {deposits.length} records
        </div>
      </div>

      <div className="mc-table-wrap">
        <table className="mc-table">
          <thead>
            <tr className="mc-table-head">
              <th className="mc-th">User</th>
              <th className="mc-th">Account</th>
              <th className="mc-th">Method</th>
              <th className="mc-th">Amount</th>
              <th className="mc-th">Reference</th>
              <th className="mc-th">Status</th>
              <th className="mc-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deposits.map((deposit) => (
              <tr key={deposit.id} className="mc-row align-top">
                <td className="mc-td">
                  <p className="text-xs font-bold text-slate-950">{deposit.User?.username || 'Unknown'}</p>
                  <p className="text-[10px] text-slate-500">{shortenAddress(deposit.User?.walletAddress || '', 6)}</p>
                </td>
                <td className="mc-td">
                  <p className="text-xs font-bold text-slate-950">{deposit.PaymentAccount?.name || 'Manual'}</p>
                  <p className="text-[10px] text-slate-500">{deposit.PaymentAccount?.label || deposit.PaymentAccount?.accountNumber || deposit.PaymentAccount?.walletAddress || 'No account'}</p>
                </td>
                <td className="mc-td text-xs font-semibold text-slate-600">{deposit.method || deposit.PaymentAccount?.type || 'manual'}</td>
                <td className="mc-td text-sm font-bold text-emerald-600">+${Number(deposit.amount).toFixed(2)}</td>
                <td className="mc-td text-[10px] text-slate-500">
                  <div className="max-w-[140px] break-all">{deposit.txHash || deposit.note || '—'}</div>
                  {deposit.proofUrl && (
                    <a href={deposit.proofUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-cmblue-600">
                      <FaEye className="h-2.5 w-2.5" /> Proof
                    </a>
                  )}
                </td>
                <td className="mc-td">
                  <span className={`mc-status ${
                    deposit.status === 'approved' || deposit.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                    deposit.status === 'rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {deposit.status}
                  </span>
                  {isSuperAdmin && deposit.status !== 'pending' && (deposit.processedByName || deposit.processedByRole) && (
                    <p className="mt-1 text-[10px] font-semibold text-slate-500">
                      {deposit.status === 'approved' || deposit.status === 'completed' ? 'Approved' : 'Rejected'} by{' '}
                      {deposit.processedByName || 'Staff'}
                      {deposit.processedByRole ? ` (${deposit.processedByRole === 'SUPER_ADMIN' || deposit.processedByRole === 'admin' ? 'Admin' : 'Employee'})` : ''}
                      {deposit.approvedAt ? ` · ${new Date(deposit.approvedAt).toLocaleString()}` : ''}
                    </p>
                  )}
                </td>
                <td className="mc-td">
                  {deposit.status === 'pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(deposit.id, 'approved')}
                        disabled={processingId === deposit.id}
                        className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white disabled:opacity-60"
                      >
                        <FaCheck className="h-2.5 w-2.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(deposit.id, 'rejected')}
                        disabled={processingId === deposit.id}
                        className="inline-flex items-center gap-1 rounded-xl bg-rose-500 px-2 py-1 text-[10px] font-bold text-white disabled:opacity-60"
                      >
                        <FaTimes className="h-2.5 w-2.5" /> Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500">Processed</span>
                  )}
                </td>
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
