'use client';

import { useState } from 'react';
import { FaBell, FaBolt, FaCheck, FaEnvelope, FaExclamationTriangle, FaLock, FaMobileAlt, FaShieldAlt, FaUnlockAlt } from 'react-icons/fa';

export default function SettingsPage() {
  // Notification settings
  const [notifications, setNotifications] = useState({
    miningUpdates: true,
    depositAlerts: true,
    withdrawalAlerts: true,
    marketingEmails: false,
  });

  // Security settings
  const [twoFactor, setTwoFactor] = useState(false);
  const [deviceAlerts, setDeviceAlerts] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);

  // Password recovery
  const [recoveryEmail, setRecoveryEmail] = useState('msa@monistar.com');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // General feedback
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    setSavedMessage('Settings saved');
    setTimeout(() => setSavedMessage(null), 2000);
  };

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Please fill in all password fields.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setPasswordMessage({ type: 'success', text: 'Password updated successfully. Recovery email sent.' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordForm(false);
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
    <div className="min-h-screen px-4 pb-28 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <section className="glass-card mb-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Settings</p>
              <h1 className="mt-0.5 text-base font-semibold text-slate-900">CM HASH Settings</h1>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/70 px-3 py-1.5 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Account</p>
              <p className="mt-0.5 text-xs font-semibold text-emerald-700">Active</p>
            </div>
          </div>
        </section>

        {savedMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-[18px] border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700 shadow-sm">
            <FaCheck className="h-3.5 w-3.5" />
            {savedMessage}
          </div>
        )}

        {/* Notifications Settings */}
        <section className="glass-card mb-4 p-4">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-cmblue-50 text-cmblue-600">
              <FaBell className="h-3.5 w-3.5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Notifications</h2>
              <p className="text-[10px] text-slate-500">Control what you receive</p>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-cmblue-50 text-cmblue-600">
                  <FaBolt className="h-3 w-3" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Mining Updates</p>
                  <p className="text-[10px] text-slate-500">Get notified about your mining progress</p>
                </div>
              </div>
              <Switch checked={notifications.miningUpdates} onChange={() => handleToggle('miningUpdates')} />
            </div>

            <div className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FaCheck className="h-3 w-3" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Deposit Alerts</p>
                  <p className="text-[10px] text-slate-500">Get notified when a deposit is confirmed</p>
                </div>
              </div>
              <Switch checked={notifications.depositAlerts} onChange={() => handleToggle('depositAlerts')} />
            </div>

            <div className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <FaUnlockAlt className="h-3 w-3" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Withdrawal Alerts</p>
                  <p className="text-[10px] text-slate-500">Get notified when a withdrawal is processed</p>
                </div>
              </div>
              <Switch checked={notifications.withdrawalAlerts} onChange={() => handleToggle('withdrawalAlerts')} />
            </div>

            <div className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <FaEnvelope className="h-3 w-3" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Marketing Emails</p>
                  <p className="text-[10px] text-slate-500">Receive promotional offers and news</p>
                </div>
              </div>
              <Switch checked={notifications.marketingEmails} onChange={() => handleToggle('marketingEmails')} />
            </div>
          </div>
        </section>

        {/* Security Settings */}
        <section className="glass-card mb-4 p-4">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-cmblue-50 text-cmblue-600">
              <FaShieldAlt className="h-3.5 w-3.5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Security</h2>
              <p className="text-[10px] text-slate-500">Protect your account</p>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-cmblue-50 text-cmblue-600">
                  <FaLock className="h-3 w-3" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Two-Factor Authentication</p>
                  <p className="text-[10px] text-slate-500">Add an extra layer of security to your account</p>
                </div>
              </div>
              <Switch checked={twoFactor} onChange={() => setTwoFactor(!twoFactor)} />
            </div>

            <div className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <FaMobileAlt className="h-3 w-3" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Device Alerts</p>
                  <p className="text-[10px] text-slate-500">Get notified on new device logins</p>
                </div>
              </div>
              <Switch checked={deviceAlerts} onChange={() => setDeviceAlerts(!deviceAlerts)} />
            </div>

            <div className="flex items-center justify-between rounded-[18px] border border-slate-200 bg-slate-50 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <FaExclamationTriangle className="h-3 w-3" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Login Alerts</p>
                  <p className="text-[10px] text-slate-500">Email me about suspicious login attempts</p>
                </div>
              </div>
              <Switch checked={loginAlerts} onChange={() => setLoginAlerts(!loginAlerts)} />
            </div>
          </div>
        </section>

        {/* Password Recovery / Reset */}
        <section className="glass-card mb-4 p-4">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-cmblue-50 text-cmblue-600">
              <FaUnlockAlt className="h-3.5 w-3.5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Password Recovery & Reset</h2>
              <p className="text-[10px] text-slate-500">Manage your recovery email and password</p>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
              <p className="text-xs font-semibold text-slate-900">Recovery Email</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Used to recover your account if you forget your password</p>
              <div className="mt-2 flex gap-2">
                <input
                  type="email"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-cmblue-400 focus:ring-1 focus:ring-cmblue-200"
                  placeholder="Enter recovery email"
                />
                <button
                  onClick={() => {
                    setSavedMessage('Recovery email updated');
                    setTimeout(() => setSavedMessage(null), 2000);
                  }}
                  className="shrink-0 rounded-xl bg-cmblue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cmblue-700"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-3 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-900">Change Password</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">Update your account password</p>
                </div>
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="shrink-0 rounded-xl bg-cmblue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cmblue-700"
                >
                  {showPasswordForm ? 'Cancel' : 'Change Password'}
                </button>
              </div>

              {showPasswordForm && (
                <div className="mt-3 space-y-2">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-cmblue-400 focus:ring-1 focus:ring-cmblue-200"
                    placeholder="Current password"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-cmblue-400 focus:ring-1 focus:ring-cmblue-200"
                    placeholder="New password (min 8 characters)"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none transition focus:border-cmblue-400 focus:ring-1 focus:ring-cmblue-200"
                    placeholder="Confirm new password"
                  />
                  {passwordMessage && (
                    <p className={`text-[10px] font-semibold ${passwordMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {passwordMessage.text}
                    </p>
                  )}
                  <button
                    onClick={handlePasswordChange}
                    className="w-full rounded-xl bg-cmblue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-cmblue-700"
                  >
                    Update Password
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}