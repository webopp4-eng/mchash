/**
 * Balance reconciliation / backfill.
 *
 * Keeps per-asset balances (balanceUSDT/BTC/ETH/MC) in sync with
 * platformBalance for EXISTING users, so funds from older deposits (that only
 * bumped platformBalance) and older admin credits, become available for
 * withdrawal and show up consistently everywhere.
 *
 * How it works:
 *  - The authoritative total is `platformBalance` (every flow maintains it).
 *  - The Transaction table is the ledger for the ASSET SPLIT of that total.
 *  - We re-derive each asset's share from the ledger, then rescale so the four
 *    per-asset balances sum exactly to platformBalance.
 *  - Idempotent: values are SET (not incremented) from a deterministic ledger.
 *
 * Usage:
 *   node scripts/sync-balances.js            # dry-run (prints a diff table)
 *   node scripts/sync-balances.js --apply    # writes the corrected balances
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');
const ASSETS = ['USDT', 'BTC', 'ETH', 'MC Coin'];
const FIELD = { USDT: 'balanceUSDT', BTC: 'balanceBTC', ETH: 'balanceETH', 'MC Coin': 'balanceMCCoin' };

// Map a transaction currency to one of the four withdrawable assets.
function toAsset(currency) {
  const c = String(currency || '').toUpperCase().replace(/\s+/g, '');
  if (['BTC', 'BITCOIN'].includes(c)) return 'BTC';
  if (['ETH', 'ETHEREUM'].includes(c)) return 'ETH';
  if (['MCCOIN', 'MCC', 'MCOIN', 'MCHASH'].includes(c)) return 'MC Coin';
  // USD-pegged / fiat USD + anything unknown settles in the base (USDT) bucket.
  return 'USDT';
}

function round8(n) {
  return Math.round(n * 1e8) / 1e8;
}

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, username: true } });
  let changed = 0;

  for (const user of users) {
    const txs = await prisma.transaction.findMany({
      where: { userId: user.id },
      select: { type: true, currency: true, amount: true, metadata: true },
    });

    // Per-asset net from the ledger (credits positive, debits negative).
    const bucket = { USDT: 0, BTC: 0, ETH: 0, 'MC Coin': 0 };
    for (const t of txs) {
      const amt = Number(t.amount) || 0;
      if (amt === 0) continue;
      // Counter-only admin credits (totalEarned/totalDeposited) are not
      // withdrawable balances, so keep them out of the asset split.
      if (t.type === 'admin_credit' && t.metadata?.balanceType && t.metadata.balanceType !== 'platformBalance') {
        continue;
      }
      bucket[toAsset(t.currency)] += amt;
    }

    const cur = await prisma.user.findUnique({
      where: { id: user.id },
      select: { platformBalance: true, balanceUSDT: true, balanceBTC: true, balanceETH: true, balanceMCCoin: true },
    });
    const platform = Number(cur?.platformBalance || 0);
    const ledgerTotal = bucket.USDT + bucket.BTC + bucket.ETH + bucket['MC Coin'];

    // No activity (or no ledger coverage) — don't fabricate balances.
    if (ledgerTotal === 0) {
      if (!APPLY && (platform !== 0 || Object.values(cur).some((v) => Number(v || 0) !== 0))) {
        console.warn(`  #${user.id} no ledger coverage (platform=${platform}) — skipped`);
      }
      continue;
    }

    // Scale the ledger split so the four per-asset balances sum to platform.
    const scale = platform / ledgerTotal;
    const raw = {
      USDT: bucket.USDT * scale,
      BTC: bucket.BTC * scale,
      ETH: bucket.ETH * scale,
      'MC Coin': bucket['MC Coin'] * scale,
    };

    // Assign exact values; put residual rounding into USDT so they total platform.
    const bt = round8(raw.BTC);
    const et = round8(raw.ETH);
    const mc = round8(raw['MC Coin']);
    const usdtTarget = round8(platform - bt - et - mc);

    const before = {
      USDT: Number(cur?.balanceUSDT || 0),
      BTC: Number(cur?.balanceBTC || 0),
      ETH: Number(cur?.balanceETH || 0),
      'MC Coin': Number(cur?.balanceMCCoin || 0),
    };
    const after = { USDT: usdtTarget, BTC: bt, ETH: et, 'MC Coin': mc };

    const didChange = ASSETS.some((a) => Math.abs(before[a] - after[a]) > 1e-8);
    if (!didChange) continue;

    const label = user.email || user.username || user.id;
    if (APPLY) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          [FIELD.USDT]: after.USDT,
          [FIELD.BTC]: after.BTC,
          [FIELD.ETH]: after.ETH,
          [FIELD['MC Coin']]: after['MC Coin'],
        },
      });
    }
    console.log(
      `[${APPLY ? 'APPLIED' : 'would '}] ${label}`,
      `platform=${platform.toFixed(4)}`,
      ASSETS.map((a) => `${a} ${before[a].toFixed(6)} → ${after[a].toFixed(6)}`).join('  ·  ')
    );
    changed++;
  }

  console.log(`\n${APPLY ? 'Applied' : 'Would update'} balances for ${changed} user(s).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); process.exit(1); });