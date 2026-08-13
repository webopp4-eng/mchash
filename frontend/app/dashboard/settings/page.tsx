'use client';

import { useEffect, useState } from 'react';
import { FaBell, FaShieldAlt, FaUserCircle, FaWallet, FaCheck, FaCopy } from 'react-icons/fa';
import { apiFetch, getUser } from '@/lib/auth';
import { shortenAddress } from '@/lib/wallet';
import WalletConnectionPanel from '@/components/WalletConnectionPanel';

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [notifications, setNotifications] = useState({
    miningUpdates: true,
    depositAlerts: true,
    withdrawalAlerts: true,
    marketingEmails: false,
  });
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    setUser(getUser());
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await apiFetch('/api/settings');
      setSettings(res);
      if (res.user?.username) setUsername(res.user.username);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const saveUsername = async () => {
    try {
      await apiFetch('/api/auth/username', {
        method: 'PATCH',
        body: JSON.stringify({ username }),
      });
      setSavedMessage('Username updated successfully');
      setTimeout(() => setSavedMessage(null), 3000);
    } catch (err: any) {
      console.error('Failed to update username:', err);
    }
  };

  const Switch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${
        checked ? 'bg-cmblue-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account preferences</p>
      </div>

      {savedMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
          <FaCheck className="h-3.5 w-3.5" />
          {savedMessage}
        </div>
      )}

      {/* Profile Settings - White */}
      <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-cmblue-50 text-cmblue-600">
            <FaUserCircle className="h-3.5 w-3.5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Profile</h2>
            <p className="text-[10px] text-slate-500">Update your display name</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-600">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-cmblue-400 focus:ring-1 focus:ring-cmblue-200"
            />
          </div>
          <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
            <p className="text-[10px] text-slate-500">Connected Wallet</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{user ? shortenAddress(user.walletAddress, 8) : ''}</p>
            <p className="mt-0.5 text-[10px] capitalize text-slate-500">{user?.walletType || 'Wallet'} • {user?.chain || ''}</p>
          </div>
          <button
            onClick={saveUsername}
            className="rounded-xl bg-cmblue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-cmblue-700"
          >
            Save Profile
          </button>
        </div>
      </div>

      {/* Notification Settings - White */}
      <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-cmblue-50 text-cmblue-600">
            <FaBell className="h-3.5 w-3.5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
            <p className="text-[10px] text-slate-500">Control what you receive</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 p-3">
            <div>
              <p className="text-xs font-semibold text-slate-900">Mining Updates</p>
              <p className="text-[10px] text-slate-500">Get notified about mining progress</p>
            </div>
            <Switch checked={notifications.miningUpdates} onChange={() => setNotifications({ ...notifications, miningUpdates: !notifications.miningUpdates })} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 p-3">
            <div>
              <p className="text-xs font-semibold text-slate-900">Deposit Alerts</p>
              <p className="text-[10px] text-slate-500">Get notified when deposits are confirmed</p>
            </div>
            <Switch checked={notifications.depositAlerts} onChange={() => setNotifications({ ...notifications, depositAlerts: !notifications.depositAlerts })} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 p-3">
            <div>
              <p className="text-xs font-semibold text-slate-900">Withdrawal Alerts</p>
              <p className="text-[10px] text-slate-500">Get notified about withdrawals</p>
            </div>
            <Switch checked={notifications.withdrawalAlerts} onChange={() => setNotifications({ ...notifications, withdrawalAlerts: !notifications.withdrawalAlerts })} />
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 p-3">
            <div>
              <p className="text-xs font-semibold text-slate-900">Marketing Emails</p>
              <p className="text-[10px] text-slate-500">Receive promotional offers</p>
            </div>
            <Switch checked={notifications.marketingEmails} onChange={() => setNotifications({ ...notifications, marketingEmails: !notifications.marketingEmails })} />
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-card">
        <WalletConnectionPanel compact={false} showTitle={true} darkMode={false} />
      </div>

      {/* Security - White */}
      <div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <FaShieldAlt className="h-3.5 w-3.5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Security</h2>
            <p className="text-[10px] text-slate-500">Your account is protected by blockchain authentication</p>
          </div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2">
            <FaWallet className="h-4 w-4 text-emerald-600" />
            <p className="text-xs font-semibold text-emerald-800">Wallet Signature Authentication</p>
          </div>
          <p className="mt-1 text-[10px] text-emerald-700/70">
            All authentication is done through your connected wallet. No passwords or emails required.
          </p>
        </div>
      </div>
    </div>
  );
}