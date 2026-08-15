'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaArrowLeft, FaPlus, FaEdit, FaTrash, FaCheckCircle, FaWallet, FaMobile, FaMoneyBill, FaCoins } from 'react-icons/fa';
import { apiFetch, getUser, User } from '@/lib/auth';
import { toastEmitter } from '@/components/NotificationToast';
import PayoutMethodForm from '@/components/PayoutMethodForm';

interface PayoutMethod {
  id: string;
  type: 'crypto' | 'solana' | 'momo' | 'bank';
  name: string;
  network?: string;
  address?: string;
  solanaAddress?: string;
  momoNumber?: string;
  momoName?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  isDefault: boolean;
  active: boolean;
  createdAt: string;
}

export default function PayoutMethodsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PayoutMethod | null>(null);

  useEffect(() => {
    setUser(getUser());
    loadPayoutMethods();
  }, []);

  const loadPayoutMethods = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/payout-methods');
      setPayoutMethods(Array.isArray(res.payoutMethods) ? res.payoutMethods : []);
    } catch (err) {
      console.error('Failed to load payout methods:', err);
      toastEmitter.error('Failed to load payout methods');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payout method?')) return;

    try {
      await apiFetch(`/api/payout-methods/${id}`, { method: 'DELETE' });
      setPayoutMethods(payoutMethods.filter(m => m.id !== id));
      toastEmitter.success('Payout method deleted');
    } catch (err: any) {
      toastEmitter.error(err.message || 'Failed to delete payout method');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await apiFetch(`/api/payout-methods/${id}/set-default`, { method: 'PATCH' });
      await loadPayoutMethods();
      toastEmitter.success('Default payout method updated');
    } catch (err: any) {
      toastEmitter.error(err.message || 'Failed to set default');
    }
  };

  const handleFormSubmit = async () => {
    await loadPayoutMethods();
    setShowForm(false);
    setEditingMethod(null);
  };

  const getMethodIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'solana':
        return <FaCoins className="text-purple-500" />;
      case 'crypto':
        return <FaWallet className="text-blue-500" />;
      case 'momo':
        return <FaMobile className="text-green-500" />;
      case 'bank':
        return <FaMoneyBill className="text-gray-600" />;
      default:
        return <FaWallet className="text-slate-400" />;
    }
  };

  const getMaskedInfo = (method: PayoutMethod) => {
    if (method.type === 'solana') {
      return `${method.solanaAddress?.substring(0, 4)}***${method.solanaAddress?.slice(-4)}`;
    }
    if (method.type === 'crypto') {
      return `${method.address?.substring(0, 4)}***${method.address?.slice(-4)}`;
    }
    if (method.type === 'momo') {
      return `${method.momoNumber?.substring(0, 3)}***${method.momoNumber?.slice(-3)}`;
    }
    if (method.type === 'bank') {
      return `${method.bankName} - ***${method.accountNumber?.slice(-4)}`;
    }
    return 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cmblue-50 via-white to-cmblue-50/30">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/profile" className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-cmblue-200 hover:bg-cmblue-50 transition">
            <FaArrowLeft className="text-cmblue-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Payout Methods</h1>
            <p className="text-slate-500 text-sm mt-1">Manage your withdrawal destinations</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Add Method Button */}
          {!showForm && (
            <button
              onClick={() => {
                setEditingMethod(null);
                setShowForm(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-cmblue-600 hover:bg-cmblue-700 text-white font-semibold rounded-2xl transition shadow-blue-glow"
            >
              <FaPlus /> Add Payout Method
            </button>
          )}

          {/* Form */}
          {showForm && (
            <div className="bg-white rounded-2xl border border-cmblue-200 shadow-lg p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {editingMethod ? 'Edit Payout Method' : 'Add New Payout Method'}
              </h2>
              <PayoutMethodForm
                initialData={editingMethod || undefined}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingMethod(null);
                }}
              />
            </div>
          )}

          {/* Methods List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
            </div>
          ) : payoutMethods.length === 0 ? (
            <div className="bg-white rounded-2xl border border-cmblue-200 p-8 text-center">
              <p className="text-slate-500 mb-4">No payout methods configured yet.</p>
              <p className="text-slate-400 text-sm">Add a payout method to start withdrawing funds.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payoutMethods.map((method) => (
                <div
                  key={method.id}
                  className={`bg-white rounded-2xl border-2 transition p-5 ${
                    method.isDefault ? 'border-cmblue-500 shadow-lg shadow-cmblue-200' : 'border-cmblue-200 hover:border-cmblue-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icon */}
                      <div className="text-2xl mt-1">
                        {getMethodIcon(method.type)}
                      </div>

                      {/* Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{method.name}</h3>
                          {method.isDefault && (
                            <span className="flex items-center gap-1 px-2 py-1 bg-cmblue-100 text-cmblue-700 rounded-full text-xs font-semibold">
                              <FaCheckCircle className="w-3 h-3" /> Default
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 text-sm mt-1">
                          {method.type === 'solana' && 'Solana Wallet'}
                          {method.type === 'crypto' && `${method.network?.toUpperCase()} Wallet`}
                          {method.type === 'momo' && 'Mobile Money'}
                          {method.type === 'bank' && 'Bank Account'}
                        </p>
                        <p className="text-slate-600 text-sm font-mono mt-2">{getMaskedInfo(method)}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {!method.isDefault && (
                        <button
                          onClick={() => handleSetDefault(method.id)}
                          className="px-3 py-2 text-sm font-semibold text-cmblue-600 hover:bg-cmblue-100 rounded-lg transition"
                          title="Set as default"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingMethod(method);
                          setShowForm(true);
                        }}
                        className="flex items-center justify-center w-10 h-10 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(method.id)}
                        className="flex items-center justify-center w-10 h-10 text-red-600 hover:bg-red-100 rounded-lg transition"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Wallet Connection Info */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
            <h3 className="font-semibold text-amber-900 mb-2">🔗 Wallet Connection</h3>
            <p className="text-amber-800 text-sm">
              Wallet connection is <strong>coming soon</strong>. For now, configure your payout methods above to withdraw funds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
