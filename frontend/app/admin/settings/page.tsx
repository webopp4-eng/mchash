'use client';

import { useEffect, useState } from 'react';
import { FaCogs, FaCheck } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';

export default function AdminSettings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await apiFetch('/api/admin/settings');
      setSettings(res.settings || []);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      await apiFetch('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({ key, value }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to update setting:', err);
    }
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
          <h1 className="text-2xl font-bold">Platform Settings</h1>
          <p className="mt-1 text-sm text-slate-400">Configure platform parameters</p>
        </div>
        {saved && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-semibold text-emerald-400">
            <FaCheck className="h-3 w-3" /> Saved
          </span>
        )}
      </div>

      <div className="rounded-[24px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-cmblue-500/20 text-cmblue-400">
            <FaCogs className="h-3.5 w-3.5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-cmblue-300">Configuration</h2>
            <p className="text-[10px] text-slate-500">Platform-wide settings</p>
          </div>
        </div>

        <div className="space-y-3">
          {settings.length > 0 ? (
            settings.map((setting) => (
              <div key={setting.key} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <div>
                  <p className="text-xs font-semibold capitalize">{setting.key.replace(/_/g, ' ')}</p>
                  <p className="text-[10px] text-slate-500">{setting.key}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    defaultValue={setting.value}
                    onBlur={(e) => updateSetting(setting.key, e.target.value)}
                    className="w-40 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-cmblue-500/50"
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-slate-500">No settings configured</p>
          )}
        </div>
      </div>
    </div>
  );
}