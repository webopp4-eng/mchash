import { v4 as uuid } from 'uuid';
import prisma from './prisma';

/**
 * Legal document version registry — single source of truth for the versions of
 * the Terms & Conditions, Privacy Policy and Risk Disclosure enforced by the
 * backend and displayed on the legal pages.
 *
 * IMPORTANT: when a legal document is materially updated:
 *   1. Update the document page in the frontend (app/terms, app/privacy-policy,
 *      app/risk-disclosure).
 *   2. Bump the version here (e.g. '1.0' -> '1.1' for minor, '2.0' for material).
 *   3. Update LEGAL_LAST_UPDATED to the publication date.
 *
 * Users with older accepted versions will automatically be required to review
 * and accept the updated documents by the re-acceptance gate (see
 * GET /api/legal/status and POST /api/legal/accept). Historical acceptance
 * records are NEVER overwritten — every acceptance is appended to the
 * LegalAcceptance audit table.
 */
export const LEGAL_DOCUMENT_TYPES = {
  TERMS: 'TERMS',
  PRIVACY_POLICY: 'PRIVACY_POLICY',
  RISK_DISCLOSURE: 'RISK_DISCLOSURE',
} as const;

export type LegalDocumentType = keyof typeof LEGAL_DOCUMENT_TYPES;

export const LEGAL_DOCUMENT_LIST: LegalDocumentType[] = [
  'TERMS',
  'PRIVACY_POLICY',
  'RISK_DISCLOSURE',
];

export const LEGAL_VERSIONS: Record<LegalDocumentType, string> = {
  TERMS: '1.0',
  PRIVACY_POLICY: '1.0',
  RISK_DISCLOSURE: '1.0',
};

// Publication date of the current legal document versions (shown on every
// legal page as "Last Updated" and stored with every acceptance record).
export const LEGAL_LAST_UPDATED = '2026-08-28';

// Exact message returned when registration is attempted without acceptance.
export const LEGAL_ACCEPTANCE_ERROR_MESSAGE =
  'Please confirm that you have read and agree to the Terms & Conditions, Privacy Policy, and Risk Disclosure before creating an account.';

// Jurisdiction is configurable by the platform administrator and is NOT
// hard-coded. Set the LEGAL_JURISDICTION environment variable once the
// governing law has been legally confirmed. Until then the placeholder
// "[JURISDICTION]" is displayed on the Terms page.
export function getJurisdiction(): string {
  return process.env.LEGAL_JURISDICTION?.trim() || '[JURISDICTION]';
}

// Whether legacy users (registered before acceptance records existed, i.e.
// users with no acceptance records at all) are treated as grandfathered.
// Set REQUIRE_LEGAL_ACCEPTANCE_FOR_LEGACY_USERS=true to force every legacy
// user to accept the current versions before continuing to use the platform.
function isLegacyUserGrandfathered(): boolean {
  return process.env.REQUIRE_LEGAL_ACCEPTANCE_FOR_LEGACY_USERS !== 'true';
}

/**
 * Record acceptance of ALL current legal document versions for a user.
 * Appends new audit rows (never updates existing ones) including the IP
 * address and user agent where legally appropriate and technically available.
 */
export async function recordLegalAcceptances(
  userId: string,
  ipAddress: string | null,
  userAgent: string | null
): Promise<void> {
  await prisma.legalAcceptance.createMany({
    data: LEGAL_DOCUMENT_LIST.map((documentType) => ({
      id: uuid(),
      userId,
      documentType,
      documentVersion: LEGAL_VERSIONS[documentType],
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    })),
  });
}

/**
 * Record acceptance of a single document type at a specific version
 * (used by the re-acceptance flow).
 */
export async function recordLegalAcceptance(
  userId: string,
  documentType: LegalDocumentType,
  documentVersion: string,
  ipAddress: string | null,
  userAgent: string | null
): Promise<void> {
  await prisma.legalAcceptance.create({
    data: {
      id: uuid(),
      userId,
      documentType,
      documentVersion,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    },
  });
}

/**
 * Determine which current legal documents the user has not accepted at the
 * latest version. Used to power the re-acceptance gate.
 *
 * - Users whose latest accepted version is older than the current version are
 *   considered non-compliant for that document.
 * - Legacy users with no acceptance records at all are grandfathered unless
 *   REQUIRE_LEGAL_ACCEPTANCE_FOR_LEGACY_USERS=true.
 */
export async function getMissingAcceptances(userId: string): Promise<LegalDocumentType[]> {
  const latestByType = await prisma.legalAcceptance.groupBy({
    by: ['documentType'],
    where: { userId },
    _max: { acceptedAt: true },
  });

  const acceptedTypes = new Set(latestByType.map((row) => row.documentType));
  const grandfathered = isLegacyUserGrandfathered();

  // Check version currency for every document the user has ever accepted.
  const missing: LegalDocumentType[] = [];
  for (const documentType of LEGAL_DOCUMENT_LIST) {
    if (!acceptedTypes.has(documentType)) {
      // No record at all — legacy user unless legacy enforcement is on.
      if (grandfathered) continue;
      missing.push(documentType);
      continue;
    }

    // The user has accepted this document before — they are only compliant
    // if they have accepted the CURRENT version at some point.
    const currentVersionAccepted = await prisma.legalAcceptance.findFirst({
      where: { userId, documentType, documentVersion: LEGAL_VERSIONS[documentType] },
      select: { id: true },
    });
    if (!currentVersionAccepted) {
      missing.push(documentType);
    }
  }

  return missing;
}

export async function isLegalCompliant(userId: string): Promise<boolean> {
  const missing = await getMissingAcceptances(userId);
  return missing.length === 0;
}
