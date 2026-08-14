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
    <div className="mc-page">
      <div className="mc-page-header">
        <div>
          <p className="text-[10px] font-bold uppercase text-cmblue-600">Settings</p>
          <h1 className="mc-title">Platform Settings</h1>
          <p className="mc-subtitle">Configure platform parameters and operational defaults.</p>
        </div>
        {saved && (
          <span className="mc-status bg-emerald-50 text-emerald-600">
            <FaCheck className="h-3 w-3" /> Saved
          </span>
        )}
      </div>

      <div className="mc-card">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600">
            <FaCogs className="h-3.5 w-3.5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-950">Configuration</h2>
            <p className="text-[10px] text-slate-500">Platform-wide settings</p>
          </div>
        </div>

        <div className="space-y-3">
          {settings.length > 0 ? (
            settings.map((setting) => (
              <div key={setting.key} className="flex flex-col gap-3 rounded-xl border border-sky-100 bg-sky-50/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold capitalize text-slate-950">{setting.key.replace(/_/g, ' ')}</p>
                  <p className="text-[10px] text-slate-500">{setting.key}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    defaultValue={setting.value}
                    onBlur={(e) => updateSetting(setting.key, e.target.value)}
                    className="mc-input w-full sm:w-48"
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
