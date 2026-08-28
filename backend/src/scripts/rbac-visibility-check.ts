import {
  canViewTransactionActions,
  sanitizeDepositForViewer,
  sanitizeWithdrawalForViewer,
  sanitizeDepositsForViewer,
} from '../services/transactionVisibility';

// --- canViewTransactionActions ---
console.assert(canViewTransactionActions('SUPER_ADMIN') === true, 'admin should see actions');
console.assert(canViewTransactionActions('ADMIN') === true, 'legacy admin should see actions');
console.assert(canViewTransactionActions('EMPLOYEE') === false, 'employee must NOT see actions');
console.assert(canViewTransactionActions('user') === false, 'user must NOT see actions');
console.assert(canViewTransactionActions(null) === false, 'null role must NOT see actions');

// --- deposit sanitization (processed record) ---
const processedDeposit: any = {
  id: 'd1', userId: 'u1', amount: 100, currency: 'USDT', status: 'approved',
  note: 'internal review note', approvedAt: new Date(), confirmedAt: new Date(),
  processedById: 'a1', processedByName: 'Boss', processedByRole: 'SUPER_ADMIN',
};
const empView = sanitizeDepositForViewer({ ...processedDeposit }, 'EMPLOYEE');
console.assert(empView.processedById === undefined && empView.processedByName === undefined && empView.processedByRole === undefined, 'employee deposit view must strip processedBy*');
console.assert(empView.approvedAt === undefined && empView.confirmedAt === undefined, 'employee deposit view must strip approval timestamps');
console.assert(empView.note === undefined, 'employee deposit view must strip internal note on processed deposits');
console.assert(empView.status === 'approved' && empView.amount === 100, 'employee deposit view keeps workflow fields (status/amount)');

const adminView = sanitizeDepositForViewer({ ...processedDeposit }, 'SUPER_ADMIN');
console.assert(adminView.processedByName === 'Boss' && adminView.processedById === 'a1', 'admin deposit view keeps full attribution');

// --- deposit sanitization (pending record: user note must survive) ---
const pendingDeposit: any = { id: 'd2', status: 'pending', note: 'my submission note', processedByName: 'X' };
const userPending = sanitizeDepositForViewer(pendingDeposit, 'user');
console.assert(userPending.note === 'my submission note', 'pending deposit keeps the user own submission note');
console.assert(userPending.processedByName === undefined, 'pending deposit still strips processedBy*');

// --- withdrawal sanitization ---
const withdrawal: any = {
  id: 'w1', amount: 50, status: 'completed', adminNote: 'internal',
  processedById: 'a1', processedByName: 'Boss', processedByRole: 'SUPER_ADMIN', processedAt: new Date(),
};
const empWd = sanitizeWithdrawalForViewer(withdrawal, 'EMPLOYEE');
console.assert(empWd.adminNote === undefined && empWd.processedByName === undefined && empWd.processedAt === undefined, 'employee withdrawal view must strip action fields');
console.assert(empWd.status === 'completed' && empWd.amount === 50, 'employee withdrawal view keeps workflow fields');
console.assert(sanitizeWithdrawalForViewer(withdrawal, 'SUPER_ADMIN').processedByName === 'Boss', 'admin withdrawal view keeps attribution');

// --- arrays ---
console.assert(sanitizeDepositsForViewer([processedDeposit], 'EMPLOYEE').every((d) => d.processedByName === undefined), 'array sanitizer works');

console.log('All transactionVisibility RBAC assertions passed.');
