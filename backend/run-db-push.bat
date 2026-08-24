@echo off
cd /d "c:\Users\user\Downloads\CM Hash\backend"
cd
echo --- Installing dependencies ---
npm install
echo --- Generating Prisma client ---
npx prisma generate
echo --- Running db push ---
npx prisma db push
