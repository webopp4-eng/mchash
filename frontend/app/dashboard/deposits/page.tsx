'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowDown, FaArrowLeft, FaCheck, FaTimes, FaEye, FaUpload } from 'react-icons/fa';
import { apiFetch, getUser, User } from '@/lib/auth';
import { refreshFinancialData } from '@/lib/financialData';
import { toastEmitter } from '@/components/NotificationToast';

const PAYMENT_METHODS = [
  { value: 'bank', label: 'Bank Transfer', icon: '🏦' },
  { value: 'crypto', label: 'Crypto Wallet', icon: '₿' },
  { value: 'momo', label: 'Mobile Money', icon: '📱' },
  { value: 'opay', label: 'OPay', icon: '💳' },
];

interface PaymentAccount {
  id: string;
  type: string;
  name: string;
  label?: string;
  bankName?: string;
  accountNumber?: string;
  walletAddress?: string;
  active: boolean;
  isDefault?: boolean;
}

interface DepositFormData {
  amount: string;
  currency: string;
  paymentMethod: string;
  accountId: string;
  txHash: string;
  note: string;
  proofFile: File | null;
  proofUrl: string;
}

export default function DepositsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [form, setForm] = useState<DepositFormData>({
    amount: '',
    currency: 'USDT',
    paymentMethod: 'bank',
    accountId: '',
    txHash: '',
    note: '',
    proofFile: null,
    proofUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    loadPaymentAccounts();
    setLoading(false);
  }, [router]);

  const loadPaymentAccounts = async () => {
    try {
      const res = await apiFetch('/api/payment-accounts');
      const accounts = res.paymentAccounts || [];
      setAccounts(accounts.filter((a: any) => a.active));
      
      if (accounts.length > 0) {
        const defaultAccount = accounts.find((a: any) => a.isDefault && a.type === 'bank') || 
                              accounts.find((a: any) => a.type === 'bank');
        if (defaultAccount) {
          setForm(prev => ({ ...prev, accountId: defaultAccount.id }));
        }
      }
    } catch (err) {
      console.error('Failed to load payment accounts:', err);
    }
  };

  const filteredAccounts = accounts.filter(a => a.type === form.paymentMethod);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create data URL for preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm(prev => ({
        ...prev,
        proofFile: file,
        proofUrl: event.target?.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const validateForm = (): string | null => {
    if (!form.amount || Number(form.amount) <= 0) {
      return 'Please enter a valid deposit amount greater than 0';
    }
    if (Number(form.amount) < 10) {
      return 'Minimum deposit amount is $10';
    }
    if (Number(form.amount) > 1000000) {
      return 'Maximum deposit amount is $1,000,000';
    }
    if (!form.accountId) {
      return 'Please select a receiving account';
    }
    if (!form.txHash || !form.txHash.trim()) {
      return 'Transaction reference or TXID is required';
    }
    if (form.paymentMethod === 'crypto' && !form.proofUrl) {
      return 'Crypto deposits require proof upload';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      toastEmitter.error('Validation Error', validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch('/api/deposits', {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(form.amount),
          currency: form.currency,
          paymentAccountId: form.accountId,
          method: form.paymentMethod,
          txHash: form.txHash,
          proofUrl: form.proofUrl || null,
          note: form.note || null,
        }),
      });

      const message = `Deposit of $${Number(form.amount).toFixed(2)} submitted and awaiting verification.`;
      setSuccess(message);
      toastEmitter.success(
        'Deposit Submitted',
        `Your $${Number(form.amount).toFixed(2)} deposit is pending verification`
      );

      // Refresh financial data across the app
      await refreshFinancialData();

      // Reset form
      setForm({
        amount: '',
        currency: 'USDT',
        paymentMethod: 'bank',
        accountId: filteredAccounts.length > 0 ? filteredAccounts[0].id : '',
        txHash: '',
        note: '',
        proofFile: null,
        proofUrl: '',
      });

      setTimeout(() => {
        router.push('/dashboard/transactions');
      }, 2000);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to submit deposit';
      setError(errorMsg);
      toastEmitter.error('Deposit Failed', errorMsg);
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
      {/* Header */}
      <section className="mc-page-header">
        <div>
          <p className="text-[10px] font-bold uppercase text-cmblue-600">Deposits</p>
          <h1 className="mc-title">Submit Deposit</h1>
          <p className="mc-subtitle">Add funds to your MC HASH account by depositing through your preferred payment method</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="mc-card space-y-6">
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <FaTimes className="mt-0.5 h-4 w-4 text-rose-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-rose-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <FaCheck className="mt-0.5 h-4 w-4 text-emerald-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-emerald-700">{success}</p>
              </div>
            )}

            {/* Payment Method Selection */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => {
                      setForm(prev => ({ 
                        ...prev, 
                        paymentMethod: method.value,
                        accountId: '',
                      }));
                    }}
                    className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition ${
                      form.paymentMethod === method.value
                        ? 'border-cmblue-500 bg-cmblue-50'
                        : 'border-slate-200 bg-white hover:border-cmblue-300'
                    }`}
                  >
                    <span className="text-2xl">{method.icon}</span>
                    <span className="text-xs font-bold text-center">{method.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Account Selection */}
            {filteredAccounts.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Receive into Account
                </label>
                <div className="space-y-2">
                  {filteredAccounts.map((account) => (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, accountId: account.id }))}
                      className={`w-full flex items-center justify-between rounded-2xl border-2 p-4 transition text-left ${
                        form.accountId === account.id
                          ? 'border-cmblue-500 bg-cmblue-50'
                          : 'border-slate-200 bg-white hover:border-cmblue-300'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-slate-900">{account.name || account.label}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {account.bankName && `${account.bankName} - `}
                          {account.accountNumber && `***${account.accountNumber.slice(-4)}`}
                          {account.walletAddress && `${account.walletAddress.substring(0, 6)}...${account.walletAddress.slice(-4)}`}
                        </p>
                      </div>
                      {account.isDefault && (
                        <span className="text-xs font-bold text-cmblue-600 bg-cmblue-100 px-2 py-1 rounded-full">
                          Default
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Amount to Deposit
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="10"
                  max="1000000"
                  value={form.amount}
                  onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="500.00"
                  className="mc-input flex-1"
                />
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, amount: '1000' }))}
                  className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Quick
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">Min: $10 | Max: $1,000,000</p>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Currency
              </label>
              <select
                value={form.currency}
                onChange={(e) => setForm(prev => ({ ...prev, currency: e.target.value }))}
                className="mc-input"
              >
                <option value="USDT">USDT (Tether)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="NGN">NGN (Nigerian Naira)</option>
              </select>
            </div>

            {/* Transaction Reference */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                {form.paymentMethod === 'crypto' ? 'Transaction Hash (TXID)' : 'Reference / Transaction ID'}
              </label>
              <input
                type="text"
                value={form.txHash}
                onChange={(e) => setForm(prev => ({ ...prev, txHash: e.target.value }))}
                placeholder={form.paymentMethod === 'crypto' ? '0x...' : 'TRF123456789'}
                className="mc-input"
              />
              <p className="text-xs text-slate-500 mt-1">
                {form.paymentMethod === 'crypto' 
                  ? 'Paste the transaction hash from your blockchain transfer'
                  : 'Provide the reference number from your transfer'}
              </p>
            </div>

            {/* Proof Upload for Crypto */}
            {form.paymentMethod === 'crypto' && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Payment Proof
                </label>
                <div className="border-2 border-dashed border-cmblue-300 rounded-2xl p-6 text-center">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="proof-upload"
                  />
                  <label htmlFor="proof-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <FaUpload className="h-6 w-6 text-cmblue-500" />
                      <p className="text-sm font-bold text-slate-900">
                        {form.proofFile ? form.proofFile.name : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-xs text-slate-500">PNG, JPG, or PDF (Max 10MB)</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Note */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                value={form.note}
                onChange={(e) => setForm(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Any additional information about this deposit..."
                rows={3}
                className="mc-input resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mc-button"
            >
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Submitting Deposit...
                </>
              ) : (
                <>
                  <FaArrowDown className="h-3.5 w-3.5" />
                  Submit Deposit
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          {/* Info Card */}
          <div className="mc-card bg-cmblue-50/50 border border-cmblue-200">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="text-lg">ℹ️</span> Deposit Information
            </h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2">
                <span className="font-bold text-cmblue-600">•</span>
                <span>Deposits are verified within 1-2 hours</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-cmblue-600">•</span>
                <span>Funds appear as "Pending" until verified</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-cmblue-600">•</span>
                <span>Keep your transaction reference handy</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-cmblue-600">•</span>
                <span>All amounts are in USD/USDT equivalent</span>
              </li>
            </ul>
          </div>

          {/* Steps Card */}
          <div className="mc-card">
            <h3 className="font-bold text-slate-900 mb-3">How it works</h3>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-cmblue-500 text-white text-xs font-bold">1</span>
                <div className="text-sm">
                  <p className="font-bold text-slate-900">Select Method</p>
                  <p className="text-xs text-slate-500">Choose your deposit method</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-cmblue-500 text-white text-xs font-bold">2</span>
                <div className="text-sm">
                  <p className="font-bold text-slate-900">Enter Amount</p>
                  <p className="text-xs text-slate-500">Specify deposit amount</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-cmblue-500 text-white text-xs font-bold">3</span>
                <div className="text-sm">
                  <p className="font-bold text-slate-900">Provide Reference</p>
                  <p className="text-xs text-slate-500">Add transaction details</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-cmblue-500 text-white text-xs font-bold">4</span>
                <div className="text-sm">
                  <p className="font-bold text-slate-900">Submit & Wait</p>
                  <p className="text-xs text-slate-500">Verification in 1-2 hours</p>
                </div>
              </li>
            </ol>
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            <Link
              href="/dashboard/transactions"
              className="flex-1 mc-button-secondary text-center"
            >
              View History
            </Link>
            <Link
              href="/dashboard/wallet"
              className="flex-1 mc-button-secondary text-center"
            >
              Back to Wallet
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
