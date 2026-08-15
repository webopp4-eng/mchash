'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowUp, FaWallet, FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { apiFetch, getUser } from '@/lib/auth';
import { toastEmitter } from '@/components/NotificationToast';

interface PayoutMethod {
  id: string;
  type: string;
  name: string;
  isDefault: boolean;
}

export default function WithdrawalsPage() {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load payout methods
      const methodsRes = await apiFetch('/api/payout-methods');
      const methods = Array.isArray(methodsRes.payoutMethods) ? methodsRes.payoutMethods : [];
      setPayoutMethods(methods);

      // If no payout methods, redirect to create one
      if (methods.length === 0) {
        setTimeout(() => {
          toastEmitter.info('Set up a payout method first', 'You need to configure a payout method before withdrawing');
          router.push('/dashboard/profile/payout-methods');
        }, 500);
        return;
      }

      // Set first method as selected (or the default one)
      const defaultMethod = methods.find((m: PayoutMethod) => m.isDefault) || methods[0];
      setSelectedMethodId(defaultMethod.id);

      // Load withdrawals
      const withdrawalsRes = await apiFetch('/api/withdrawals');
      setWithdrawals(withdrawalsRes.withdrawals || []);

      // Load wallet data for balance
      const walletRes = await apiFetch('/api/wallet');
      const totalBalance = Object.values(walletRes || {}).reduce((sum: number, val: any) => {
        return sum + Number(val?.balance || 0);
      }, 0);
      setBalance(totalBalance || 0);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      if (!selectedMethodId) {
        throw new Error('Please select a payout method');
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
      if (numAmount > balance) {
        throw new Error(`Insufficient balance. You have $${balance.toFixed(2)}`);
      }

      const res = await apiFetch('/api/withdrawals', {
        method: 'POST',
        body: JSON.stringify({
          amount: numAmount,
          currency: 'USDT',
          asset: 'USDT',
          payoutMethodId: selectedMethodId,
        }),
      });

      const message = `Withdrawal of $${numAmount.toFixed(2)} requested successfully!`;
      setSuccess(message);
      toastEmitter.success('Withdrawal Requested', `$${numAmount.toFixed(2)} will be sent to your payout method`);
      setAmount('');
      loadData();
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

  // No payout methods
  if (payoutMethods.length === 0) {
    return (
      <div className="mc-page">
        <section className="mc-card">
          <div className="flex items-center gap-4 text-center">
            <FaExclamationTriangle className="h-8 w-8 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="text-base font-bold text-slate-950">Set Up a Payout Method</h2>
              <p className="mt-2 text-sm text-slate-600">You need to configure a payout method before you can withdraw funds.</p>
              <Link
                href="/dashboard/profile/payout-methods"
                className="mt-4 inline-block px-4 py-2 bg-cmblue-600 hover:bg-cmblue-700 text-white font-semibold rounded-lg transition"
              >
                Add Payout Method →
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mc-page">
      <section className="mc-page-header">
        <div>
          <p className="text-[10px] font-bold uppercase text-cmblue-600">Withdrawals</p>
          <h1 className="mc-title">Withdraw Earnings</h1>
          <p className="mc-subtitle">Transfer your earnings to your payout method</p>
        </div>
      </section>

      {/* Current Balance */}
      <section className="mc-card">
        <div className="text-center">
          <p className="text-xs font-semibold text-slate-500 uppercase">Available Balance</p>
          <p className="mt-2 text-4xl font-extrabold text-cmblue-600">${balance.toFixed(2)}</p>
          <p className="mt-1 text-xs text-slate-500">USDT</p>
        </div>
      </section>

      {/* Withdrawal Form */}
      <section className="mc-card">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-950">Request Withdrawal</h2>
          <p className="text-xs text-slate-500">Funds will be sent to your selected payout method</p>
        </div>

        <div className="space-y-3">
          {/* Payout Method Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-600">Withdraw To</label>
            <select
              value={selectedMethodId}
              onChange={(e) => setSelectedMethodId(e.target.value)}
              className="mc-input mt-1"
            >
              {payoutMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name} ({method.type}) {method.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Manage Payout Methods Link */}
          <Link
            href="/dashboard/profile/payout-methods"
            className="text-xs text-cmblue-600 hover:text-cmblue-700 font-semibold"
          >
            Manage payout methods →
          </Link>

          {/* Amount */}
          <div>
            <label className="text-xs font-semibold text-slate-600">Amount (USDT)</label>
            <div className="flex gap-2 mt-1">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter withdrawal amount"
                min="10"
                max="1000000"
                step="0.01"
                className="mc-input flex-1"
              />
              <button
                type="button"
                onClick={() => setAmount(balance.toFixed(2))}
                className="px-3 py-2 text-xs font-semibold text-cmblue-600 hover:bg-cmblue-100 rounded-lg transition"
              >
                Max
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Min: $10 | Max: $1,000,000</p>
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
            disabled={submitting || !amount || !selectedMethodId}
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
                <div className="flex items-center gap-3 flex-1">
                  <span className={`mc-stat-icon ${
                    wd.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                    wd.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {wd.status === 'completed' ? <FaCheckCircle className="h-4 w-4" /> :
                     wd.status === 'rejected' ? <FaArrowUp className="h-4 w-4" /> :
                     <FaClock className="h-4 w-4" />}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-950">
                      {wd.payoutMethod?.name || 'Unknown Method'} - {wd.asset || 'USDT'}
                    </p>
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
