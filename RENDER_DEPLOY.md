# Render Deployment Guide

## Backend Environment Variables

Set these in your Render Web Service **Environment** tab:

```env
# SECRET — copy the "External Database URL" from your Render PostgreSQL dashboard.
# Never commit the real value to this repository.
DATABASE_URL=<paste-your-render-external-database-url-here>

# SECRET — generate a long random value. Use: openssl rand -base64 32
JWT_SECRET=<paste-a-long-random-secret-here>

PORT=4000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### Important Notes:
- `DATABASE_URL`: Copy it from the Render Dashboard → your PostgreSQL instance → "Connections" (never hard-code it in the repo)
- `JWT_SECRET`: Generate a secure random string (min 32 chars). Use: `openssl rand -base64 32`
- `FRONTEND_URL`: Update this after deploying your frontend (used for CORS)

## Frontend Environment Variables

If deploying frontend to Vercel/Netlify:

```env
NEXT_PUBLIC_API_URL=https://cm-hash-backend.onrender.com
```

## Render Configuration

**Build Command:**
```bash
npm install && npx prisma generate && npx prisma migrate deploy && npm run build
```

**Start Command:**
```bash
npm start
```

**Root Directory:** `backend`

## Post-Deployment Steps

1. After first deploy, run seed in Render Shell:
```bash
npx prisma db seed
```

This creates:
- 4 mining plans (Starter, Pro, Premium, Enterprise)
- Platform settings (min/max withdrawal, referral levels, etc.)

## Database

✅ Already created: `cmhast` database on Render PostgreSQL
✅ Migrations applied: `20260811015345_init`
✅ Schema synced with 16 models

## Services to Deploy

1. **Backend**: Render Web Service (Node.js)
   - URL: `https://mchash.onrender.com`
   
2. **Frontend**: Vercel or Netlify (Next.js)
   - URL: `https://webopp4-eng.github.io/mchash/` (or your custom domain)

3. **Database**: Render PostgreSQL (already created)
   - Name: `cmhast`
   - Region: Oregon