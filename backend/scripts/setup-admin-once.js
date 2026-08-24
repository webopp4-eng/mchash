/**
 * setup-admin-once.js
 *
 * Secure, idempotent FIRST-ADMIN bootstrap for a fresh database.
 *
 * SECURITY
 *  - No email, password, or password hash is ever hard-coded in this file.
 *  - Every credential is read from environment variables (see backend/.env.example).
 *  - The password is hashed with bcrypt (10 salt rounds) using EXACTLY the
 *    same algorithm the application's emailAuth.hashPassword() uses, so the
 *    resulting hash is fully compatible with the existing /api/auth/email/* login.
 *  - If a user with ADMIN_EMAIL already exists, that account is upgraded to the
 *    SUPER_ADMIN role (the role enforced by src/middleware/admin.ts) instead of
 *    creating a duplicate. No existing user data is deleted or migrated.
 *  - Safe to re-run: the whole operation is idempotent.
 *  - The password is NEVER printed. Only a non-sensitive success confirmation is.
 *
 * ENVIRONMENT (place the REQUIRED ones in backend/.env — git-ignored — or in the
 * deploy dashboard). Optional ones fall back to sensible secure defaults.
 *   ADMIN_EMAIL        Admin login email                 (REQUIRED)
 *   ADMIN_PASSWORD     Admin password                    (REQUIRED, hashed before storage)
 *   ADMIN_FULL_NAME    Display name                      (optional, default "Admin User")
 *   ADMIN_USERNAME     Login username                    (optional, default "admin")
 *   ADMIN_COUNTRY      Country                           (optional, default "Not specified")
 *   ADMIN_ROLE         Role to assign                     (optional, default "SUPER_ADMIN")
 *   ADMIN_STATUS       Account status                    (optional, default "active")
 *
 * RUN ONCE (after deploy + `prisma migrate deploy`):
 *   npm run setup:admin
 * or, from the backend directory:
 *   node scripts/setup-admin-once.js
 */

// Load .env FIRST so DATABASE_URL + ADMIN_* are available to Prisma & bcrypt.
// dotenv never overrides variables already present in the process environment,
// so dashboard/env-provided values always win.
require('dotenv').config();

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Guard: ensure the Prisma client is generated. The Render deploy runs
// `npx prisma generate` during build, so this will be present in production.
let PrismaClient;
try {
  PrismaClient = require('@prisma/client').PrismaClient;
} catch (e) {
  console.error('✗ Prisma Client is not available. Run `npm run prisma:generate` first.');
  process.exit(1);
}

const prisma = new PrismaClient();

const SALT_ROUNDS = 10; // MUST match src/services/emailAuth.ts -> hashPassword()
const SUPER_ADMIN_ROLE = 'SUPER_ADMIN'; // matches src/middleware/admin.ts ROLES.SUPER_ADMIN

// --- Read all credentials from the environment (NEVER hard-code) ---
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || 'Admin User';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_COUNTRY = process.env.ADMIN_COUNTRY || 'Not specified';
let ADMIN_ROLE = process.env.ADMIN_ROLE || SUPER_ADMIN_ROLE;
const ADMIN_STATUS = process.env.ADMIN_STATUS || 'active';

function normalizeEmail(email) {
  return email.toLowerCase().trim();
}

// Sets a non-zero exit code but does NOT call process.exit(), so the caller
// can disconnect Prisma cleanly in a `finally` block.
function fail(message) {
  console.error('✗ ' + message);
  process.exitCode = 1;
}

// Hash a password using the SAME method as the app's emailAuth.hashPassword():
//   bcrypt.genSalt(10) + bcrypt.hash(password, salt)
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

// Resolve a unique username (case-insensitive uniqueness check).
async function uniqueUsername(base) {
  const normalized = String(base).toLowerCase();
  const taken = await prisma.user.findUnique({ where: { username: normalized } });
  if (!taken) return normalized;
  let counter = 1;
  let candidate;
  do {
    candidate = `${normalized}${counter}`;
    // username is @unique, findUnique is case-sensitive on Postgres by default
    // (depends on collation). Re-check for safety.
    counter++;
  } while (await prisma.user.findUnique({ where: { username: candidate } }));
  return candidate;
}

// Generate a unique referral code ("CMH" + 8 hex chars), unique across both
// the Referral.code and User.referralCode unique constraints.
async function uniqueReferralCode() {
  let code;
  do {
    code = 'CMH' + crypto.randomBytes(4).toString('hex').toUpperCase();
  } while (
    (await prisma.referral.findUnique({ where: { code } })) ||
    (await prisma.user.findUnique({ where: { referralCode: code } }))
  );
  return code;
}

