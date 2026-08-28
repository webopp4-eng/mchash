/**
 * Legal document version constants — frontend counterpart of
 * backend/src/lib/legal.ts. The version + "Last Updated" date displayed on
 * every legal page comes from here; when a document is materially updated,
 * bump the version and the date in BOTH this file and the backend registry.
 */
export const LEGAL_VERSIONS = {
  TERMS: '1.0',
  PRIVACY_POLICY: '1.0',
  RISK_DISCLOSURE: '1.0',
} as const;

export const LEGAL_LAST_UPDATED = '2026-08-28';

// Exact message shown when a user attempts to register without accepting.
export const LEGAL_ACCEPTANCE_ERROR_MESSAGE =
  'Please confirm that you have read and agree to the Terms & Conditions, Privacy Policy, and Risk Disclosure before creating an account.';

export const LEGAL_LINKS = {
  terms: '/terms',
  privacy: '/privacy-policy',
  risk: '/risk-disclosure',
} as const;

// Governing law is configurable by the platform administrator via the
// NEXT_PUBLIC_LEGAL_JURISDICTION environment variable. Until legally
// confirmed, the "[JURISDICTION]" placeholder is displayed.
export function getJurisdictionDisplay(): string {
  return process.env.NEXT_PUBLIC_LEGAL_JURISDICTION?.trim() || '[JURISDICTION]';
}

export function getSupportEmail(): string {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || 'support@mchash.site';
}
