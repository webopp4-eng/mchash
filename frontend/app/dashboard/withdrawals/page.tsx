'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowUp, FaCheckCircle, FaClock, FaExclamationTriangle, FaCoins, FaBitcoin, FaEthereum } from 'react-icons/fa';
import { SiTether } from 'react-icons/si';
import { apiFetch } from '@/lib/auth';
import { useFinancialData, refreshFinancialData } from '@/lib/financialData';
import { toastEmitter } from '@/components/NotificationToast';

interface PayoutMethod {
  id: string;
  type: string;
  name: string;
  isDefault: boolean;
}

interface AssetOption {
  value: string;                 // sent to the API as `asset`
  label: string;                 // human-readable display label
  balanceKey: 'USDT' | 'BTC' | 'ETH' | 'MCCoin';
  icon: any;
  color: string;
  decimals: number;
}

/**
 * The four assets available on the user's profile.
 * balanceKey maps to the keys exposed by useFinancialData().assets.
 */
const ASSETS: AssetOption[] = [
  { value: 'USDT', label: 'USDT (Tether)', balanceKey: 'USDT', icon: SiTether, color: 'bg-emerald-50 text-emerald-600', decimals: 2 },
  { value: 'BTC', label: 'Bitcoin', balanceKey: 'BTC', icon: FaBitcoin, color: 'bg-amber-50 text-amber-600', decimals: 6 },
  { value: 'ETH', label: 'Ethereum', balanceKey: 'ETH', icon: FaEthereum, color: 'bg-sky-50 text-cmblue-700', decimals: 6 },
  { value: 'MC Coin', label: 'MC Coin', balanceKey: 'MCCoin', icon: FaCoins, color: 'bg-cmblue-50 text-cmblue-600', decimals: 6 },
];

const MIN_WITHDRAWAL = 10;
const MAX_WITHDRAWAL = 1000000;

