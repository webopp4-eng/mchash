// Temporary diagnostic: lists the actual columns of the "Deposit" table so we
// can verify whether the currency-conversion migration was applied. Delete
// this file after use.
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const cols = await prisma.$queryRaw`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'Deposit'
      ORDER BY ordinal_position`;
    console.log('Deposit columns:', JSON.stringify(cols, null, 2));

    const planCols = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'MiningPlan'
      ORDER BY ordinal_position`;
    console.log('MiningPlan columns:', JSON.stringify(planCols.map((c) => c.column_name)));

    const applied = await prisma.$queryRaw`
      SELECT migration_name FROM _prisma_migrations ORDER BY finished_at DESC NULLS LAST LIMIT 5`;
    console.log('Last migrations:', JSON.stringify(applied, null, 2));
  } catch (e) {
    console.error('DIAGNOSTIC ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();