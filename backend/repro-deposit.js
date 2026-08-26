// Temporary diagnostic: reproduces the deposit submission against a locally
// running backend (PORT=4010) using a signed test token. Delete after use.
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const user = await prisma.user.findFirst({
      where: { role: { notIn: ['SUPER_ADMIN', 'EMPLOYEE'] } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, username: true },
    });
    if (!user) throw new Error('No regular user found in DB');

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET missing');
    const token = jwt.sign({ sub: user.id }, secret);

    const body = { amount: 10, currency: 'USDT', chain: 'ethereum', method: 'manual' };
    const res = await fetch('http://localhost:4010/api/deposits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    console.log('HTTP', res.status);
    console.log(await res.text());
  } catch (e) {
    console.error('REPRO ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();