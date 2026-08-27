'use client';

import { useEffect, useState, useCallback } from 'react';
import { FaClipboardList, FaSearch, FaShieldAlt, FaUserTie } from 'react-icons/fa';
import { apiFetch } from '@/lib/auth';

interface ActionEntry {
  id: string;
  userId: string | null;
  actorRole: string | null;
  actorName: string | null;
  actorUsername: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: any;
  createdAt: string;
  User?: { username?: string; fullName?: string } | null;
}

// Human-readable description + human role label per audit action.
function describeAction(e: ActionEntry): string {
  const actor = e.actorName || e.actorUsername || e.User?.fullName || e.User?.username || 'Staff';
  const roleLabel = e.actorRole ? (e.actorRole.toUpperCase() === 'SUPER_ADMIN' || e.actorRole.toUpperCase() === 'ADMIN' ? 'Admin' : e.actorRole.toUpperCase() === 'EMPLOYEE' ? 'Employee' : 'User') : 'User';
  const d = e.details || {};
  const amount = d.amount != null ? `$${Number(d.amount).toFixed(2)}` : null;
  const who = d.username || d.employeeName || 'a user';

  const A = e.action || '';
  const label = A.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  // Friendly, concrete descriptions for the most important actions.
  if (A.startsWith('DEPOSIT_APPROVE')) return `${actor} (${roleLabel}) approved a deposit for ${who}${amount ? ` (${amount})` : ''}.`;
  if (A.startsWith('DEPOSIT_REJECT')) return `${actor} (${roleLabel}) rejected a deposit for ${who}${amount ? ` (${amount})` : ''}.`;
  if (A.startsWith('WITHDRAWAL_APPROVE')) return `${actor} (${roleLabel}) approved a withdrawal for ${who}${amount ? ` (${amount})` : ''}.`;
  if (A.startsWith('WITHDRAWAL_REJECT')) return `${actor} (${roleLabel}) rejected a withdrawal for ${who}${amount ? ` (${amount})` : ''}.`;
  if (A.startsWith('WITHDRAWAL_COMPLETE')) return `${actor} (${roleLabel}) completed a withdrawal for ${who}${amount ? ` (${amount})` : ''}.`;
  if (A === 'ADMIN_CREDIT') return `${actor} (${roleLabel}) credited ${amount || ''} to ${who}.`;
  if (A === 'ADMIN_DEBIT') return `${actor} (${roleLabel}) debited ${amount || ''} from ${who}.`;
  if (A.startsWith('USER_STATUS_CHANGE')) return `${actor} (${roleLabel}) changed account status to ${d.status || '?'} for ${who} (was ${d.previousStatus || '?'}).`;
  if (A === 'USER_PASSWORD_RESET') return `${actor} (${roleLabel}) reset the password for ${who}.`;
  if (A === 'ADMIN_BALANCE_RESET') return `${actor} (${roleLabel}) reset an admin balance to 0.00 (administrative correction).`;
  if (A.startsWith('SUPPORT_ADMIN_RESPONSE')) return `${actor} (${roleLabel}) replied to a support ticket.`;
  if (A.startsWith('SUPPORT_TICKET_STATUS')) return `${actor} (${roleLabel}) changed a support ticket status to ${d.newStatus || '?'}.`;
  if (A.startsWith('EMPLOYEE_')) return `${actor} (${roleLabel}) ${label.toLowerCase()} on an employee account.`;
  return `${actor} (${roleLabel}) performed: ${label}.`;
}

export default function AdminActions() {
  const [logs, setLogs] = useState<ActionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const loadLogs = useCallback(async (role?: string) => {
    try {
      const q = role && role !== 'all' ? `?role=${role}` : '';
      const res = await apiFetch(`/api/admin/audit-logs${q}`);
      setLogs(res.logs || []);
    } catch (err) {
      console.error('Failed to load action log:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (filter === 'all' || filter === 'transaction' || filter === 'user' || filter === 'support') {
      loadLogs();
    } else {
      loadLogs(filter === 'admin' ? 'admin' : 'employee');
    }
  }, [filter, loadLogs]);

  const filteredByCategory = (logs: ActionEntry[]) => {
    switch (filter) {
      case 'transaction': return logs.filter((l) => { const t=(l.targetType||'').toLowerCase(); const a=(l.action||'').toUpperCase(); return t==='deposit'||t==='withdrawal'||a.includes('DEPOSIT')||a.includes('WITHDRAWAL'); });
      case 'user': return logs.filter((l) => { const t=(l.targetType||'').toLowerCase(); const a=(l.action||'').toUpperCase(); return t==='user'||a.includes('USER_STATUS')||a.includes('ADMIN_CREDIT')||a.includes('ADMIN_DEBIT')||a.includes('PASSWORD_RESET')||a.includes('BAN'); });
      case 'support': return logs.filter((l) => { const t=(l.targetType||'').toLowerCase(); const a=(l.action||'').toUpperCase(); return t==='support_ticket'||a.includes('SUPPORT'); });
      default: return logs;
    }
  };

  const searchable = (l: ActionEntry) => `${l.actorName||''} ${l.actorUsername||''} ${l.action||''} ${l.targetType||''}`.toLowerCase();
  const base = search.trim() ? logs.filter((l) => searchable(l).includes(search.toLowerCase())) : logs;
  const filtered = filteredByCategory(base);

  const formatTime = (dateStr: string) => new Date(dateStr).toLocaleString();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cmblue-500/30 border-t-cmblue-500" />
      </div>
    );
  }

  const filters = [
    { key: 'all', label: 'All Actions' },
    { key: 'admin', label: 'Admin Actions' },
    { key: 'employee', label: 'Employee Actions' },
    { key: 'transaction', label: 'Transaction Actions' },
    { key: 'user', label: 'User Management' },
    { key: 'support', label: 'Support Actions' },
  ];

  return (
    <div className="mc-page">
      <div className="mc-page-header">
        <div>
          <p className="text-[10px] font-bold uppercase text-cmblue-600">Actions</p>
          <h1 className="mc-title">Activity &amp; Audit Log</h1>
          <p className="mc-subtitle max-w-2xl">Every important action performed by admins and employees across the platform — newest first.</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-cmblue-50 px-3 py-2 text-xs font-bold text-cmblue-700 ring-1 ring-cmblue-100">
          <FaShieldAlt className="h-3.5 w-3.5" /> {logs.length} actions
        </div>
      </div>

      <div className="mc-card mb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${filter === f.key ? 'bg-cmblue-500 text-white' : 'bg-sky-50/50 text-slate-600 hover:bg-sky-100'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search actor or action..." className="mc-input pl-9 w-full md:w-64" />
          </div>
        </div>
      </div>

      <div className="mc-card">
        {filtered.length > 0 ? (
          <ul className="divide-y divide-sky-50">
            {filtered.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 p-4">
                <span className={`mc-stat-icon mt-0.5 ${(entry.actorRole || '').toUpperCase() === 'EMPLOYEE' ? 'bg-amber-50 text-amber-600' : 'bg-cmblue-50 text-cmblue-600'}`}>
                  {(entry.actorRole || '').toUpperCase() === 'EMPLOYEE' ? <FaUserTie className="h-3.5 w-3.5" /> : <FaShieldAlt className="h-3.5 w-3.5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{describeAction(entry)}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {formatTime(entry.createdAt)}
                    {entry.actorUsername ? ` · @${entry.actorUsername}` : ''}
                    {entry.action ? ` · ${entry.action}` : ''}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-10 text-center text-sm text-slate-500">No actions recorded yet.</p>
        )}
      </div>
    </div>
  );
}
