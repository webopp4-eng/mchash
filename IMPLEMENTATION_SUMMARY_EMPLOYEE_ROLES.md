# Employee Roles & Support Chat System — Implementation Summary

## Overview
Added a multi-tier employee role system and a full support chat infrastructure to the CM Hash platform. Employees (support agents) can access a restricted admin panel, manage support conversations, and escalate to SUPER_ADMINs when needed. All employee actions are audit-logged.

## Database Changes

### Schema (`backend/prisma/schema.prisma`)
- **User model** updated:
  - `role` expanded from `String` → `UserRole` enum (`USER`, `EMPLOYEE`, `SUPER_ADMIN`)
  - New column `employeeStatus` (`String?`, default `"active"`, indexes on it)
  - New column `employeeRole` (`String?`, e.g. `"support_agent"`, `"admin"`)
  - New column `employeeCreatedAt` (`DateTime?`, nullable)
- **SupportConversation** model (new):
  - `id`, `userId`, `assignedToId` (nullable), `status` (`OPEN | IN_PROGRESS | RESOLVED | CLOSED`), `subject`, `priority`, `lastMessageAt`, timestamps
  - Relations to `User` (user + assigned agent) and `SupportMessage`
- **SupportMessage** model (new):
  - `id`, `conversationId`, `senderId`, `senderRole` (`user | admin | employee | system`), `message`, `isInternal`, `readBy`, timestamps
- **AuditLog** model (new):
  - `id`, `userId`, `action`, `resource`, `resourceId`, `details`, `ipAddress`, `userAgent`, timestamps

### Migration (`backend/prisma/migrations/20260820010000_add_employee_roles_support_chat/migration.sql`)
- Creates the three new tables and alters the `User` table to add the new columns
- Uses a transaction to convert existing `role='admin'` → `role='SUPER_ADMIN'`

## Backend Changes

### `backend/src/middleware/auth.ts`
- `loadUser` middleware now checks `user.status` against an allowed set that includes `'active'`, `'admin'`, and `'SUPER_ADMIN'`
- `AuthRequest` interface extended with optional `employeeStatus` and `employeeRole` fields

### `backend/src/middleware/admin.ts`
- `requireSuperAdmin` — restricts routes to SUPER_ADMIN only (e.g., treasury, employee management)
- `requireAdminOrEmployee` — allows both SUPER_ADMIN and EMPLOYEE (e.g., support, deposits, withdrawals)
- `requireSupportAgent` — allows access when `employeeStatus === 'active'`
- `authenticateToken` updated to accept SUPER_ADMIN role as valid alongside active status

### `backend/src/routes/auth.ts`
- `/session-check` and `/me` endpoints now return `employeeStatus` and `employeeRole` in the user object
- Wallet/email login responses include `employeeStatus` for staff users
- Email signup/login already return `role`, which now properly uses the new enum values

### `backend/src/routes/admin.ts`
- **Employee management** (`/employees` — GET, POST, PATCH, DELETE):
  - All staff can list employees; only SUPER_ADMIN can create/update/delete
  - Uses `requireAdminOrEmployee` for listing, `requireSuperAdmin` for mutations
- **Employee authentication** (`/auth/employee-login`):
  - Dedicated login endpoint for employees using email + password or wallet signature
  - Returns JWT and sets httpOnly cookie
- **Support conversations** (`/support/conversations`, `/support/conversations/:id`, `/support/conversations/:id/messages`, `/support/messages`):
  - All staff can list and manage conversations
  - Internal notes support (`isInternal` flag)
  - Real-time message relay via WebSocket (if socket.io is configured)
- **Notifications** (`/notifications`):
  - Staff can view and mark notifications as read
- All employee routes wrapped with `auditAction` logging

### `backend/src/services/auditLog.ts` (new)
- `auditAction(action, resource, resourceId?, details?)` — writes to `AuditLog` table
- `logResourceAccess(permission, resource)` — middleware-style audit helper
- `logStaffActivity(action, details)` — convenience wrapper for employee actions

### `backend/src/services/mining.ts`
- No changes required (unaffected by role system)

## Frontend Changes

### `frontend/lib/auth.ts`
- `User` interface extended with optional `employeeStatus?: string` and `employeeRole?: string`
- All existing auth utilities (getToken, getUser, setUser, isAuthenticated, logout, apiFetch) work unchanged with the new fields

### `frontend/components/WalletSignIn.tsx`
- Role-based redirect updated: checks for `'SUPER_ADMIN'` or `'EMPLOYEE'` → `/admin`, otherwise → `/dashboard`

### `frontend/app/admin/layout.tsx`
- Already uses `isSuperAdmin` (role === 'SUPER_ADMIN') and `isEmployee` (role === 'EMPLOYEE')
- `isStaff` = super admin or employee → can access admin panel
- Treasury/Wallet nav item restricted to `isSuperAdmin` only
- Non-staff users redirected to `/login`
- Role label displayed in sidebar ("Super Admin" / "Employee")

### `frontend/app/dashboard/support/page.tsx`
- User-facing support chat: creates conversations, sends messages, views conversation history
- Polls for new messages and shows notification when staff replies

### `frontend/app/admin/support/page.tsx`
- Employee-facing support inbox: lists all conversations, assigns to self, sends replies
- Internal notes support for staff communication
- Real-time polling for new messages

### `frontend/app/admin/layout.tsx` (navigation)
- Support nav item visible to all staff
- Employees section (placeholder for future employee management UI)

## Scripts Updated
- `backend/make-admin.js` — now sets `role='SUPER_ADMIN'` and `employeeStatus='active'`
- `backend/setup-admin.js` — now sets `role='SUPER_ADMIN'`
- `backend/check-user.js` — now includes `employeeStatus` in query output

## Deployment Notes
1. Run `npx prisma generate` after pulling to update the generated client
2. Run `npx prisma migrate deploy` (production) or `npx prisma migrate dev` (development) to apply the migration
3. Use `node backend/make-admin.js` to set up the initial super admin account
4. Employee accounts can be created via the `/api/admin/employees` endpoint (SUPER_ADMIN only)

## Testing
- Both backend (`tsc --noEmit`) and frontend (`tsc --noEmit`) compile without errors
- The Prisma Client was regenerated with the new schema
- All existing functionality (wallet auth, email auth, deposits, withdrawals) remains intact
