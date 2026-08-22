/**
 * CENTRALIZED PER-ASSET BALANCE HELPERS — single source of truth for the four
 * asset balances stored on the User profile (balanceUSDT, balanceBTC,
 * balanceETH, balanceMCCoin). Mining accrual, Withdrawals, Admin credit and
 * every frontend balance read goes through here so values are never hardcoded
 * or duplicated across sections.
 */

// The four asset currencies that live on a user's profile / wallet.
export const ASSET_SYMBOLS = ['USDT', 'BTC', 'ETH', 'MC Coin'] as const;
export type AssetSymbol = (typeof ASSET_SYMBOLS)[number];

// Canonical symbol -> User balance column name.
export const ASSET_BALANCE_FIELDS: Record<string, string> = {
  USDT: 'balanceUSDT',
  BTC: 'balanceBTC',
  ETH: 'balanceETH',
  'MC Coin': 'balanceMCCoin',
};

export interface AssetBalances {
  USDT: number;
  BTC: number;
  ETH: number;
  'MC Coin': number;
}

/** Normalize any asset string the frontend/API sends into the canonical symbol. */
export function normalizeAsset(raw: string | undefined | null): AssetSymbol {
  const value = String(raw || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');

  if (value === 'BTC' || value === 'BITCOIN') return 'BTC';
  if (value === 'ETH' || value === 'ETHEREUM') return 'ETH';
  if (value === 'USDT' || value === 'TETHER') return 'USDT';
  if (value === 'MCCOIN' || value === 'MCC' || value === 'MCOIN' || value === 'MCHASH') {
    return 'MC Coin';
  }
  // Unknown / unsupported asset — default to the platform base currency.
  return 'USDT';
}

/** Returns the User column backing an asset, e.g. 'MC Coin' -> 'balanceMCCoin'. */
export function getBalanceField(asset: string): string {
  const canonical = normalizeAsset(asset);
  const field = ASSET_BALANCE_FIELDS[canonical];
  if (!field) {
    throw new Error(`Unsupported withdrawal asset: ${asset}`);
  }
  return field;
}

/** Read the four per-asset balances straight off any user-like record.
 *  Fields are typed loosely (number | string | Decimal) so this compiles
 *  against both the generated Prisma client (which returns `Decimal`) and
 *  plain JSON where balances arrive as strings/numbers. */
export function getAssetBalances(user: {
  balanceUSDT?: number | string | any;
  balanceBTC?: number | string | any;
  balanceETH?: number | string | any;
  balanceMCCoin?: number | string | any;
} | null | undefined): AssetBalances {
  return {
    USDT: Number(user?.balanceUSDT || 0),
    BTC: Number(user?.balanceBTC || 0),
    ETH: Number(user?.balanceETH || 0),
    'MC Coin': Number(user?.balanceMCCoin || 0),
  };
}

/** Sum of all four per-asset balances. */
export function sumAssetBalances(balances: AssetBalances): number {
  return balances.USDT + balances.BTC + balances.ETH + balances['MC Coin'];
}

/** Map a per-asset balance into a USD value using live market prices (display only). */
export function assetUsdValue(asset: AssetSymbol, balance: number, prices: Record<string, number>): number {
  const price = Number(prices?.[asset] || 0);
  return balance * price;
}
