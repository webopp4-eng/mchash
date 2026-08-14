'use client';

import { useEffect, useState } from 'react';
import { FaSearch, FaUsers, FaWallet, FaBolt, FaCoins, FaPlus } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';
import { shortenAddress } from '@/lib/wallet';
import { toastEmitter } from '@/components/NotificationToast';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [creditUser, setCreditUser] = useState<any | null>(null);
  const [creditForm, setCreditForm] = useState({ amount: '', balanceType: 'platformBalance', reason: '' });
  const [creditMessage, setCreditMessage] = useState<string | null>(null);
  const [creditError, setCreditError] = useState<string | null>(null);
  const [submittingCredit, setSubmittingCredit] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await apiFetch('/api/admin/users');
      setUsers(res.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await apiFetch(`/api/admin/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      
      if (res.success) {
        const user = users.find(u => u.id === id);
        const statusLabel = status === 'active' ? 'Activated' : 'Suspended';
        toastEmitter.success('Status Updated', `${user?.username || 'User'} has been ${statusLabel}`);
        loadUsers();
      } else {
        throw new Error(res.error || 'Failed to update user status');
      }
    } catch (err: any) {
      toastEmitter.error('Update Failed', err.message || 'Failed to update user status');
      console.error('Failed to update user:', err);
    }
  };

  const submitCredit = async () => {
    if (!creditUser) return;
    
    const amount = Number(creditForm.amount);
    if (!creditForm.amount || amount <= 0) {
      setCreditError('Enter a valid credit amount.');
      toastEmitter.error('Invalid Amount', 'Please enter a valid credit amount');
      return;
    }

    setSubmittingCredit(true);
    setCreditError(null);
    setCreditMessage(null);

    try {
      const res = await apiFetch(`/api/admin/users/${creditUser.id}/credit`, {
        method: 'POST',
        body: JSON.stringify({
          amount,
          balanceType: creditForm.balanceType,
          reason: creditForm.reason || null,
        }),
      });
      
      if (res.success) {
        const typeLabel = creditForm.balanceType === 'platformBalance' ? 'Platform Balance' : 'Total Earned';
        const message = `Successfully credited ${creditUser.username || 'user'} with $${amount.toFixed(2)} ${typeLabel}.`;
        setCreditMessage(message);
        toastEmitter.success('User Credited', `$${amount.toFixed(2)} added to ${creditUser.username || 'user'}`);
        
        setCreditForm({ amount: '', balanceType: 'platformBalance', reason: '' });
        setTimeout(() => {
          setCreditUser(null);
          setCreditMessage(null);
        }, 1500);
        loadUsers();
      } else {
        throw new Error(res.error || 'Failed to credit user');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to credit user.';
      setCreditError(errorMsg);
      toastEmitter.error('Credit Failed', errorMsg);
    } finally {
      setSubmittingCredit(false);
    }
  };

  const filtered = users.filter((u) =>
    !search || u.walletAddress?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase())
  );

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
          <p className="text-[10px] font-bold uppercase text-cmblue-600">Bubble Team</p>
          <h1 className="mc-title">User Management</h1>
          <p className="mc-subtitle">Manage platform users, balances, and account status.</p>
        </div>
        <div className="rounded-2xl bg-cmblue-50 px-4 py-2 text-sm font-extrabold text-cmblue-700 ring-1 ring-cmblue-100">
          {filtered.length} users
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Team Members', users.length, FaUsers, 'bg-cmblue-50 text-cmblue-600'],
          ['Active Accounts', users.filter((u) => u.status === 'active').length, FaBolt, 'bg-emerald-50 text-emerald-600'],
          ['Wallets Linked', users.filter((u) => u.walletAddress).length, FaWallet, 'bg-sky-50 text-cmblue-700'],
          ['Team Balance', `$${users.reduce((sum, u) => sum + Number(u.platformBalance || 0), 0).toFixed(2)}`, FaWallet, 'bg-amber-50 text-amber-600'],
        ].map(([label, value, Icon, color]: any) => (
          <div key={label} className="mc-card">
            <span className={`mc-stat-icon ${color}`}>
              <Icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-[10px] font-bold uppercase text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-extrabold text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by wallet or username..."
            className="mc-input pl-10"
          />
        </div>
      </div>

      {/* Credit Modal */}
      {creditUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase text-cmblue-600">Admin Credit</p>
                <h2 className="text-xl font-extrabold text-slate-950">Credit {creditUser.username || 'User'}</h2>
                <p className="text-xs text-slate-500">{shortenAddress(creditUser.walletAddress || '', 8)}</p>
              </div>
              <button onClick={() => { setCreditUser(null); setCreditMessage(null); setCreditError(null); }} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">Close</button>
            </div>

            {creditError && <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{creditError}</div>}
            {creditMessage && <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{creditMessage}</div>}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Balance type</label>
                <select
                  value={creditForm.balanceType}
                  onChange={(e) => setCreditForm({ ...creditForm, balanceType: e.target.value })}
                  className="mc-input"
                >
                  <option value="platformBalance">Platform Balance</option>
                  <option value="totalEarned">Total Earned</option>
                  <option value="totalDeposited">Total Deposited</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Amount (USDT)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={creditForm.amount}
                  onChange={(e) => setCreditForm({ ...creditForm, amount: e.target.value })}
                  placeholder="100.00"
                  className="mc-input"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Reason</label>
                <textarea
                  value={creditForm.reason}
                  onChange={(e) => setCreditForm({ ...creditForm, reason: e.target.value })}
                  rows={3}
                  placeholder="Optional reason for credit"
                  className="mc-input resize-none"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => { setCreditUser(null); setCreditMessage(null); setCreditError(null); }} className="mc-button-secondary">Cancel</button>
              <button onClick={submitCredit} disabled={submittingCredit} className="mc-button">
                {submittingCredit ? 'Crediting...' : 'Apply Credit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="mc-table-wrap">
        <table className="mc-table">
          <thead>
            <tr className="mc-table-head">
              <th className="mc-th">User</th>
              <th className="mc-th">Wallet</th>
              <th className="mc-th">Balance</th>
              <th className="mc-th">Status</th>
              <th className="mc-th">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="mc-row">
                <td className="mc-td">
                  <div className="flex items-center gap-2">
                    <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600">
                      <FaUsers className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-950">{user.username}</p>
                      <p className="text-[10px] text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </td>
                <td className="mc-td">
                  <p className="text-xs">{shortenAddress(user.walletAddress, 6)}</p>
                  <p className="text-[10px] capitalize text-slate-500">{user.chain}</p>
                </td>
                <td className="mc-td text-sm font-bold">${Number(user.platformBalance || 0).toFixed(2)}</td>
                <td className="mc-td">
                  <span className={`mc-status ${
                    user.status === 'active' ? 'bg-emerald-50 text-emerald-600' :
                    user.status === 'suspended' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="mc-td">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { setCreditUser(user); setCreditForm({ amount: '', balanceType: 'platformBalance', reason: '' }); setCreditError(null); setCreditMessage(null); }}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600 hover:bg-emerald-100"
                    >
                      <FaCoins className="h-2.5 w-2.5" /> Credit
                    </button>
                    {user.status !== 'active' && (
                      <button
                        onClick={() => updateStatus(user.id, 'active')}
                        className="rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600 hover:bg-emerald-100"
                      >
                        Activate
                      </button>
                    )}
                    {user.status !== 'suspended' && (
                      <button
                        onClick={() => updateStatus(user.id, 'suspended')}
                        className="rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-600 hover:bg-amber-100"
                      >
                        Suspend
                      </button>
                    )}
                    {user.status !== 'banned' && (
                      <button
                        onClick={() => updateStatus(user.id, 'banned')}
                        className="rounded-lg bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-100"
                      >
                        Ban
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">No users found</p>
        )}
      </div>
    </div>
  );
}