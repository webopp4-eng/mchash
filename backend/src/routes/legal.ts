import { Router, Request } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, loadUser, AuthRequest } from '../middleware/auth';
import {
  LEGAL_DOCUMENT_LIST,
  LEGAL_DOCUMENT_TYPES,
  LegalDocumentType,
  LEGAL_LAST_UPDATED,
  LEGAL_VERSIONS,
  getJurisdiction,
  getMissingAcceptances,
  recordLegalAcceptance,
} from '../lib/legal';

const router = Router();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return (req as any).ip || 'unknown';
}

function isValidDocumentType(value: unknown): value is LegalDocumentType {
  return (
    typeof value === 'string' &&
    (LEGAL_DOCUMENT_LIST as string[]).includes(value)
  );
}

/**
 * Public endpoint — current legal document versions.
 * Used by the legal pages to display the "Last Updated" version date and by
 * the registration forms to know exactly which versions are being accepted.
 * Accessible without logging in.
 */
router.get('/current', (_req, res) => {
  res.json({
    versions: LEGAL_VERSIONS,
    lastUpdated: LEGAL_LAST_UPDATED,
    jurisdiction: getJurisdiction(),
    supportEmail: process.env.SUPPORT_CONTACT_EMAIL || 'support@mchash.site',
    documents: LEGAL_DOCUMENT_LIST.map((documentType) => ({
      type: documentType,
      version: LEGAL_VERSIONS[documentType],
    })),
  });
});

/**
 * Authenticated endpoint — compliance status of the signed-in user.
 * Returns the list of current legal documents the user has not yet accepted
 * at the latest version. Used by the frontend re-acceptance gate.
 */
router.get('/status', authenticateToken, loadUser, async (req: AuthRequest, res) => {
  try {
    const missing = await getMissingAcceptances(req.user!.id);
    res.json({
      compliant: missing.length === 0,
      missing,
      versions: LEGAL_VERSIONS,
      lastUpdated: LEGAL_LAST_UPDATED,
    });
  } catch (error) {
    console.error('Legal status error:', error);
    res.status(500).json({ error: 'Failed to check legal acceptance status' });
  }
});

/**
 * Authenticated endpoint — record acceptance of the current legal document
 * versions (used by the re-acceptance gate when documents are materially
 * updated). Acceptance records are append-only for audit purposes.
 */
router.post('/accept', authenticateToken, loadUser, async (req: AuthRequest, res) => {
  try {
    const requested: unknown = req.body?.documents;

    // Default: accept all current documents that are missing.
    let toAccept: LegalDocumentType[] = await getMissingAcceptances(req.user!.id);

    if (Array.isArray(requested)) {
      // Only valid document types at the CURRENT version are accepted —
      // the server decides the version, never the client.
      const validTypes = requested.filter(isValidDocumentType) as LegalDocumentType[];
      if (validTypes.length !== requested.length) {
        return res.status(400).json({ error: 'Invalid document type' });
      }
      toAccept = validTypes;
    }

    if (toAccept.length === 0) {
      return res.status(400).json({ error: 'No pending legal documents to accept' });
    }

    for (const documentType of toAccept) {
      await recordLegalAcceptance(
        req.user!.id,
        documentType,
        LEGAL_VERSIONS[documentType],
        getClientIp(req),
        req.headers['user-agent'] || null
      );
    }

    const missing = await getMissingAcceptances(req.user!.id);
    res.json({
      accepted: toAccept.map((documentType) => ({
        documentType,
        documentVersion: LEGAL_VERSIONS[documentType],
      })),
      compliant: missing.length === 0,
      missing,
    });
  } catch (error) {
    console.error('Legal acceptance error:', error);
    res.status(500).json({ error: 'Failed to record legal acceptance' });
  }
});

/**
 * Authenticated endpoint — acceptance history for the signed-in user
 * (transparency: lets users see exactly which versions they accepted and when).
 */
router.get('/history', authenticateToken, loadUser, async (req: AuthRequest, res) => {
  try {
    const records = await prisma.legalAcceptance.findMany({
      where: { userId: req.user!.id },
      orderBy: { acceptedAt: 'desc' },
      select: {
        id: true,
        documentType: true,
        documentVersion: true,
        acceptedAt: true,
      },
    });
    res.json({ records });
  } catch (error) {
    console.error('Legal history error:', error);
    res.status(500).json({ error: 'Failed to load acceptance history' });
  }
});

export default router;
