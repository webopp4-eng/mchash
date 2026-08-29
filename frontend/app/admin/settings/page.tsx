'use client';

import { useEffect, useState } from 'react';
import { FaCogs, FaCheck, FaUserTie, FaPlus, FaEdit, FaTrash, FaKey, FaToggleOn, FaToggleOff, FaUserShield, FaLock, FaSave, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { apiFetch, getUser } from '@/lib/auth';
import { EMPLOYEE_PAGES } from '@/lib/employeePermissions';

interface Employee {
  id: string;
  email: string;
  fullName: string;
  username: string;
  role: string;
  employeeStatus: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
  pagePermissions?: string[] | null;
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Employee management state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    password: '',
    status: 'active',
  });
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [employeeSuccess, setEmployeeSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [resetPasswordFor, setResetPasswordFor] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // ===== Restrictions tab (employee page-permission management) =====
  const [settingsTab, setSettingsTab] = useState<'general' | 'restrictions'>('general');
  // Employee currently expanded for permission editing.
  const [restrictionsFor, setRestrictionsFor] = useState<Employee | null>(null);
  // Draft permission keys being edited for the expanded employee.
  const [draftPermissions, setDraftPermissions] = useState<string[]>([]);
  const [savingPermissions, setSavingPermissions] = useState(false);

  useEffect(() => {
    const u = getUser();
    setUser(u);
    setIsSuperAdmin(u?.role === 'SUPER_ADMIN');
    loadSettings();
    if (u?.role === 'SUPER_ADMIN') {
      loadEmployees();
    }
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

  const loadEmployees = async () => {
    try {
      const res = await apiFetch('/api/admin/employees');
      setEmployees(res.employees || []);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      await apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ key, value }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to update setting:', err);
    }
  };

  const createEmployee = async () => {
    setSubmitting(true);
    setEmployeeError(null);
    setEmployeeSuccess(null);

    try {
      await apiFetch('/api/admin/employees', {
        method: 'POST',
        body: JSON.stringify(employeeForm),
      });
      setEmployeeSuccess('Employee created successfully!');
      setShowEmployeeForm(false);
      setEmployeeForm({ name: '', email: '', password: '', status: 'active' });
      loadEmployees();
      setTimeout(() => setEmployeeSuccess(null), 5000);
    } catch (err: any) {
      setEmployeeError(err.message || 'Failed to create employee');
    } finally {
      setSubmitting(false);
    }
  };

  const updateEmployeeStatus = async (employee: Employee, newStatus: string) => {
    try {
      await apiFetch(`/api/admin/employees/${employee.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      loadEmployees();
    } catch (err: any) {
      setEmployeeError(err.message || 'Failed to update employee status');
    }
  };

  const deleteEmployee = async (employee: Employee) => {
    if (!confirm(`Revoke employee access for ${employee.fullName}? This cannot be undone.`)) return;
    try {
      await apiFetch(`/api/admin/employees/${employee.id}`, {
        method: 'DELETE',
      });
      loadEmployees();
    } catch (err: any) {
      setEmployeeError(err.message || 'Failed to revoke employee');
    }
  };

  // ===== Restrictions helpers =====

  /** Open/close the expandable permission panel for an employee. */
  const toggleRestrictions = (employee: Employee) => {
    if (restrictionsFor?.id === employee.id) {
      setRestrictionsFor(null);
      return;
    }
    setRestrictionsFor(employee);
    // null (unconfigured) = legacy full access -> preselect all pages.
    setDraftPermissions(employee.pagePermissions ?? EMPLOYEE_PAGES.map((p) => p.key));
  };

  const toggleDraftPage = (key: string) => {
    setDraftPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const grantAllDraftPages = () => setDraftPermissions(EMPLOYEE_PAGES.map((p) => p.key));
  const denyAllDraftPages = () => setDraftPermissions([]);

  const savePermissions = async (employee: Employee) => {
    setSavingPermissions(true);
    try {
      const res = await apiFetch(`/api/admin/employees/${employee.id}/permissions`, {
        method: 'PATCH',
        body: JSON.stringify({ pagePermissions: draftPermissions }),
      });
      const updated = res.employee as Employee;
      setEmployees((prev) => prev.map((e) => (e.id === employee.id ? { ...e, pagePermissions: updated.pagePermissions ?? draftPermissions } : e)));
      setRestrictionsFor(null);
      setEmployeeSuccess(`Permissions saved for ${employee.fullName}`);
      setTimeout(() => setEmployeeSuccess(null), 5000);
    } catch (err: any) {
      setEmployeeError(err.message || 'Failed to save permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  const resetPassword = async () => {
    if (!resetPasswordFor || !newPassword) return;
    try {
      await apiFetch(`/api/admin/employees/${resetPasswordFor.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });
      setEmployeeSuccess(`Password reset for ${resetPasswordFor.fullName}`);
      setResetPasswordFor(null);
      setNewPassword('');
      setTimeout(() => setEmployeeSuccess(null), 5000);
    } catch (err: any) {
      setEmployeeError(err.message || 'Failed to reset password');
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

      {/* Settings section tabs — General / Restrictions */}
      <div className="mb-4 flex gap-1.5 sm:gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSettingsTab('general')}
          className={`shrink-0 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold transition-all ${
            settingsTab === 'general'
              ? 'bg-cmblue-500 text-white shadow-[0_10px_24px_rgba(0,130,255,0.22)]'
              : 'border border-sky-100 bg-white/80 text-slate-500 hover:bg-cmblue-50 hover:text-cmblue-700'
          }`}
        >
          General
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setSettingsTab('restrictions')}
            className={`shrink-0 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold transition-all ${
              settingsTab === 'restrictions'
                ? 'bg-cmblue-500 text-white shadow-[0_10px_24px_rgba(0,130,255,0.22)]'
                : 'border border-sky-100 bg-white/80 text-slate-500 hover:bg-cmblue-50 hover:text-cmblue-700'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <FaUserShield className="h-3 w-3" /> Restrictions
            </span>
          </button>
        )}
      </div>

      {/* Employee Management - SUPER_ADMIN ONLY */}
      {isSuperAdmin && settingsTab === 'general' && (
        <div className="mc-card mb-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600">
                <FaUserTie className="h-3.5 w-3.5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-950">Employees</h2>
                <p className="text-[10px] text-slate-500">Manage employee accounts and access</p>
              </div>
            </div>
            <button
              onClick={() => setShowEmployeeForm(!showEmployeeForm)}
              className="mc-button bg-cmblue-500 hover:bg-cmblue-600"
            >
              <FaPlus className="h-3 w-3" />
              {showEmployeeForm ? 'Cancel' : 'Add Employee'}
            </button>
          </div>

          {employeeError && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-600">
              {employeeError}
            </div>
          )}
          {employeeSuccess && (
            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-600">
              {employeeSuccess}
            </div>
          )}

          {/* Create Employee Form */}
          {showEmployeeForm && (
            <div className="mb-4 rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Full Name</label>
                  <input
                    type="text"
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                    placeholder="John Doe"
                    className="mc-input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Email</label>
                  <input
                    type="email"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                    placeholder="employee@mchash.com"
                    className="mc-input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Password</label>
                  <input
                    type="password"
                    value={employeeForm.password}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="mc-input"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">Status</label>
                  <select
                    value={employeeForm.status}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, status: e.target.value })}
                    className="mc-input"
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
              </div>
              <button
                onClick={createEmployee}
                disabled={submitting || !employeeForm.name || !employeeForm.email || !employeeForm.password}
                className="mc-button mt-3 w-full"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FaPlus className="h-3 w-3" />
                    Create Employee
                  </>
                )}
              </button>
            </div>
          )}

          {/* Employee List */}
          <div className="space-y-2">
            {employees.length > 0 ? (
              employees.map((emp) => (
                <div key={emp.id} className="flex flex-col gap-2 rounded-xl border border-sky-100 bg-sky-50/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-950">{emp.fullName}</p>
                    <p className="text-[10px] text-slate-500">{emp.email} • {emp.username}</p>
                    <p className="text-[10px] text-slate-400">
                      Created: {new Date(emp.createdAt).toLocaleDateString()}
                      {emp.lastLoginAt ? ` • Last login: ${new Date(emp.lastLoginAt).toLocaleString()}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`mc-status ${emp.employeeStatus === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {emp.employeeStatus}
                    </span>
                    <button
                      onClick={() => updateEmployeeStatus(emp, emp.employeeStatus === 'active' ? 'disabled' : 'active')}
                      className="mc-icon-button"
                      title={emp.employeeStatus === 'active' ? 'Disable' : 'Enable'}
                    >
                      {emp.employeeStatus === 'active' ? <FaToggleOn className="h-4 w-4 text-emerald-500" /> : <FaToggleOff className="h-4 w-4 text-slate-400" />}
                    </button>
                    <button
                      onClick={() => setResetPasswordFor(emp)}
                      className="mc-icon-button"
                      title="Reset Password"
                    >
                      <FaKey className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteEmployee(emp)}
                      className="mc-icon-button"
                      title="Revoke Access"
                    >
                      <FaTrash className="h-3.5 w-3.5 text-rose-500" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-slate-500">No employees created yet</p>
            )}
          </div>

          {/* Reset Password Modal */}
          {resetPasswordFor && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                <h3 className="text-base font-bold text-slate-950">Reset Password</h3>
                <p className="mt-1 text-xs text-slate-500">Set a new password for {resetPasswordFor.fullName}</p>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 characters)"
                  className="mc-input mt-4"
                />
                <div className="mt-4 flex gap-2">
                  <button onClick={resetPassword} disabled={!newPassword || newPassword.length < 6} className="mc-button flex-1">
                    Reset Password
                  </button>
                  <button onClick={() => { setResetPasswordFor(null); setNewPassword(''); }} className="mc-button-secondary flex-1">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== Restrictions tab — employee page permissions (SUPER_ADMIN ONLY) ===== */}
      {isSuperAdmin && settingsTab === 'restrictions' && (
        <div className="mc-card mb-6">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="mc-stat-icon bg-cmblue-50 text-cmblue-600">
              <FaUserShield className="h-3.5 w-3.5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-950">Employee Restrictions</h2>
              <p className="text-[10px] text-slate-500">
                Control which dashboard pages each employee can access. Restrictions are enforced on the server.
              </p>
            </div>
          </div>

          {employeeError && (
            <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-600">
              {employeeError}
            </div>
          )}
          {employeeSuccess && (
            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-600">
              {employeeSuccess}
            </div>
          )}

          <div className="space-y-2">
            {employees.length > 0 ? (
              employees.map((emp) => {
                const isExpanded = restrictionsFor?.id === emp.id;
                const configured = emp.pagePermissions !== null && emp.pagePermissions !== undefined;
                const grantedCount = configured ? (emp.pagePermissions as string[]).length : EMPLOYEE_PAGES.length;
                return (
                  <div key={emp.id} className="rounded-xl border border-sky-100 bg-sky-50/50">
                    {/* Employee row — click to expand permission configuration */}
                    <button
                      onClick={() => toggleRestrictions(emp)}
                      className="flex w-full flex-col gap-2 p-3 text-left sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-950">{emp.fullName}</p>
                        <p className="text-[10px] text-slate-500">{emp.email} • {emp.username}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`mc-status ${emp.employeeStatus === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {emp.employeeStatus}
                        </span>
                        <span className={`mc-status ${grantedCount === 0 ? 'bg-rose-50 text-rose-600' : grantedCount === EMPLOYEE_PAGES.length ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {grantedCount === 0 ? 'No pages' : grantedCount === EMPLOYEE_PAGES.length ? 'All pages' : `${grantedCount} page${grantedCount === 1 ? '' : 's'}`}
                        </span>
                        {isExpanded ? <FaChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <FaChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                      </div>
                    </button>

                    {/* Expandable permission configuration */}
                    {isExpanded && (
                      <div className="border-t border-sky-100 p-3">
                        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
                          <FaLock className="h-2.5 w-2.5" /> Page access for {emp.fullName}
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {EMPLOYEE_PAGES.map((page) => {
                            const granted = draftPermissions.includes(page.key);
                            return (
                              <button
                                key={page.key}
                                onClick={() => toggleDraftPage(page.key)}
                                className={`flex items-start justify-between gap-3 rounded-xl border p-3 text-left transition-all ${
                                  granted
                                    ? 'border-emerald-200 bg-emerald-50/70 ring-1 ring-emerald-100'
                                    : 'border-slate-200 bg-white/70'
                                }`}
                              >
                                <div className="min-w-0">
                                  <p className={`text-xs font-bold ${granted ? 'text-emerald-700' : 'text-slate-600'}`}>{page.label}</p>
                                  <p className="mt-0.5 text-[10px] text-slate-500">{page.description}</p>
                                </div>
                                <span className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-extrabold uppercase ${
                                  granted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                                }`}>
                                  {granted ? <FaCheck className="h-2.5 w-2.5" /> : <FaLock className="h-2.5 w-2.5" />}
                                  {granted ? 'Grant' : 'Deny'}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Quick actions + Save */}
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex gap-2">
                            <button
                              onClick={grantAllDraftPages}
                              className="rounded-lg bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-600 transition-all hover:bg-emerald-100"
                            >
                              Grant All
                            </button>
                            <button
                              onClick={denyAllDraftPages}
                              className="rounded-lg bg-rose-50 px-3 py-1.5 text-[10px] font-bold text-rose-600 transition-all hover:bg-rose-100"
                            >
                              Deny All
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setRestrictionsFor(null)}
                              className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 transition-all hover:bg-slate-200"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => savePermissions(emp)}
                              disabled={savingPermissions}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-cmblue-500 px-4 py-2 text-xs font-bold text-white shadow-[0_10px_24px_rgba(0,130,255,0.25)] transition-all hover:bg-cmblue-600 disabled:opacity-60"
                            >
                              <FaCheck className="h-3 w-3" />
                              {savingPermissions ? 'Saving…' : 'Save Changes'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="py-6 text-center text-sm text-slate-500">No employees created yet</p>
            )}
          </div>
        </div>
      )}

      {/* Platform Settings */}
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