async function main() {
  // 1️⃣ Validate required environment variables (never hard-code secrets).
  if (!ADMIN_EMAIL) {
    fail('ADMIN_EMAIL is not set. Provide it in your .env or environment (e.g. ADMIN_EMAIL=you@example.com).');
    return;
  }
  if (!ADMIN_PASSWORD) {
    fail('ADMIN_PASSWORD is not set. Provide it in your .env or environment (min 8 characters).');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(ADMIN_EMAIL)) {
    fail(`ADMIN_EMAIL ("${ADMIN_EMAIL}") is not a valid email address.`);
    return;
  }

  // Enforce a sensible minimum length for an admin password.
  if (ADMIN_PASSWORD.length < 8) {
    fail('ADMIN_PASSWORD must be at least 8 characters long.');
    return;
  }

  // Validate / normalise the role (do NOT invent new role names).
  const validRoles = ['SUPER_ADMIN', 'EMPLOYEE', 'user'];
  if (!validRoles.includes(ADMIN_ROLE)) {
    console.warn(`⚠  ADMIN_ROLE="${ADMIN_ROLE}" is not a recognised role; defaulting to SUPER_ADMIN.`);
    ADMIN_ROLE = SUPER_ADMIN_ROLE;
  }
  const role = ADMIN_ROLE;

  const email = normalizeEmail(ADMIN_EMAIL);
  const now = new Date();

  try {
    // 2️⃣ Verify DB connectivity + that migrations have been applied.
    let tableCheck;
    try {
      // Cast regclass -> text: Prisma cannot deserialize the raw regclass type.
      [tableCheck] = await prisma.$queryRaw`SELECT to_regclass('public."User"')::text AS t`;
    } catch (err) {
      fail(`Database connection failed: ${err.message}`);
      return;
    }
    if (!tableCheck || !tableCheck.t) {
      fail('The "User" table was not found. Apply migrations first (e.g. `npx prisma migrate deploy`).');
      return;
    }
    console.log('✓ Connected to database — schema OK');

    // 3️⃣ Hash the password with the SAME algorithm the auth flow uses.
    let passwordHash;
    try {
      passwordHash = await hashPassword(ADMIN_PASSWORD);
    } catch (err) {
      fail(`Failed to hash password: ${err.message}`);
      return;
    }

    // 4️⃣ Check whether ADMIN_EMAIL already exists BEFORE creating anything.
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, username: true, role: true, status: true },
    });

    let action;
    let userResult;

    if (existing) {
      // 5️⃣ Exists → UPGRADE that user to admin (no duplicate, no data loss).
      userResult = await prisma.user.update({
        where: { email },
        data: {
          role,                                   // elevate role (SUPER_ADMIN)
          employeeStatus: 'active',
          passwordHash,                           // freshly hashed — enables EMAIL login
          authMethod: 'EMAIL',
          status: ADMIN_STATUS,
          emailVerifiedAt: now,                    // admin is a verified account
          fullName: ADMIN_FULL_NAME,
          updatedAt: now,
        },
        select: { id: true, email: true, role: true, status: true, authMethod: true, fullName: true, username: true, employeeStatus: true },
      });
      action = 'upgraded';
    } else {
      // 6️⃣ Fresh DB → CREATE the admin user + required 1:1 Referral row.
      const username = await uniqueUsername(ADMIN_USERNAME);
      const referralCode = await uniqueReferralCode();

      userResult = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email,
          username,
          fullName: ADMIN_FULL_NAME,
          country: ADMIN_COUNTRY,
          passwordHash,                           // bcrypt-hashed (10 rounds)
          authMethod: 'EMAIL',
          status: ADMIN_STATUS,
          role,
          employeeStatus: 'active',
          emailVerifiedAt: now,
          referralCode,                           // required by schema (@unique, NOT NULL)
          updatedAt: now,                          // required: no @updatedAt default in schema
        },
        select: { id: true, email: true, role: true, status: true, authMethod: true, fullName: true, username: true, employeeStatus: true },
      });

      // The User.referralCode column is unique & non-null, and the Referral
      // model is a 1:1 child of User — create the matching Referral row.
      await prisma.referral.create({
        data: {
          id: crypto.randomUUID(),
          userId: userResult.id,                   // 1:1 relation (User.referralCode <-> Referral.code)
          code: referralCode,
        },
      });

      action = 'created';
    }

    // 7️⃣ SUCCESS — print a clear, non-sensitive confirmation.
    console.log('');
    console.log('✅ Admin account secured.');
    console.log('');
    console.log(`  Action      : ${action} (idempotent — safe to re-run)`);
    console.log(`  Email       : ${userResult.email}`);
    console.log(`  Username    : ${userResult.username}`);
    console.log(`  Full Name   : ${userResult.fullName}`);
    console.log(`  Role        : ${userResult.role}`);
    console.log(`  Auth Method : ${userResult.authMethod}`);
    console.log(`  Status      : ${userResult.status}`);
    console.log(`  Password    : hashed with bcrypt (salt rounds ${SALT_ROUNDS}) — never stored in plain text`);
    console.log('');
    console.log('  Sign in with: POST /api/auth/email/login  {"email":"...","password":"..."}');
    console.log('');
  } catch (err) {
    fail(`Unexpected error: ${err.message || err}`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
