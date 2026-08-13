'use client';

import { useEffect, useState } from 'react';
import { FaArrowDown, FaArrowUp, FaBolt, FaWallet, FaUsers, FaExchangeAlt } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getIcon = (type: string) => {
    switch (type) {
      case 'deposit': return { icon: FaArrowDown, color: 'bg-emerald-50 text-emerald-600' };
      case 'withdrawal': return { icon: FaArrowUp, color: 'bg-rose-50 text-rose-600' };
      case 'purchase': return { icon: FaWallet, color: 'bg-cmblue-50 text-cmblue-600' };
      case 'referral': return { icon: FaUsers, color: 'bg-purple-50 text-purple-600' };
      default: return { icon: FaBolt, color: 'bg-amber-50 text-amber-600' };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
        <p className="mt-1 text-sm text-slate-500">Complete transaction history</p>
      </div>

      <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-card">
        {transactions.length > 0 ? (
          <div className="space-y-2">
            {transactions.map((tx: any) => {
              const { icon: Icon, color } = getIcon(tx.type);
              return (
                <div key={tx.id} className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold capitalize text-slate-900">{tx.type}</p>
                      <p className="text-[10px] text-slate-500">{new Date(tx.createdAt).toLocaleString()}</p>
                      {tx.txHash && (
                        <p className="mt-0.5 text-[9px] text-slate-500">Hash: {tx.txHash.slice(0, 12)}...</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${Number(tx.amount) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {Number(tx.amount) >= 0 ? '+' : ''}{Number(tx.amount).toFixed(2)} {tx.currency}
                    </p>
                    <span className={`text-[10px] font-medium ${
                      tx.status === 'completed' ? 'text-emerald-600' :
                      tx.status === 'pending' ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-10 text-center">
            <FaExchangeAlt className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">No transactions yet</p>
          </div>
        )}
      </div>
    </div>
  );
}