'use client';

import { useEffect, useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaBolt, FaClock, FaWallet } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';

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
      if (editing) {
        await apiFetch(`/api/admin/plans/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch('/api/admin/plans', {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', description: '', price: '', hashRate: '', dailyRate: '', durationDays: '', bonusReward: '', referralBonus: '', chain: 'ethereum' });
      loadPlans();
    } catch (err) {
      console.error('Failed to save plan:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this plan?')) return;
    try {
      await apiFetch(`/api/admin/plans/${id}`, { method: 'DELETE' });
      loadPlans();
    } catch (err) {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mining Plans</h1>
          <p className="mt-1 text-sm text-slate-400">Manage mining plan configurations</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(!showForm); }}
          className="flex items-center gap-2 rounded-xl bg-cmblue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cmblue-500"
        >
          <FaPlus className="h-3.5 w-3.5" />
          New Plan
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <h2 className="text-sm font-semibold text-cmblue-300">{editing ? 'Edit Plan' : 'Create Plan'}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Plan Name"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cmblue-500/50"
            />
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cmblue-500/50"
            />
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Price (USDT)"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cmblue-500/50"
            />
            <input
              type="number"
              value={form.hashRate}
              onChange={(e) => setForm({ ...form, hashRate: e.target.value })}
              placeholder="Hash Rate (TH/s)"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cmblue-500/50"
            />
            <input
              type="number"
              value={form.dailyRate}
              onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
              placeholder="Daily Rate (%)"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cmblue-500/50"
            />
            <input
              type="number"
              value={form.durationDays}
              onChange={(e) => setForm({ ...form, durationDays: e.target.value })}
              placeholder="Duration (Days)"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cmblue-500/50"
            />
            <input
              type="number"
              value={form.bonusReward}
              onChange={(e) => setForm({ ...form, bonusReward: e.target.value })}
              placeholder="Bonus Reward"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cmblue-500/50"
            />
            <input
              type="number"
              value={form.referralBonus}
              onChange={(e) => setForm({ ...form, referralBonus: e.target.value })}
              placeholder="Referral Bonus (%)"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cmblue-500/50"
            />
            <select
              value={form.chain}
              onChange={(e) => setForm({ ...form, chain: e.target.value })}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-cmblue-500/50"
            >
              <option value="ethereum">Ethereum</option>
              <option value="solana">Solana</option>
              <option value="bnb">BNB Smart Chain</option>
            </select>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={handleSubmit}
              className="rounded-xl bg-cmblue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cmblue-500"
            >
              {editing ? 'Update Plan' : 'Create Plan'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Plans List */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <span className={`text-[10px] font-medium ${plan.active ? 'text-emerald-400' : 'text-slate-500'}`}>
                {plan.active ? 'Active' : 'Paused'}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{plan.description}</p>
            <p className="mt-3 text-2xl font-bold">${Number(plan.price).toFixed(2)}</p>
            <div className="mt-3 space-y-1.5 text-xs text-slate-400">
              <p className="flex items-center gap-2"><FaBolt className="h-3 w-3 text-cmblue-400" /> {plan.hashRate} TH/s</p>
              <p className="flex items-center gap-2"><FaClock className="h-3 w-3 text-cmblue-400" /> {plan.durationDays} days</p>
              <p className="flex items-center gap-2"><FaWallet className="h-3 w-3 text-cmblue-400" /> {(Number(plan.dailyRate) * 100).toFixed(1)}% daily</p>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => startEdit(plan)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-cmblue-500/20 px-3 py-1.5 text-[10px] font-semibold text-cmblue-400 hover:bg-cmblue-500/30"
              >
                <FaEdit className="h-3 w-3" /> Edit
              </button>
              <button
                onClick={() => handleDelete(plan.id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-500/20 px-3 py-1.5 text-[10px] font-semibold text-rose-400 hover:bg-rose-500/30"
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