'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/auth';
import { toastEmitter } from './NotificationToast';
import { FaSpinner, FaTimes } from 'react-icons/fa';
import { 
  isValidSolanaAddress, 
  isValidMomoNumber, 
  isValidBankAccountNumber,
  isValidEthereumAddress,
  isValidBnbAddress 
} from '@/lib/payoutValidation';

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
  isDefault?: boolean;
}

interface PayoutMethodFormProps {
  initialData?: PayoutMethod;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function PayoutMethodForm({ initialData, onSubmit, onCancel }: PayoutMethodFormProps) {
  const [type, setType] = useState<'crypto' | 'solana' | 'momo' | 'bank'>(initialData?.type || 'solana');
  const [name, setName] = useState(initialData?.name || '');
  const [network, setNetwork] = useState(initialData?.network || 'ethereum');
  const [address, setAddress] = useState(initialData?.address || '');
  const [solanaAddress, setSolanaAddress] = useState(initialData?.solanaAddress || '');
  const [momoNumber, setMomoNumber] = useState(initialData?.momoNumber || '');
  const [momoName, setMomoName] = useState(initialData?.momoName || '');
  const [bankName, setBankName] = useState(initialData?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(initialData?.accountNumber || '');
  const [accountHolder, setAccountHolder] = useState(initialData?.accountHolder || '');
  const [isDefault, setIsDefault] = useState(initialData?.isDefault || false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required';

    if (type === 'solana') {
      if (!solanaAddress.trim()) newErrors.solanaAddress = 'Solana address is required';
      else if (!isValidSolanaAddress(solanaAddress)) newErrors.solanaAddress = 'Invalid Solana address';
    }

    if (type === 'crypto') {
      if (!address.trim()) newErrors.address = 'Wallet address is required';
      else if (network === 'ethereum' && !isValidEthereumAddress(address)) newErrors.address = 'Invalid Ethereum address';
      else if (network === 'bnb' && !isValidBnbAddress(address)) newErrors.address = 'Invalid BNB Chain address';
    }

    if (type === 'momo') {
      if (!momoNumber.trim()) newErrors.momoNumber = 'MoMo number is required';
      else if (!isValidMomoNumber(momoNumber)) newErrors.momoNumber = 'Invalid phone number format';
      if (!momoName.trim()) newErrors.momoName = 'Account holder name is required';
    }

    if (type === 'bank') {
      if (!bankName.trim()) newErrors.bankName = 'Bank name is required';
      if (!accountNumber.trim()) newErrors.accountNumber = 'Account number is required';
      else if (!isValidBankAccountNumber(accountNumber)) newErrors.accountNumber = 'Invalid account number';
      if (!accountHolder.trim()) newErrors.accountHolder = 'Account holder name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toastEmitter.error('Please fix the errors above');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        type,
        name,
        network: type === 'crypto' ? network : undefined,
        address: type === 'crypto' ? address : undefined,
        solanaAddress: type === 'solana' ? solanaAddress : undefined,
        momoNumber: type === 'momo' ? momoNumber : undefined,
        momoName: type === 'momo' ? momoName : undefined,
        bankName: type === 'bank' ? bankName : undefined,
        accountNumber: type === 'bank' ? accountNumber : undefined,
        accountHolder: type === 'bank' ? accountHolder : undefined,
        isDefault,
      };

      if (initialData?.id) {
        // Edit existing
        await apiFetch(`/api/payout-methods/${initialData.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toastEmitter.success('Payout method updated');
      } else {
        // Create new
        await apiFetch('/api/payout-methods', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toastEmitter.success('Payout method created');
      }

      onSubmit();
    } catch (err: any) {
      toastEmitter.error(err.message || 'Failed to save payout method');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Method Type */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-3">Payout Method Type</label>
        <div className="grid grid-cols-2 gap-3">
          {(['solana', 'crypto', 'momo', 'bank'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setType(t);
                setErrors({});
              }}
              className={`px-4 py-3 rounded-lg font-semibold transition ${
                type === t
                  ? 'bg-cmblue-600 text-white shadow-lg'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t === 'solana' && '🪙 Solana'}
              {t === 'crypto' && '💰 Crypto'}
              {t === 'momo' && '📱 MoMo'}
              {t === 'bank' && '🏦 Bank'}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-semibold text-slate-900 mb-2">Method Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., My Solana Wallet"
          className={`w-full px-4 py-3 rounded-lg border-2 transition focus:outline-none ${
            errors.name ? 'border-red-500 focus:border-red-600' : 'border-cmblue-200 focus:border-cmblue-500'
          }`}
        />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
      </div>

      {/* Solana Address */}
      {type === 'solana' && (
        <div>
          <label className="block text-sm font-semibold text-slate-900 mb-2">Solana Wallet Address</label>
          <input
            type="text"
            value={solanaAddress}
            onChange={(e) => setSolanaAddress(e.target.value)}
            placeholder="Paste your Solana wallet address (44 characters)"
            className={`w-full px-4 py-3 rounded-lg border-2 transition focus:outline-none ${
              errors.solanaAddress ? 'border-red-500 focus:border-red-600' : 'border-cmblue-200 focus:border-cmblue-500'
            }`}
          />
          {errors.solanaAddress && <p className="text-red-600 text-sm mt-1">{errors.solanaAddress}</p>}
          <p className="text-slate-500 text-xs mt-2">Solana addresses are 44 characters long and start with letters or numbers.</p>
        </div>
      )}

      {/* Crypto Address */}
      {type === 'crypto' && (
        <>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">Network</label>
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-cmblue-200 focus:border-cmblue-500 focus:outline-none transition"
            >
              <option value="ethereum">Ethereum (ETH)</option>
              <option value="bnb">BNB Chain (BSC)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Wallet Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={`Paste your ${network === 'ethereum' ? 'Ethereum' : 'BNB'} wallet address`}
              className={`w-full px-4 py-3 rounded-lg border-2 transition focus:outline-none ${
                errors.address ? 'border-red-500 focus:border-red-600' : 'border-cmblue-200 focus:border-cmblue-500'
              }`}
            />
            {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
            <p className="text-slate-500 text-xs mt-2">{network === 'ethereum' ? 'Ethereum' : 'BNB Chain'} addresses start with 0x and are 42 characters.</p>
          </div>
        </>
      )}

      {/* MoMo */}
      {type === 'momo' && (
        <>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">MoMo Number</label>
            <input
              type="tel"
              value={momoNumber}
              onChange={(e) => setMomoNumber(e.target.value)}
              placeholder="e.g., +234 801 234 5678"
              className={`w-full px-4 py-3 rounded-lg border-2 transition focus:outline-none ${
                errors.momoNumber ? 'border-red-500 focus:border-red-600' : 'border-cmblue-200 focus:border-cmblue-500'
              }`}
            />
            {errors.momoNumber && <p className="text-red-600 text-sm mt-1">{errors.momoNumber}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Account Holder Name</label>
            <input
              type="text"
              value={momoName}
              onChange={(e) => setMomoName(e.target.value)}
              placeholder="Full name on MoMo account"
              className={`w-full px-4 py-3 rounded-lg border-2 transition focus:outline-none ${
                errors.momoName ? 'border-red-500 focus:border-red-600' : 'border-cmblue-200 focus:border-cmblue-500'
              }`}
            />
            {errors.momoName && <p className="text-red-600 text-sm mt-1">{errors.momoName}</p>}
          </div>
        </>
      )}

      {/* Bank Account */}
      {type === 'bank' && (
        <>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Bank Name</label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g., First Bank Nigeria"
              className={`w-full px-4 py-3 rounded-lg border-2 transition focus:outline-none ${
                errors.bankName ? 'border-red-500 focus:border-red-600' : 'border-cmblue-200 focus:border-cmblue-500'
              }`}
            />
            {errors.bankName && <p className="text-red-600 text-sm mt-1">{errors.bankName}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Account Holder Name</label>
            <input
              type="text"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              placeholder="Full name on bank account"
              className={`w-full px-4 py-3 rounded-lg border-2 transition focus:outline-none ${
                errors.accountHolder ? 'border-red-500 focus:border-red-600' : 'border-cmblue-200 focus:border-cmblue-500'
              }`}
            />
            {errors.accountHolder && <p className="text-red-600 text-sm mt-1">{errors.accountHolder}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Bank account number"
              className={`w-full px-4 py-3 rounded-lg border-2 transition focus:outline-none ${
                errors.accountNumber ? 'border-red-500 focus:border-red-600' : 'border-cmblue-200 focus:border-cmblue-500'
              }`}
            />
            {errors.accountNumber && <p className="text-red-600 text-sm mt-1">{errors.accountNumber}</p>}
          </div>
        </>
      )}

      {/* Set as Default */}
      <div className="flex items-center gap-3 p-3 bg-slate-100 rounded-lg">
        <input
          type="checkbox"
          id="isDefault"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="w-4 h-4 accent-cmblue-600"
        />
        <label htmlFor="isDefault" className="font-semibold text-slate-900 cursor-pointer">
          Set as default withdrawal method
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-cmblue-600 hover:bg-cmblue-700 disabled:bg-slate-300 text-white font-semibold rounded-lg transition"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" /> Saving...
            </>
          ) : (
            initialData ? 'Update Method' : 'Add Method'
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-200 text-slate-900 font-semibold rounded-lg transition"
        >
          <FaTimes /> Cancel
        </button>
      </div>
    </form>
  );
}