export default function WithdrawalsPage() {
  const router = useRouter();
  const financial = useFinancialData();

  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('USDT');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ---- Load payout methods + withdrawal history once ----
  useEffect(() => {
    const loadPayoutMethods = async () => {
      try {
        setMethodsLoading(true);
        const methodsRes = await apiFetch('/api/payout-methods');
        const methods = Array.isArray(methodsRes.payoutMethods) ? methodsRes.payoutMethods : [];
        setPayoutMethods(methods);
        if (methods.length > 0) {
          const defaultMethod = methods.find((m: PayoutMethod) => m.isDefault) || methods[0];
          setSelectedMethodId(defaultMethod.id);
        }
      } catch (err) {
        console.error('Failed to load payout methods:', err);
      } finally {
        setMethodsLoading(false);
      }
    };

    const loadWithdrawals = async () => {
      try {
        const withdrawalsRes = await apiFetch('/api/withdrawals');
        setWithdrawals(withdrawalsRes.withdrawals || []);
      } catch (err) {
        console.error('Failed to load withdrawals:', err);
      }
    };

    loadPayoutMethods();
    loadWithdrawals();
  }, []);

  // ---- Derived values from the centralized financial hook ----
  const selectedAssetObj = ASSETS.find((a) => a.value === selectedAsset) || ASSETS[0];
  const selectedBalance = Number(financial.assets[selectedAssetObj.balanceKey] || 0);
  const hasBalance = selectedBalance > 0;
  const totalMined = financial.miningEarnings; // real server-side aggregate of all mining rewards

  // When the asset changes, clear the amount input
  const handleAssetChange = (value: string) => {
    setSelectedAsset(value);
    setAmount('');
    setError(null);
    setSuccess(null);
  };

  // ---- Withdrawal submission ----
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
      if (numAmount < MIN_WITHDRAWAL) {
        throw new Error(`Minimum withdrawal amount is ${MIN_WITHDRAWAL}`);
      }
      if (numAmount > MAX_WITHDRAWAL) {
        throw new Error(`Amount exceeds maximum limit of ${MAX_WITHDRAWAL.toLocaleString()}`);
      }

      // Gate: prevent withdrawal when the selected asset has no balance
      if (!hasBalance) {
        throw new Error(`No available ${selectedAssetObj.value} balance to withdraw`);
      }
      if (numAmount > selectedBalance) {
        throw new Error(
          `Insufficient ${selectedAssetObj.value} balance. You have ${selectedBalance.toFixed(6)} ${selectedAssetObj.value}`
        );
      }

      const res = await apiFetch('/api/withdrawals', {
        method: 'POST',
        body: JSON.stringify({
          amount: numAmount,
          currency: selectedAssetObj.value,
          asset: selectedAssetObj.value,
          payoutMethodId: selectedMethodId,
        }),
      });

      // Apply the freshly-debited balances returned by the POST for instant
      // cross-component sync, then reconcile via a background refetch.
      await refreshFinancialData({
        assets: {
          USDT: Number(res.balances?.USDT ?? financial.assets.USDT),
          BTC: Number(res.balances?.BTC ?? financial.assets.BTC),
          ETH: Number(res.balances?.ETH ?? financial.assets.ETH),
          MCCoin: Number(res.balances?.['MC Coin'] ?? financial.assets.MCCoin),
        },
        platformBalance: Number(res.platformBalance ?? financial.platformBalance),
      });

      const message = `Withdrawal of ${numAmount.toFixed(6)} ${selectedAssetObj.value} requested successfully!`;
      setSuccess(message);
      toastEmitter.success(
        'Withdrawal Requested',
        `${numAmount.toFixed(6)} ${selectedAssetObj.value} will be sent to your payout method`
      );

      setAmount('');

      // Reload withdrawal history
      try {
        const withdrawalsRes = await apiFetch('/api/withdrawals');
        setWithdrawals(withdrawalsRes.withdrawals || []);
      } catch (err) {
        console.error('Failed to reload withdrawals:', err);
      }

      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      const errorMsg = err.message || 'Withdrawal failed. Please try again.';
      setError(errorMsg);
      toastEmitter.error('Withdrawal Failed', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Loading state ----
  if (financial.loading || methodsLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
      </div>
    );
  }

  // ---- No payout methods ----
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
                Add Payout Method &rarr;
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

      {/* Balance Summary — Total Mined + Available (per selected asset) */}
      <section className="mc-card">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="text-center rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase">Total Mined Value</p>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-cmblue-600">${totalMined.toFixed(2)}</p>
            <p className="mt-1 text-[10px] sm:text-xs text-slate-500">All mined assets combined</p>
          </div>
          <div className="text-center rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase">Available Balance to Withdraw</p>
            {hasBalance ? (
              <>
                <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-600">
                  {selectedBalance.toFixed(selectedAssetObj.decimals)} {selectedAssetObj.value}
                </p>
                <p className="mt-1 text-[10px] sm:text-xs text-slate-500">For selected asset</p>
              </>
            ) : (
              <>
                <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-400">0</p>
                <p className="mt-1 text-[10px] sm:text-xs text-slate-500">
                  No available {selectedAssetObj.value} balance
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Asset Balances — 4-asset grid showing real per-asset balances */}
      <section className="mc-card">
        <div className="mb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-950">Your Asset Balances</h2>
          <p className="text-[10px] sm:text-xs text-slate-500">Select an asset to withdraw</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {ASSETS.map((asset) => {
            const balance = Number(financial.assets[asset.balanceKey] || 0);
            const isSelected = selectedAsset === asset.value;
            return (
              <button
                key={asset.value}
                type="button"
                onClick={() => handleAssetChange(asset.value)}
                className={`flex items-center justify-between rounded-2xl border-2 p-3 transition text-left ${
                  isSelected
                    ? 'border-cmblue-500 bg-cmblue-50'
                    : 'border-slate-200 bg-white hover:border-cmblue-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`mc-stat-icon shrink-0 ${asset.color}`}>
                    <asset.icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-950">{asset.label}</p>
                    <p className="text-[10px] text-slate-500 truncate">{asset.value}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className={`text-xs font-extrabold ${balance > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {balance > 0 ? balance.toFixed(asset.decimals) : '0'}
                  </p>
                  <p className="text-[9px] text-slate-400">{balance > 0 ? 'Available' : 'No balance'}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Withdrawal Form */}
      <section className="mc-card">
        <div className="mb-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-950">Request Withdrawal</h2>
          <p className="text-[10px] sm:text-xs text-slate-500">Funds will be sent to your selected payout method</p>
        </div>

        <div className="space-y-3">
          {/* Asset Selection — dropdown of the 4 profile currencies */}
          <div>
            <label className="text-[10px] sm:text-xs font-semibold text-slate-600">Asset / Currency</label>
            <select
              value={selectedAsset}
              onChange={(e) => handleAssetChange(e.target.value)}
              className="mc-input mt-1"
            >
              {ASSETS.map((asset) => {
                const balance = Number(financial.assets[asset.balanceKey] || 0);
                return (
                  <option key={asset.value} value={asset.value}>
                    {asset.label} {balance > 0 ? `(${balance.toFixed(asset.decimals)} available)` : '(No balance)'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* No-balance warning for the selected asset */}
          {!hasBalance && (
            <div className="flex items-start gap-2 rounded-[22px] border border-rose-200/80 bg-rose-50/80 p-3 backdrop-blur-xl">
              <FaExclamationTriangle className="h-4 w-4 flex-shrink-0 text-rose-600 mt-0.5" />
              <div className="text-xs font-semibold text-rose-600">
                No available {selectedAssetObj.value} balance. You need {selectedAssetObj.value} earnings to withdraw.
              </div>
            </div>
          )}

          {/* Payout Method Selection */}
          <div>
            <label className="text-[10px] sm:text-xs font-semibold text-slate-600">Withdraw To</label>
            <select
              value={selectedMethodId}
              onChange={(e) => setSelectedMethodId(e.target.value)}
              className="mc-input mt-1"
              disabled={!hasBalance}
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
            className="text-[10px] sm:text-xs text-cmblue-600 hover:text-cmblue-700 font-semibold"
          >
            Manage payout methods &rarr;
          </Link>

          {/* Amount */}
          <div>
            <label className="text-[10px] sm:text-xs font-semibold text-slate-600">
              Amount ({selectedAssetObj.value})
            </label>
            <div className="flex gap-2 mt-1">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={hasBalance ? `Max ${selectedBalance.toFixed(selectedAssetObj.decimals)}` : '0'}
                min={MIN_WITHDRAWAL}
                max={MAX_WITHDRAWAL}
                step="0.000001"
                disabled={!hasBalance}
                className="mc-input flex-1"
              />
              <button
                type="button"
                onClick={() => setAmount(selectedBalance.toFixed(selectedAssetObj.decimals))}
                disabled={!hasBalance}
                className="px-2 sm:px-3 py-2 text-[10px] sm:text-xs font-semibold text-cmblue-600 hover:bg-cmblue-100 rounded-lg transition whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Max
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {hasBalance
                ? `Available: ${selectedBalance.toFixed(selectedAssetObj.decimals)} ${selectedAssetObj.value} | Min: ${MIN_WITHDRAWAL} | Max: ${MAX_WITHDRAWAL.toLocaleString()}`
                : `No available ${selectedAssetObj.value} balance to withdraw`}
            </p>
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
            disabled={submitting || !amount || !selectedMethodId || !hasBalance}
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
                {!hasBalance
                  ? `No ${selectedAssetObj.value} Balance`
                  : `Request ${selectedAssetObj.value} Withdrawal`}
              </>
            )}
          </button>
        </div>
      </section>

      {/* Withdrawal History */}
      <section className="mc-card">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-950">Withdrawal History</h2>
            <p className="text-[10px] sm:text-xs text-slate-500">Your past withdrawal requests and status</p>
          </div>
          <div className="rounded-full bg-cmblue-50 px-3 py-1 text-[10px] sm:text-sm font-bold text-cmblue-700 w-fit">
            {withdrawals.length}
          </div>
        </div>

        {withdrawals.length > 0 ? (
          <div className="space-y-2">
            {withdrawals.map((wd: any) => (
              <div key={wd.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 rounded-2xl border border-sky-100 bg-sky-50/50 p-2.5 sm:p-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <span className={`mc-stat-icon ${
                    wd.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                    wd.status === 'rejected' ? 'bg-rose-50 text-rose-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {wd.status === 'completed' ? <FaCheckCircle className="h-4 w-4" /> :
                     wd.status === 'rejected' ? <FaArrowUp className="h-4 w-4" /> :
                     <FaClock className="h-4 w-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-950 truncate">
                      {wd.payoutMethod?.name || 'Unknown Method'} - {wd.asset || 'USDT'}
                    </p>
                    <p className="text-[8px] sm:text-[10px] text-slate-500">{new Date(wd.requestedAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs sm:text-sm font-extrabold text-slate-950">{Number(wd.amount).toFixed(6)} {wd.asset || 'USDT'}</p>
                  <span className={`mc-status text-[8px] sm:text-xs ${
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
            <p className="mt-3 text-xs sm:text-sm font-semibold text-slate-500">No withdrawals yet</p>
          </div>
        )}
      </section>
    </div>
  );
}
