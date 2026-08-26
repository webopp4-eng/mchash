const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const deposits = await prisma.deposit.deleteMany({
    where: {
      OR: [
        { txHash: { startsWith: '0xTEST' } },
        { txHash: { startsWith: '0xFIXTEST' } },
        { txHash: { startsWith: '0xHUGE' } },
      ],
    },
  });
  console.log('deleted test deposits:', deposits.count);

  const notes = await prisma.notification.deleteMany({
    where: { type: 'deposit', title: 'Deposit Submitted', User: { email: 'qwerty7yh@gmail.com' } },
  });
  console.log('deleted test notifications:', notes.count);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e.message); process.exit(1); });
