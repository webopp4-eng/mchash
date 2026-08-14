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
    <div className="mc-page">
      {/* Header */}
      <section className="mc-page-header">
        <div>
          <p className="text-[10px] font-bold uppercase text-cmblue-600">Settings</p>
          <h1 className="mc-title">Account Settings</h1>
          <p className="mc-subtitle">Manage your preferences and security</p>
        </div>
        <span className="mc-status bg-emerald-50 text-emerald-600">Active Account</span>
      </section>

      {savedMessage && (
        <div className="flex items-center gap-2 rounded-[22px] border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-emerald-600 backdrop-blur-xl">
          <FaCheck className="h-4 w-4" />
          {savedMessage}
        </div>
      )}

      {/* Notifications Settings */}
      <section className="mc-card">
        <div className="mb-4 flex items-center gap-3">
          <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600">
            <FaBell className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-bold text-slate-950">Notifications</h2>
            <p className="text-xs text-slate-500">Control what alerts you receive</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
            <div className="flex items-center gap-3">
              <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600">
                <FaBolt className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-950">Mining Updates</p>
                <p className="text-[10px] text-slate-500">Mining progress and rewards</p>
              </div>
            </div>
            <Switch checked={notifications.miningUpdates} onChange={() => handleToggle('miningUpdates')} />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
            <div className="flex items-center gap-3">
              <span className="mc-stat-icon bg-emerald-50 text-emerald-600">
                <FaCheck className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-950">Deposit Alerts</p>
                <p className="text-[10px] text-slate-500">When deposits are confirmed</p>
              </div>
            </div>
            <Switch checked={notifications.depositAlerts} onChange={() => handleToggle('depositAlerts')} />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
            <div className="flex items-center gap-3">
              <span className="mc-stat-icon bg-rose-50 text-rose-600">
                <FaUnlockAlt className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-950">Withdrawal Alerts</p>
                <p className="text-[10px] text-slate-500">When withdrawals are processed</p>
              </div>
            </div>
            <Switch checked={notifications.withdrawalAlerts} onChange={() => handleToggle('withdrawalAlerts')} />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
            <div className="flex items-center gap-3">
              <span className="mc-stat-icon bg-amber-50 text-amber-600">
                <FaEnvelope className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-950">Marketing Emails</p>
                <p className="text-[10px] text-slate-500">Promotional offers and updates</p>
              </div>
            </div>
            <Switch checked={notifications.marketingEmails} onChange={() => handleToggle('marketingEmails')} />
          </div>
        </div>
      </section>

      {/* Security Settings */}
      <section className="mc-card">
        <div className="mb-4 flex items-center gap-3">
          <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600">
            <FaShieldAlt className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-bold text-slate-950">Security</h2>
            <p className="text-xs text-slate-500">Protect your account</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
            <div className="flex items-center gap-3">
              <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600">
                <FaLock className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-950">Two-Factor Auth</p>
                <p className="text-[10px] text-slate-500">Extra security layer for your account</p>
              </div>
            </div>
            <Switch checked={twoFactor} onChange={() => setTwoFactor(!twoFactor)} />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
            <div className="flex items-center gap-3">
              <span className="mc-stat-icon bg-emerald-50 text-emerald-600">
                <FaMobileAlt className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-950">Device Alerts</p>
                <p className="text-[10px] text-slate-500">Notifications on new logins</p>
              </div>
            </div>
            <Switch checked={deviceAlerts} onChange={() => setDeviceAlerts(!deviceAlerts)} />
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
            <div className="flex items-center gap-3">
              <span className="mc-stat-icon bg-rose-50 text-rose-600">
                <FaExclamationTriangle className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-slate-950">Login Alerts</p>
                <p className="text-[10px] text-slate-500">Suspicious login attempts</p>
              </div>
            </div>
            <Switch checked={loginAlerts} onChange={() => setLoginAlerts(!loginAlerts)} />
          </div>
        </div>
      </section>

      {/* Password Recovery / Reset */}
      <section className="mc-card">
        <div className="mb-4 flex items-center gap-3">
          <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600">
            <FaUnlockAlt className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-bold text-slate-950">Password & Recovery</h2>
            <p className="text-xs text-slate-500">Manage account recovery and password</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
            <p className="text-xs font-bold text-slate-950">Recovery Email</p>
            <p className="mt-0.5 text-[10px] text-slate-500">Used to recover your account</p>
            <div className="mt-2.5 flex gap-2">
              <input
                type="email"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                className="mc-input flex-1"
              />
              <button
                onClick={() => {
                  setSavedMessage('Recovery email updated');
                  setTimeout(() => setSavedMessage(null), 2000);
                }}
                className="mc-button shrink-0 px-3"
              >
                Save
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-950">Change Password</p>
                <p className="text-[10px] text-slate-500">Update your account password</p>
              </div>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="mc-button-secondary shrink-0 px-3 py-2"
              >
                {showPasswordForm ? 'Cancel' : 'Change'}
              </button>
            </div>

            {showPasswordForm && (
              <div className="mt-3 space-y-2">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mc-input"
                  placeholder="Current password"
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mc-input"
                  placeholder="New password (min 8 characters)"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mc-input"
                  placeholder="Confirm new password"
                />
                {passwordMessage && (
                  <p className={`text-xs font-bold ${passwordMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {passwordMessage.text}
                  </p>
                )}
                <button
                  onClick={handlePasswordChange}
                  className="mc-button w-full"
                >
                  Update Password
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}