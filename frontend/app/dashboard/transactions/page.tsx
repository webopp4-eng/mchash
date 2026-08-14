'use client';

import { useEffect, useState } from 'react';
import { FaArrowDown, FaArrowUp, FaBolt, FaWallet, FaUsers, FaExchangeAlt, FaReceipt } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';

const filters = ['All', 'Deposit', 'Withdrawal', 'Transfer', 'Mining Reward', 'Team Reward', 'Service Charge'];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const res = await apiFetch('/api/transactions');
      setTransactions(res.transactions || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
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

  const getMeta = (type: string, amount: number) => {
    switch (type) {
      case 'deposit': return { icon: FaArrowDown, color: 'bg-emerald-50 text-emerald-600', label: 'Deposit' };
      case 'withdrawal': return { icon: FaArrowUp, color: 'bg-rose-50 text-rose-600', label: 'Withdrawal' };
      case 'purchase': return { icon: FaWallet, color: 'bg-cmblue-50 text-cmblue-700', label: 'Service Charge' };
      case 'referral': return { icon: FaUsers, color: 'bg-amber-50 text-amber-600', label: 'Team Reward' };
      case 'transfer': return { icon: FaExchangeAlt, color: 'bg-sky-50 text-cmblue-700', label: 'Transfer' };
      default: return { icon: amount >= 0 ? FaBolt : FaReceipt, color: amount >= 0 ? 'bg-cmblue-50 text-cmblue-600' : 'bg-rose-50 text-rose-600', label: 'Mining Reward' };
    }
  };

  const normalized = transactions.map((tx: any) => {
    const amount = Number(tx.amount || 0);
    const meta = getMeta(tx.type, amount);
    return { ...tx, amount, ...meta };
  });

  const visible = activeFilter === 'All' ? normalized : normalized.filter((tx) => tx.label === activeFilter);

  return (
    <div className="mc-page">
      <section className="mc-page-header">
        <div>
          <p className="text-[10px] font-bold uppercase text-cmblue-600">Transactions</p>
          <h1 className="mc-title">Transaction History</h1>
          <p className="mc-subtitle">Deposits, withdrawals, transfers, rewards, and service charges.</p>
        </div>
        <div className="rounded-2xl bg-cmblue-50 px-4 py-2 text-sm font-extrabold text-cmblue-700 ring-1 ring-cmblue-100">
          {visible.length} records
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold ${
              activeFilter === filter
                ? 'bg-cmblue-500 text-white shadow-[0_10px_24px_rgba(0,130,255,0.22)]'
                : 'border border-sky-100 bg-white/80 text-slate-500 hover:bg-cmblue-50 hover:text-cmblue-700'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <section className="mc-card">
        {visible.length > 0 ? (
          <div className="space-y-2">
            {visible.map((tx: any) => {
              const Icon = tx.icon;
              return (
                <div key={tx.id} className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
                  <div className="flex items-center gap-3">
                    <span className={`mc-stat-icon ${tx.color}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-950">{tx.label}</p>
                      <p className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleString()}</p>
                      {tx.txHash && <p className="mt-0.5 text-[9px] text-slate-500">Hash: {tx.txHash.slice(0, 12)}...</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-extrabold ${tx.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.amount >= 0 ? '+' : ''}{tx.amount.toFixed(2)} {tx.currency}
                    </p>
                    <span className={`mc-status ${
                      tx.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                      tx.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <FaExchangeAlt className="mx-auto h-10 w-10 text-cmblue-200" />
            <p className="mt-3 text-sm font-semibold text-slate-500">No transactions found</p>
          </div>
        )}
      </section>
    </div>
  );
}
