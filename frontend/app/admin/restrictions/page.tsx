'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  FaChevronDown,
  FaChevronRight,
  FaLock,
  FaSave,
  FaSearch,
  FaShieldAlt,
  FaUserTie,
} from 'react-icons/fa';
import { apiFetch, getUser } from '@/lib/auth';
import { EMPLOYEE_PAGES } from '@/lib/employeePermissions';

interface EmployeeRecord {
  id: string;
  username: string | null;
  fullName: string | null;
  email: string | null;
  employeeStatus: string | null;
  pagePermissions: string[] | null;
}

interface PageDef {
  key: string;
  label: string;
  description: string;
  path: string;
}

export default function AdminRestrictions() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [pages, setPages] = useState<PageDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<string[]>([]);
  const [configured, setConfigured] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  const load = useCallback(async () => {
    try {
      // GET /api/admin/employees returns every employee incl. pagePermissions
      // (SUPER_ADMIN-gated). The page catalog comes from the shared registry.
      const res = await apiFetch('/api/admin/employees');
      setEmployees(res.employees || []);
      setPages(
        (res.pages as PageDef[] | undefined) ||
          EMPLOYEE_PAGES.map((p) => ({ key: p.key, label: p.label, description: p.description, path: p.path }))
      );
    } catch (err: any) {
      console.error('Failed to load restrictions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    try {
      if (getUser()?.role !== 'SUPER_ADMIN') {
        setDenied(true);
        setLoading(false);
        return;
      }
    } catch {
      setDenied(true);
      setLoading(false);
      return;
    }
    load();
  }, [load]);

  const toggleExpanded = (employee: EmployeeRecord) => {
    if (expandedId === employee.id) {
      setExpandedId(null);
      return;
    }
    // null = never configured (legacy full access) -> start the editor from ALL pages granted
    const current = Array.isArray(employee.pagePermissions) ? employee.pagePermissions : null;
    setConfigured(current !== null);
    setDraft(current ?? pages.map((p) => p.key));
    setExpandedId(employee.id);
  };

  const togglePage = (key: string) => {
    setConfigured(true);
    setDraft((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  if (!isMounted || loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
      </div>
    );
  }

  if (denied) {
    return (
      <div className="mc-page">
        <div className="mc-card mx-auto max-w-md text-center">
          <span className="mc-stat-icon mx-auto bg-rose-50 text-rose-600">
            <FaLock className="h-5 w-5" />
          </span>
          <h1 className="mt-4 text-lg font-extrabold text-slate-950">Super admin access required</h1>
          <p className="mt-2 text-sm text-slate-500">Employees and other staff cannot access this page.</p>
        </div>
      </div>
    );
  }
  const visible = employees.filter((e) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [e.username, e.fullName, e.email].some((v) => String(v || '').toLowerCase().includes(q));
  });

  const grantedCount = (e: EmployeeRecord) =>
    Array.isArray(e.pagePermissions) ? e.pagePermissions.length : null;

  return (
    <div className="mc-page">
      <div className="mc-page-header">
        <div>
          <p className="text-[10px] font-bold uppercase text-cmblue-600">System</p>
          <h1 className="mc-title">Restrictions</h1>
          <p className="mc-subtitle max-w-2xl">
            Control which dashboard pages each employee can access. Changes are saved to the database and enforced on the server.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-cmblue-50 px-3 py-2 text-xs font-bold text-cmblue-700 ring-1 ring-cmblue-100">
          <FaShieldAlt className="h-3.5 w-3.5" /> {employees.length} employees
        </div>
      </div>

      <div className="mc-card mb-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees..."
            className="mc-input w-full pl-9"
          />
        </div>
      </div>

      <div className="space-y-3">
        {visible.length === 0 && (
          <div className="mc-card py-10 text-center text-sm text-slate-500">No employee accounts found.</div>
        )}

        {visible.map((employee) => {
          const isOpen = expandedId === employee.id;
          const count = grantedCount(employee);
          return (
            <div key={employee.id} className="mc-card overflow-hidden p-0">
              <button
                onClick={() => toggleExpanded(employee)}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-sky-50/50"
              >
                <span className="mc-stat-icon bg-amber-50 text-amber-600">
                  <FaUserTie className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {employee.fullName || employee.username || employee.email || 'Employee'}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    @{employee.username || '—'}
                    {employee.email ? ` · ${employee.email}` : ''}
                    {employee.employeeStatus ? ` · ${employee.employeeStatus}` : ''}
                  </p>
                </div>
                <span
                  className={`hidden shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold sm:inline-flex ${
                    count === null
                      ? 'bg-emerald-50 text-emerald-600'
                      : count === 0
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-cmblue-50 text-cmblue-700'
                  }`}
                >
                  {count === null ? 'Full access' : count === 0 ? 'No pages' : `${count} page${count === 1 ? '' : 's'}`}
                </span>
                {isOpen ? (
                  <FaChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                ) : (
                  <FaChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                )}
              </button>

              {/* Expandable per-page permission editor */}
              {isOpen && (
                <div className="border-t border-sky-100 bg-sky-50/30 p-4">
                  <p className="mb-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    <FaLock className="h-2.5 w-2.5" /> Page access for {employee.fullName || employee.username || 'employee'}
                  </p>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {pages.map((page) => {
                      const granted = draft.includes(page.key);
                      return (
                        <button
                          key={page.key}
                          onClick={() => togglePage(page.key)}
                          className={`flex items-start justify-between gap-3 rounded-xl border p-3 text-left transition-all ${
                            granted
                              ? 'border-emerald-200 bg-emerald-50/70 ring-1 ring-emerald-100'
                              : 'border-slate-200 bg-white/80 hover:border-slate-300'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className={`text-xs font-bold ${granted ? 'text-emerald-700' : 'text-slate-600'}`}>{page.label}</p>
                            <p className="mt-0.5 text-[10px] text-slate-500">{page.description}</p>
                          </div>
                          <span
                            className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-extrabold uppercase ${
                              granted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                            }`}
                          >
                            {granted ? 'Grant' : 'Deny'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {pages.length === 0 && (
                    <p className="py-3 text-center text-xs text-slate-500">No manageable pages registered.</p>
                  )}

                  {/* Quick actions + persistence */}
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setConfigured(true); setDraft(pages.map((p) => p.key)); }}
                        className="rounded-lg bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-600 transition-all hover:bg-emerald-100"
                      >
                        Grant All
                      </button>
                      <button
                        onClick={() => { setConfigured(true); setDraft([]); }}
                        className="rounded-lg bg-rose-50 px-3 py-1.5 text-[10px] font-bold text-rose-600 transition-all hover:bg-rose-100"
                      >
                        Deny All
                      </button>
                    </div>
                    <button
                      onClick={async () => {
                        setSavingId(employee.id);
                        try {
                          const res = await apiFetch(`/api/admin/employees/${employee.id}/permissions`, {
                            method: 'PATCH',
                            body: JSON.stringify({ pagePermissions: draft }),
                          });
                          const updated = res.employee as EmployeeRecord;
                          setEmployees((prev) =>
                            prev.map((e) => (e.id === employee.id ? { ...e, pagePermissions: updated.pagePermissions ?? draft } : e))
                          );
                          setExpandedId(null);
                        } catch (err: any) {
                          console.error('Failed to save restrictions:', err);
                        } finally {
                          setSavingId(null);
                        }
                      }}
                      disabled={savingId === employee.id}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-cmblue-500 px-4 py-2 text-xs font-bold text-white shadow-[0_10px_24px_rgba(0,130,255,0.25)] transition-all hover:bg-cmblue-600 disabled:opacity-60"
                    >
                      <FaSave className="h-3 w-3" />
                      {savingId === employee.id ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

