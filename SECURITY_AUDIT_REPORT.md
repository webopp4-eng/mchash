# Security Audit Report — Hard-coded Secrets Removal

**Date:** 2026-08-22
**Scope:** Entire repository (working tree + full git history)
**Private details:** Stored OUTSIDE the repo in `../cm-hash-security-private/INCIDENT_REPORT.md` (contains the new rotated JWT secret and full exposure details — never commit that file).

---

## 1. Findings

| # | Severity | Location | Issue | Status |
|---|----------|----------|-------|--------|
| 1 | **CRITICAL** | `render.yaml` | Live PostgreSQL connection string (with password) and JWT secret committed as literal `value:` fields | ✅ Fixed |
| 2 | **CRITICAL** | `RENDER_DEPLOY.md` | Same live DB password + JWT secret in the example env block | ✅ Fixed |
| 3 | **CRITICAL** | Git history | 24 occurrences of the above credentials across 157 commits | ✅ Scrubbed |
| 4 | Medium | `docker-compose.yml` | Hard-coded local dev DB credentials (`cmhash`/`cmhashpass`) and weak JWT secret | ✅ Fixed (env vars with local-only defaults) |
| 5 | Low | `frontend/.env.production` | `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` — a **public** client-side identifier by design (not a secret). Optional: restrict allowed domains in WalletConnect Cloud. | Documented |
| 6 | Info | `DEPLOYMENT_CHECKLIST.md`, `AUDIT_REPORT_FINAL.md` | Placeholder values only (`user:password`, `JWT_SECRET=...`) — false positives | No action |
| 7 | Info | `backend/.env` | Untracked (correctly ignored), but contained the compromised credentials on disk | JWT rotated locally; DB URL must be updated after password rotation |

## 2. Fixes applied (working tree)

- **`render.yaml`** — `DATABASE_URL` and `JWT_SECRET` now use `sync: false` with **no inline values**; real values are set only in the Render Dashboard → Environment tab.
- **`RENDER_DEPLOY.md`** — credentials replaced with `<paste-...-here>` placeholders plus instructions to copy the DB URL from the Render dashboard and generate the JWT with `openssl rand -base64 32`.
- **`docker-compose.yml`** — all credentials moved to environment variables (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `JWT_SECRET`) with local-development defaults; `JWT_SECRET` is now **required** (`:?` syntax) so compose fails fast if unset.
- **`.gitignore`** — now blocks `**/.env`, `**/.env.*`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.jks`, `secrets/`, `credentials.json`, `service-account*.json`, while explicitly allowing `!.env.example` template files.
- **`backend/.env`** (local, untracked) — JWT_SECRET rotated to a freshly generated 64-char cryptographic secret.

## 3. Git history cleanup

`git-filter-repo`/BFG were unavailable (no Python/Java on this machine), so an equivalent **BFG-style scrub** was performed with pure git + Node:

1. `git fast-export --all` (22 MB stream, binary-safe)
2. Byte-level replacement of every secret occurrence with a **same-length** `***REDACTED-ROTATE-CREDENTIALS***` marker (same-length keeps `data <N>` stream headers valid)
3. `git fast-import` into a brand-new bare mirror: `../mchash-history-clean`
4. Verification: `git grep` of every secret across **all 157 commits → clean**

- **Result:** 24 occurrences redacted (8× JWT secret, 16× DB password). All 157 commits verified clean.
- The original repository was **not modified** and serves as a backup until the clean mirror is pushed.

### Publish the cleaned history (run manually — destructive to remote)
```bash
cd ../mchash-history-clean
git remote add origin https://github.com/webopp4-eng/mchash.git
git push origin --force --mirror
```
Then delete the old local clone and re-clone fresh from GitHub.

## 4. Credential rotation checklist (REQUIRED — do not skip)

History scrubbing does not un-leak credentials that were already public. Rotate everything that was exposed:

- [ ] **Render PostgreSQL password** — Render Dashboard → `cmhash-db` → rotate/reset user password → copy the new *External Database URL*
- [ ] **Render Web Service env vars** — set the new `DATABASE_URL` and the new `JWT_SECRET` (stored in the private incident report), then trigger a manual deploy
- [ ] **Local `backend/.env`** — update `DATABASE_URL` after the password rotation (JWT_SECRET already rotated locally)
- [ ] **WalletConnect (optional)** — restrict allowed domains for the project ID in WalletConnect Cloud
- [ ] **GitHub** — consider enabling secret-scanning + push protection on the repository

> Note: rotating `JWT_SECRET` invalidates all existing sessions/tokens — users will simply need to log in again.

## 5. Prevention

- `secret-scan.js` is committed and re-runnable (`node secret-scan.js`) — wire it into CI or a pre-commit hook to block future secret commits.
- All deployment secrets now live exclusively in the Render Dashboard / local untracked `.env` files.