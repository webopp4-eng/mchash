/**
 * TRANSACTION ACTION / AUDIT VISIBILITY (ROLE-BASED ACCESS CONTROL)
 *
 * Single source of truth for who may SEE transaction action and audit data
 * (who approved/rejected a transaction, internal notes, processing times,
 * audit trail). Only the main administrator account (SUPER_ADMIN) has full
 * visibility. EMPLOYEE staff and normal users ("workers") must never receive
 * this data — not in the UI, and critically NOT from the API either, so the
 * restriction holds even if the frontend is bypassed, a URL is hand-crafted,
 * or the network tab is used to call endpoints directly.
 *
 * Employee/worker actions are still RECORDED internally (AuditLog +
 * processedBy* columns) for security and accountability, but only SUPER_ADMIN
 * may read them back.
 */

type AnyRecord = Record<string, any>;

/**
 * True when the given role may see transaction action history, approval
 * attribution, internal notes and audit data. Only the main Admin account
 * (SUPER_ADMIN — plus the legacy 'admin' casing) qualifies.
 */
export function canViewTransactionActions(role: string | null | undefined): boolean {
  const normalized = String(role || '').toUpperCase();
  return normalized === 'SUPER_ADMIN' || normalized === 'ADMIN';
}

/**
 * Strip all transaction action / approval / audit fields from a Deposit
 * record for any viewer who is not the main Admin (employees, workers and
 * normal users). Status itself is kept because it is required for the
 * approval workflow (staff need their pending work queue, users need to know
 * whether their deposit is pending) — but WHO processed it, WHEN, and any
 * internal notes are removed.
 */
export function sanitizeDepositForViewer<T extends AnyRecord>(deposit: T, role: string | null | undefined): T {
  if (!deposit || canViewTransactionActions(role)) return deposit;

  const {
    processedById: _pid,
    processedByName: _pn,
    processedByRole: _pr,
    approvedAt: _aa,
    confirmedAt: _ca,
    ...rest
  } = deposit as AnyRecord;

  // Internal admin/employee review notes are written into `note` once a
  // deposit has been processed — hide them from non-admin viewers. A still
  // pending deposit's `note` is the user's own submission and stays visible.
  if (rest.status && String(rest.status).toLowerCase() !== 'pending') {
    delete rest.note;
  }

  return rest as T;
}

/**
 * Strip all transaction action / approval / audit fields from a Withdrawal
 * record for any viewer who is not the main Admin.
 */
export function sanitizeWithdrawalForViewer<T extends AnyRecord>(withdrawal: T, role: string | null | undefined): T {
  if (!withdrawal || canViewTransactionActions(role)) return withdrawal;

  const {
    adminNote: _an,
    processedById: _pid,
    processedByName: _pn,
    processedByRole: _pr,
    processedAt: _pa,
    ...rest
  } = withdrawal as AnyRecord;

  return rest as T;
}

/** Sanitize an array of deposits for the given viewer role. */
export function sanitizeDepositsForViewer(deposits: AnyRecord[] | null | undefined, role: string | null | undefined): AnyRecord[] {
  return (deposits || []).map((d) => sanitizeDepositForViewer(d, role));
}

/** Sanitize an array of withdrawals for the given viewer role. */
export function sanitizeWithdrawalsForViewer(withdrawals: AnyRecord[] | null | undefined, role: string | null | undefined): AnyRecord[] {
  return (withdrawals || []).map((w) => sanitizeWithdrawalForViewer(w, role));
}
