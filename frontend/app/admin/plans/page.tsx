'use client';

import { useEffect, useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaBolt, FaClock, FaWallet, FaUsers } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';
import { toastEmitter } from '@/components/NotificationToast';

export default function AdminPlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    hashRate: '',
    dailyRate: '',
    durationDays: '',
    bonusReward: '',
    referralBonus: '',
    maxPurchasesPerUser: '',
    chain: 'ethereum',
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await apiFetch('/api/admin/plans');
      setPlans(res.plans || []);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!form.name?.trim() || !form.price || !form.hashRate || !form.dailyRate || !form.durationDays) {
        toastEmitter.error('Validation Error', 'Please fill in all required fields');
        return;
      }

      if (editing) {
        await apiFetch(`/api/admin/plans/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(form),
        });
        toastEmitter.success('Plan Updated', `Plan \"${form.name}\" has been updated successfully`);
      } else {
        await apiFetch('/api/admin/plans', {
          method: 'POST',
          body: JSON.stringify(form),
        });
        toastEmitter.success('Plan Created', `New plan \"${form.name}\" has been created`);
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', description: '', price: '', hashRate: '', dailyRate: '', durationDays: '', bonusReward: '', referralBonus: '', maxPurchasesPerUser: '', chain: 'ethereum' });
      loadPlans();
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to save plan';
      toastEmitter.error('Save Failed', errorMsg);
      console.error('Failed to save plan:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this plan?')) return;
    try {
      const plan = plans.find(p => p.id === id);
      const response = await apiFetch(`/api/admin/plans/${id}`, { method: 'DELETE' });
      
      if (response.softDeleted) {
        toastEmitter.success(
          'Plan Deactivated',
          `Plan \"${plan?.name}\" has active users. It has been deactivated instead of deleted.`
        );
      } else if (response.deleted) {
        toastEmitter.success(
          'Plan Deleted',
          `Plan \"${plan?.name}\" has been permanently deleted.`
        );
      }
      
      loadPlans();
    } catch (err: any) {
      toastEmitter.error('Delete Failed', err.message || 'Failed to delete plan');
      console.error('Failed to delete plan:', err);
    }
  };

  const startEdit = (plan: any) => {
    setEditing(plan);
    setForm({
      name: plan.name,
      description: plan.description || '',
      price: String(plan.price),
      hashRate: String(plan.hashRate),
      dailyRate: String(plan.dailyRate),
      durationDays: String(plan.durationDays),
      bonusReward: String(plan.bonusReward || 0),
      referralBonus: String(plan.referralBonus || 0),
      maxPurchasesPerUser: plan.maxPurchasesPerUser != null ? String(plan.maxPurchasesPerUser) : '',
      chain: plan.chain,
    });
    setShowForm(true);
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
          <p className="text-[10px] font-bold uppercase text-cmblue-600">Mining Center</p>
          <h1 className="mc-title">Mining Plans</h1>
          <p className="mc-subtitle">Configure hashrate, duration, daily earnings, and plan rewards.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(!showForm); }}
          className="mc-button"
        >
          <FaPlus className="h-3.5 w-3.5" />
          New Plan
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <section className="mc-card flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Current Hashrate</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-950">
              {plans.reduce((sum, plan) => sum + Number(plan.hashRate || 0), 0).toFixed(2)}
            </p>
            <p className="text-sm font-semibold text-cmblue-600">TH/s configured</p>
            <p className="mt-3 text-xs text-slate-500">{plans.filter((plan) => plan.active).length} active plans powering mining offers.</p>
          </div>
          <div className="grid h-28 w-28 shrink-0 place-items-center rounded-full bg-[conic-gradient(#008cff_72%,#e3f3ff_0)]">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-white shadow-inner">
              <FaBolt className="h-7 w-7 text-cmblue-500" />
            </div>
          </div>
        </section>

        <section className="mc-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-950">Mining Performance</h2>
              <p className="text-xs text-slate-500">Plan hashrate distribution</p>
            </div>
            <span className="mc-status bg-cmblue-50 text-cmblue-700">Live</span>
          </div>
          <div className="flex h-28 items-end gap-2">
            {plans.slice(0, 8).map((plan) => {
              const height = Math.max(18, Math.min(100, Number(plan.hashRate || 0) * 8));
              return (
                <div key={plan.id} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-t-xl bg-gradient-to-t from-cmblue-500 to-sky-300" style={{ height: `${height}%` }} />
                  <span className="max-w-16 truncate text-[9px] font-semibold text-slate-400">{plan.name}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="mc-card">
          <h2 className="text-base font-bold text-slate-950">{editing ? 'Edit Plan' : 'Create Plan'}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Plan Name"
              className="mc-input"
            />
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description"
              className="mc-input"
            />
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Price (USDT)"
              className="mc-input"
            />
            <input
              type="number"
              value={form.hashRate}
              onChange={(e) => setForm({ ...form, hashRate: e.target.value })}
              placeholder="Hash Rate (TH/s)"
              className="mc-input"
            />
            <input
              type="number"
              value={form.dailyRate}
              onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
              placeholder="Daily Rate (%)"
              className="mc-input"
            />
            <input
              type="number"
              value={form.durationDays}
              onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
              placeholder="Duration (Days)"
              className="mc-input"
            />
            <input
              type="number"
              value={form.bonusReward}
              onChange={(e) => setForm({ ...form, bonusReward: e.target.value })}
              placeholder="Bonus Reward"
              className="mc-input"
            />
            <input
              type="number"
              value={form.referralBonus}
              onChange={(e) => setForm({ ...form, referralBonus: e.target.value })}
              placeholder="Referral Bonus (%)"
              className="mc-input"
            />
            <input
              type="number"
              min="1"
              value={form.maxPurchasesPerUser}
              onChange={(e) => setForm({ ...form, maxPurchasesPerUser: e.target.value })}
              placeholder="Max Purchases Per User (blank = unlimited)"
              title="Maximum number of times ONE user can buy this plan. Leave blank or 0 for unlimited."
              className="mc-input"
            />
            <select
              value={form.chain}
              onChange={(e) => setForm({ ...form, chain: e.target.value })}
              className="mc-input"
            >
              <option value="ethereum">Ethereum</option>
              <option value="solana">Solana</option>
              <option value="bnb">BNB Smart Chain</option>
            </select>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSubmit}
              className="mc-button"
            >
              {editing ? 'Update Plan' : 'Create Plan'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="mc-button-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Plans List */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <div key={plan.id} className="mc-card">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-extrabold text-slate-950">{plan.name}</h3>
              <span className={`mc-status ${plan.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                {plan.active ? 'Active' : 'Paused'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{plan.description}</p>
            <p className="mt-4 text-3xl font-extrabold text-slate-950">${Number(plan.price).toFixed(2)}</p>
            <div className="mt-4 space-y-2 text-xs font-semibold text-slate-500">
              <p className="flex items-center gap-2 rounded-xl bg-cmblue-50 p-2"><FaBolt className="h-3 w-3 text-cmblue-600" /> {plan.hashRate} TH/s</p>
              <p className="flex items-center gap-2 rounded-xl bg-sky-50 p-2"><FaClock className="h-3 w-3 text-cmblue-600" /> {plan.durationDays} days</p>
              <p className="flex items-center gap-2 rounded-xl bg-emerald-50 p-2"><FaWallet className="h-3 w-3 text-emerald-600" /> {(Number(plan.dailyRate) * 100).toFixed(1)}% daily</p>
              <p className="flex items-center gap-2 rounded-xl bg-purple-50 p-2"><FaUsers className="h-3 w-3 text-purple-600" /> {Number(plan.maxPurchasesPerUser || 0) > 0 ? `Max ${plan.maxPurchasesPerUser} purchase${Number(plan.maxPurchasesPerUser) === 1 ? '' : 's'} per user` : 'Unlimited purchases per user'}</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => startEdit(plan)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-cmblue-50 px-3 py-2 text-[10px] font-bold text-cmblue-700 hover:bg-cmblue-100"
              >
                <FaEdit className="h-3 w-3" /> Edit
              </button>
              <button
                onClick={() => handleDelete(plan.id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-[10px] font-bold text-rose-600 hover:bg-rose-100"
              >
                <FaTrash className="h-3 w-3" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
