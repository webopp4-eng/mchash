/**
 * Shared payment method configuration — single source of truth
 * used by both the User Frontend and the Admin Frontend.
 *
 * Each method has:
 *  - id:    stable machine identifier (kebab-case, used as the `type` in PaymentAccount)
 *  - label:  human-readable display name
 *  - asset:  default currency associated with the method
 */
export const PAYMENT_METHODS = [
  { id: 'bank',        label: 'Bank Transfer',    asset: 'USD'   },
  { id: 'wallet',      label: 'Wallet',            asset: 'USDT'  },
  { id: 'mpesa',       label: 'M-Pesa Money',      asset: 'KES'   },
  { id: 'opd',         label: 'OPD',               asset: 'USD'   },
  { id: 'crypto',      label: 'Crypto Wallet',     asset: 'USDT'  },
  { id: 'card',        label: 'Card',              asset: 'USD'   },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]['id'];

export const PAYMENT_METHOD_MAP: Record<string, string> = {};
PAYMENT_METHODS.forEach((m) => {
  PAYMENT_METHOD_MAP[m.id] = m.label;
});

export const VALID_PAYMENT_METHOD_IDS = PAYMENT_METHODS.map((m) => m.id);

export function getPaymentMethodLabel(id: string): string {
  const found = PAYMENT_METHODS.find((m) => m.id === id);
  return found ? found.label : id;
}

export function isValidPaymentMethod(id: string): boolean {
  return VALID_PAYMENT_METHOD_IDS.includes(id as PaymentMethodId);
}

/**
 * Normalise a legacy / free-text payment method into a canonical id.
 */
export function normalizePaymentMethod(raw: string): PaymentMethodId {
  const lower = String(raw || '').toLowerCase().trim();
  if (lower === 'bank' || lower === 'bank transfer' || lower === 'bank_transfer') return 'bank';
  if (lower === 'wallet') return 'wallet';
  if (lower === 'mpesa' || lower === 'm-pesa' || lower === 'mobile money' || lower === 'momo') return 'mpesa';
  if (lower === 'opd' || lower === 'opay') return 'opd';
  if (lower === 'crypto' || lower === 'crypto wallet' || lower === 'cryptowallet') return 'crypto';
  if (lower === 'card' || lower === 'credit card' || lower === 'debit card') return 'card';
  return 'wallet';
}
