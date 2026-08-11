'use client';

import { useEffect, useState } from 'react';
import { FaArrowUp, FaWallet, FaCheckCircle, FaClock } from 'react-icons/fa';
import { apiFetch, getUser } from '@/lib/auth';

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
      if (!user) throw new Error('Please connect your wallet first');

      const res = await apiFetch('/api/withdrawals', {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(amount),
          currency: 'USDT',
          chain: user.chain,
        }),
      });

      setSuccess('Withdrawal request submitted successfully!');
      setAmount('');
      loadWithdrawals();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Withdrawals</h1>
        <p className="mt-1 text-sm text-slate-400">Withdraw your earnings to your wallet</p>
      </div>

      {/* Withdrawal Form */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <h2 className="text-sm font-semibold text-cmblue-300">Request Withdrawal</h2>
        <p className="mt-1 text-[10px] text-slate-500">Funds will be sent to your connected wallet</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-slate-400">Amount (USDT)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cmblue-500/50"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
              {success}
            </div>
          )}

          <button
            onClick={handleWithdraw}
            disabled={submitting || !amount}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cmblue-600 to-cmblue-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Processing...
              </>
            ) : (
              <>
                <FaArrowUp className="h-4 w-4" />
                Request Withdrawal
              </>
            )}
          </button>
        </div>
      </div>

      {/* Withdrawal History */}
      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-cmblue-300">Withdrawal History</h2>
          <p className="text-[10px] text-slate-500">Your withdrawal requests</p>
        </div>

        {withdrawals.length > 0 ? (
          <div className="space-y-2">
            {withdrawals.map((wd: any) => (
              <div key={wd.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                    wd.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                    wd.status === 'rejected' ? 'bg-rose-500/20 text-rose-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {wd.status === 'completed' ? <FaCheckCircle className="h-3.5 w-3.5" /> :
                     wd.status === 'rejected' ? <FaArrowUp className="h-3.5 w-3.5" /> :
                     <FaClock className="h-3.5 w-3.5" />}
                  </span>
                  <div>
                    <p className="text-xs font-semibold">{wd.currency} Withdrawal</p>
                    <p className="text-[10px] text-slate-500">{new Date(wd.requestedAt).toLocaleString()}</p>
                    {wd.txHash && (
                      <p className="mt-0.5 text-[9px] text-slate-600">Hash: {wd.txHash.slice(0, 12)}...</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">${Number(wd.amount).toFixed(2)}</p>
                  <span className={`text-[10px] font-medium ${
                    wd.status === 'completed' ? 'text-emerald-400' :
                    wd.status === 'rejected' ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    {wd.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">No withdrawals yet</p>
        )}
      </div>
    </div>
  );
}