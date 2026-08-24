@echo off
cd /d "c:\Users\user\Downloads\CM Hash\backend"
echo --- Prisma generate ---
npx prisma generate 2>&1
echo GENERATE_EXIT=%errorlevel%
echo --- Prisma db push ---
npx prisma db push 2>&1
echo PUSH_EXIT=%errorlevel%
