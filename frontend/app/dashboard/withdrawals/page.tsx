'use client';

import { useEffect, useState } from 'react';
import { FaArrowUp, FaWallet, FaCheckCircle, FaClock } from 'react-icons/fa';
import { apiFetch, getUser } from '@/lib/auth';
import { toastEmitter } from '@/components/NotificationToast';

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      const res = await apiFetch('/api/withdrawals');
      setWithdrawals(res.withdrawals || []);
    } catch (err) {
      console.error('Failed to load withdrawals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const user = getUser();
      if (!user) {
        throw new Error('Please connect your wallet first');
      }

      const numAmount = Number(amount);
      if (!numAmount || numAmount <= 0) {
        throw new Error('Please enter a valid amount greater than 0');
      }
      if (numAmount > 1000000) {
        throw new Error('Amount exceeds maximum limit of $1,000,000');
      }
      if (numAmount < 10) {
        throw new Error('Minimum withdrawal amount is $10');
      }

      const res = await apiFetch('/api/withdrawals', {
        method: 'POST',
        body: JSON.stringify({
          amount: numAmount,
          currency: 'USDT',
          chain: user.chain,
        }),
      });

      const message = `Withdrawal of $${numAmount.toFixed(2)} requested successfully!`;
      setSuccess(message);
      toastEmitter.success('Withdrawal Requested', `$${numAmount.toFixed(2)} will be sent to your wallet`);
      setAmount('');
      loadWithdrawals();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      const errorMsg = err.message || 'Withdrawal failed. Please try again.';
      setError(errorMsg);
      toastEmitter.error('Withdrawal Failed', errorMsg);
    } finally {
      setSubmitting(false);
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
      <section className="mc-page-header">
        <div>
          <p className="text-[10px] font-bold uppercase text-cmblue-600">Withdrawals</p>
          <h1 className="mc-title">Withdraw Earnings</h1>
          <p className="mc-subtitle">Withdraw your platform balance to your wallet</p>
        </div>
      </section>

      {/* Withdrawal Form */}
      <section className="mc-card">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-950">Request Withdrawal</h2>
          <p className="text-xs text-slate-500">Funds will be sent to your connected wallet address</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-600">Amount (USDT)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter withdrawal amount"
              className="mc-input mt-1"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-[22px] border border-rose-200/80 bg-rose-50/80 p-3 backdrop-blur-xl">
              <div className="text-xs font-semibold text-rose-600">{error}</div>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 rounded-[22px] border border-emerald-200/80 bg-emerald-50/80 p-3 backdrop-blur-xl">
              <div className="text-xs font-semibold text-emerald-600">{success}</div>
            </div>
          )}

          <button
            onClick={handleWithdraw}
            disabled={submitting || !amount}
            className="mc-button w-full"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Processing...
              </>
            ) : (
              <>
                <FaArrowUp className="h-3.5 w-3.5" />
                Request Withdrawal
              </>
            )}
          </button>
        </div>
      </section>

      {/* Withdrawal History */}
      <section className="mc-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">Withdrawal History</h2>
            <p className="text-xs text-slate-500">Your past withdrawal requests and status</p>
          </div>
          <div className="rounded-full bg-cmblue-50 px-3 py-1 text-sm font-bold text-cmblue-700">
            {withdrawals.length}
          </div>
        </div>

        {withdrawals.length > 0 ? (
          <div className="space-y-2">
            {withdrawals.map((wd: any) => (
              <div key={wd.id} className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
                <div className="flex items-center gap-3">
                  <span className={`mc-stat-icon ${
                    wd.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                    wd.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {wd.status === 'completed' ? <FaCheckCircle className="h-4 w-4" /> :
                     wd.status === 'rejected' ? <FaArrowUp className="h-4 w-4" /> :
                     <FaClock className="h-4 w-4" />}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-950">{wd.currency || 'USDT'} Withdrawal</p>
                    <p className="text-[10px] text-slate-500">{new Date(wd.requestedAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-slate-950">${Number(wd.amount).toFixed(2)}</p>
                  <span className={`mc-status ${
                    wd.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                    wd.status === 'rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {wd.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <FaArrowUp className="mx-auto h-10 w-10 text-cmblue-200" />
            <p className="mt-3 text-sm font-semibold text-slate-500">No withdrawals yet</p>
          </div>
        )}
      </section>
    </div>
  );
}