'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaArrowDown, FaArrowUp, FaBitcoin, FaCopy, FaEthereum, FaExchangeAlt, FaHistory, FaWallet } from 'react-icons/fa';
import { SiTether } from 'react-icons/si';
import { apiFetch, getUser, User } from '@/lib/auth';
import { shortenAddress } from '@/lib/wallet';

const paymentMethods = [
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'crypto', label: 'Crypto Wallet' },
  { value: 'momo', label: 'Mobile Money' },
  { value: 'opay', label: 'OPay' },
  { value: 'other', label: 'Other' },
];

export default function WalletPage() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [paymentAccounts, setPaymentAccounts] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState('bank');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [depositForm, setDepositForm] = useState({ amount: '', currency: 'USDT', txHash: '', note: '', proofUrl: '' });
  const [depositMessage, setDepositMessage] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [marketPrices, setMarketPrices] = useState<any>(null);

  useEffect(() => {
    setUser(getUser());
    loadWallet();
    loadPaymentAccounts();
    loadMarketPrices();
  }, []);

  const loadMarketPrices = async () => {
    try {
      const res = await apiFetch('/api/market-prices');
      setMarketPrices(res.prices || null);
    } catch (err) {
      console.error('Failed to load market prices:', err);
    }
  };

  const loadWallet = async () => {
    try {
      const res = await apiFetch('/api/wallet');
      setData(res);
    } catch (err) {
      console.error('Failed to load wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentAccounts = async () => {
    try {
      const res = await apiFetch('/api/payment-accounts');
      const accounts = res.paymentAccounts || [];
      setPaymentAccounts(accounts);
      const defaultAccount = accounts.find((account: any) => account.active && account.isDefault && account.type === selectedMethod) || accounts.find((account: any) => account.active && account.type === selectedMethod);
      if (defaultAccount) setSelectedAccountId(defaultAccount.id);
    } catch (err) {
      console.error('Failed to load payment accounts:', err);
    }
  };

  const copyAddress = () => {
    const address = data?.walletAddress || user?.walletAddress || '';
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredAccounts = paymentAccounts.filter((account: any) => account.active && account.type === selectedMethod);

  useEffect(() => {
    if (!filteredAccounts.length) {
      setSelectedAccountId('');
      return;
    }
    const nextDefault = filteredAccounts.find((account: any) => account.isDefault) || filteredAccounts[0];
    setSelectedAccountId((current) => current && filteredAccounts.some((account: any) => account.id === current) ? current : nextDefault.id);
  }, [selectedMethod, paymentAccounts]);

  const handleDepositFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = () => {
      setDepositForm((current) => ({ ...current, proofUrl: String(fileReader.result || '') }));
    };
    fileReader.readAsDataURL(file);
  };

  const submitDeposit = async () => {
    const walletAddress = data?.walletAddress || user?.walletAddress || '';
    if (!walletAddress) {
      setDepositError('Connect your wallet to continue with a crypto deposit.');
      return;
    }
    if (!depositForm.amount || Number(depositForm.amount) <= 0) {
      setDepositError('Enter a valid deposit amount.');
      return;
    }
    if (!selectedAccountId) {
      setDepositError('Select an active receiving account for this payment method.');
      return;
    }
    if (!depositForm.txHash && selectedMethod === 'crypto') {
      setDepositError('Crypto deposits require a TXID / hash.');
      return;
    }

    setSubmittingDeposit(true);
    setDepositError(null);
    setDepositMessage(null);

    try {
      await apiFetch('/api/deposits', {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(depositForm.amount),
          currency: depositForm.currency,
          paymentAccountId: selectedAccountId,
          method: selectedMethod,
          walletAddress,
          txHash: depositForm.txHash || null,
          proofUrl: depositForm.proofUrl || null,
          note: depositForm.note || null,
        }),
      });

      setDepositMessage('Deposit submitted and awaiting verification.');
      setDepositForm({ amount: '', currency: 'USDT', txHash: '', note: '', proofUrl: '' });
      setSelectedMethod('bank');
      setTimeout(() => setDepositOpen(false), 1200);
    } catch (error: any) {
      setDepositError(error.message || 'Unable to submit deposit.');
    } finally {
      setSubmittingDeposit(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
      </div>
    );
  }

  const balance = Number(data?.platformBalance || user?.platformBalance || 0);
  const walletAddress = data?.walletAddress || user?.walletAddress || '';
  const chain = data?.chain || user?.chain || 'ethereum';
  const walletType = data?.walletType || user?.walletType || 'Wallet';
  const recent = data?.recentTransactions || [];

  const btcPrice = Number(marketPrices?.BTC?.price || 0);
  const ethPrice = Number(marketPrices?.ETH?.price || 0);
  const usdtPrice = Number(marketPrices?.USDT?.price || 1);

  const mcCoinBalance = Number(data?.balances?.['MC Coin'] ?? data?.balances?.mcCoin ?? balance ?? 0);
  const usdtBalance = Number(data?.balances?.USDT ?? data?.balances?.usdt ?? balance ?? 0);
  const ethBalance = Number(data?.balances?.ETH ?? data?.balances?.eth ?? 0);
  const btcBalance = Number(data?.balances?.BTC ?? data?.balances?.btc ?? 0);

  const assets = [
    { symbol: 'MC Coin', value: mcCoinBalance, units: mcCoinBalance.toFixed(2), icon: FaWallet, color: 'bg-cmblue-50 text-cmblue-600' },
    { symbol: 'USDT', value: usdtBalance, units: usdtBalance.toFixed(2), icon: SiTether, color: 'bg-emerald-50 text-emerald-600' },
    { symbol: 'BTC', value: btcBalance, units: btcBalance.toFixed(6), icon: FaBitcoin, color: 'bg-amber-50 text-amber-600' },
    { symbol: 'ETH', value: ethBalance, units: ethBalance.toFixed(6), icon: FaEthereum, color: 'bg-sky-50 text-cmblue-700' },
  ];

  const recentTransactions = (recent.length > 0 ? recent : []).map((tx: any) => ({
    label: tx.type ? (tx.type === 'deposit' ? 'Deposit' : tx.type === 'withdrawal' ? 'Withdrawal' : tx.type === 'purchase' ? 'Plan Purchase' : 'Mining Reward') : tx.label,
    value: `${Number(tx.amount || 0) >= 0 ? '+' : ''}$${Number(tx.amount || 0).toFixed(2)}`,
    status: tx.status || 'Completed',
  }));

  return (
    <div className="mc-page">
      <section className="mc-page-header">
        <div>
          <p className="text-[10px] font-bold uppercase text-cmblue-600">Wallet</p>
          <h1 className="mc-title">MC HASH Wallet</h1>
          <p className="mc-subtitle">Balances, connected wallet, assets, and transaction activity.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={copyAddress} className="mc-button-secondary">
            <FaCopy className="h-3.5 w-3.5" />
            {copied ? 'Copied' : 'Copy address'}
          </button>
          <button onClick={() => setDepositOpen(true)} className="mc-button">
            <FaArrowDown className="h-3.5 w-3.5" />
            Deposit
          </button>
        </div>
      </section>

      {depositOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase text-cmblue-600">Manual Deposit</p>
                <h2 className="text-xl font-extrabold text-slate-950">Submit deposit</h2>
              </div>
              <button onClick={() => setDepositOpen(false)} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">Close</button>
            </div>

            {!walletAddress && (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-700">
                Connect your wallet to continue with a crypto deposit.
              </div>
            )}

            {depositError && <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{depositError}</div>}
            {depositMessage && <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{depositMessage}</div>}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Payment method</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.value}
                      onClick={() => setSelectedMethod(method.value)}
                      className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold ${selectedMethod === method.value ? 'border-cmblue-500 bg-cmblue-50 text-cmblue-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Receiving account</label>
                <div className="space-y-2">
                  {(filteredAccounts.length ? filteredAccounts : [{ id: 'none', name: 'No active accounts', label: 'Unavailable', accountNumber: '', walletAddress: '', isDefault: false, active: false }]).map((account: any) => (
                    <button
                      key={account.id}
                      disabled={!account.active}
                      onClick={() => setSelectedAccountId(account.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left ${selectedAccountId === account.id ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white'} ${!account.active ? 'opacity-50' : ''}`}
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-950">{account.name || account.label || 'Account'}</p>
                        <p className="text-[11px] text-slate-500">{account.accountNumber || account.walletAddress || account.bankName || 'No details available'}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${account.isDefault ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {account.isDefault ? 'Default' : account.active ? 'Active' : 'Disabled'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Amount</label>
                <input value={depositForm.amount} onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })} type="number" min="1" step="0.01" placeholder="500.00" className="mc-input" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Currency</label>
                <select value={depositForm.currency} onChange={(e) => setDepositForm({ ...depositForm, currency: e.target.value })} className="mc-input">
                  <option value="USDT">USDT</option>
                  <option value="USD">USD</option>
                  <option value="NGN">NGN</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">{selectedMethod === 'crypto' ? 'TXID / Hash' : 'Reference / Transaction ID'}</label>
                <input value={depositForm.txHash} onChange={(e) => setDepositForm({ ...depositForm, txHash: e.target.value })} type="text" placeholder={selectedMethod === 'crypto' ? '0xabc...' : 'Transfer reference'} className="mc-input" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Proof upload</label>
                <input type="file" accept="image/png,image/jpeg,application/pdf" onChange={handleDepositFile} className="mc-input" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Note</label>
                <textarea value={depositForm.note} onChange={(e) => setDepositForm({ ...depositForm, note: e.target.value })} rows={3} placeholder="Optional deposit note" className="mc-input resize-none" />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setDepositOpen(false)} className="mc-button-secondary">Cancel</button>
              <button onClick={submitDeposit} disabled={submittingDeposit} className="mc-button">
                {submittingDeposit ? 'Submitting...' : 'Submit deposit'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="mc-glass-blue">
          <div className="flex flex-col gap-8">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-white/75">Total Balance</p>
                <p className="mt-3 text-4xl font-extrabold sm:text-5xl">${balance.toFixed(2)}</p>
                <p className="mt-2 text-sm text-white/80 capitalize">{walletType} on {chain}</p>
              </div>
              <FaWallet className="h-10 w-10 text-white/70" />
            </div>
            <div className="rounded-2xl bg-white/14 p-3 ring-1 ring-white/25">
              <p className="text-[10px] font-bold uppercase text-white/65">Connected Wallet</p>
              <p className="mt-1 truncate text-sm font-bold">{shortenAddress(walletAddress, 10) || 'No wallet connected'}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[{ label: 'Deposit', href: '#', icon: FaArrowDown, className: 'bg-emerald-500 hover:bg-emerald-600' }, { label: 'Withdraw', href: '/dashboard/withdrawals', icon: FaArrowUp, className: 'bg-rose-500 hover:bg-rose-600' }, { label: 'Transfer', href: '/dashboard/transactions', icon: FaExchangeAlt, className: 'bg-cmblue-500 hover:bg-cmblue-600' }].map((item) => (
                <button key={item.label} onClick={() => item.label === 'Deposit' ? setDepositOpen(true) : null} className={`rounded-xl px-3 py-2 text-center text-xs font-bold text-white shadow-sm ${item.className}`}>
                  <item.icon className="mx-auto mb-1 h-3.5 w-3.5" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="mc-card">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-950">Assets</h2>
            <p className="text-xs text-slate-500">Asset balances and values</p>
          </div>
          <div className="space-y-2">
            {assets.map((asset) => (
              <div key={asset.symbol} className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
                <div className="flex items-center gap-3">
                  <span className={`mc-stat-icon ${asset.color}`}>
                    <asset.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-950">{asset.symbol}</p>
                    <p className="text-[10px] text-slate-500">{asset.units} units</p>
                  </div>
                </div>
                <p className="text-sm font-extrabold text-slate-950">${asset.value.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mc-card">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950">Recent Activity</h2>
            <p className="text-xs text-slate-500">Clean transaction and wallet activity information</p>
          </div>
          <Link href="/dashboard/transactions" className="mc-button-secondary min-h-8 px-3 py-1">View all</Link>
        </div>
        <div className="grid gap-2 lg:grid-cols-2">
          {recentTransactions.slice(0, 6).map((item: any) => (
            <div key={item.label + item.value} className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
              <div className="flex items-center gap-3">
                <span className="mc-stat-icon bg-white text-cmblue-600">
                  <FaHistory className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-950">{item.label}</p>
                  <p className="text-[10px] text-slate-500">{item.status}</p>
                </div>
              </div>
              <p className={`text-sm font-extrabold ${item.value.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>{item.value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
