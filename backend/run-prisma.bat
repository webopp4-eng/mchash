@echo off
cd /d "c:\Users\user\Downloads\CM Hash\backend"
echo --- Prisma version ---
npx prisma version
echo --- Generating Prisma client ---
npx prisma generate
echo --- Running db push ---
npx prisma db push
echo --- Done ---
