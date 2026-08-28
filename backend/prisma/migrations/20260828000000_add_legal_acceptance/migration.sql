-- Migration: Legal document acceptance audit system
-- Adds an append-only audit table recording every acceptance of the
-- Terms & Conditions, Privacy Policy and Risk Disclosure (with version,
-- timestamp, IP address and user agent where legally appropriate).
-- Safe / idempotent: uses CREATE TABLE IF NOT EXISTS and CREATE INDEX IF NOT EXISTS.
-- Preserves all existing production data.

-- ============ LEGAL ACCEPTANCE AUDIT TABLE ============
CREATE TABLE IF NOT EXISTS "LegalAcceptance" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentVersion" TEXT NOT NULL,
    "acceptedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "LegalAcceptance_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LegalAcceptance_userId_idx" ON "LegalAcceptance"("userId");
CREATE INDEX IF NOT EXISTS "LegalAcceptance_documentType_idx" ON "LegalAcceptance"("documentType");
CREATE INDEX IF NOT EXISTS "LegalAcceptance_documentVersion_idx" ON "LegalAcceptance"("documentVersion");
CREATE INDEX IF NOT EXISTS "LegalAcceptance_userId_documentType_idx" ON "LegalAcceptance"("userId", "documentType");
CREATE INDEX IF NOT EXISTS "LegalAcceptance_userId_documentType_documentVersion_idx" ON "LegalAcceptance"("userId", "documentType", "documentVersion");
CREATE INDEX IF NOT EXISTS "LegalAcceptance_userId_acceptedAt_desc_idx" ON "LegalAcceptance"("userId", "acceptedAt" DESC);

-- Foreign key with cascade (matches existing audit-style tables)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'LegalAcceptance_userId_fkey'
    ) THEN
        ALTER TABLE "LegalAcceptance"
            ADD CONSTRAINT "LegalAcceptance_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;