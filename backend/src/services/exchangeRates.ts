/**
 * Currency conversion service for the manual deposit feature.
 *
 * FIAT  — ExchangeRate API (https://www.exchangerate-api.com)
 *         Keyed v6 endpoints with an automatic fallback to the free
 *         open.er-api.com endpoint so deposits keep working if the
 *         keyed plan is unavailable.
 * CRYPTO — CoinMarketCap Pro API (https://coinmarketcap.com/api/)
 *
 * SECURITY
 *  - Both API keys are read from backend environment variables ONLY
 *    (EXCHANGERATE_API_KEY / COINMARKETCAP_API_KEY).
 *  - Keys are never returned by any endpoint, never logged, and never
 *    sent to the frontend. All external calls happen server-side here.
 *
 * CACHING
 *  - Fiat rates:      cached 30 minutes (rates change at most daily).
 *  - Crypto listings: cached 5 minutes (prices move continuously).
 *  - In-flight requests are de-duplicated so concurrent callers share
 *    one upstream request (no per-keystroke API calls from the UI).
 */

// ---------------------------------------------------------------------------
// ISO-4217 currency names (used to label the supported codes returned by the
// ExchangeRate API). Kept static so the searchable admin list works even when
// only the rate endpoint is available.
// ---------------------------------------------------------------------------
const FIAT_CURRENCY_NAMES: Record<string, string> = {
  AED: 'UAE Dirham', AFN: 'Afghan Afghani', ALL: 'Albanian Lek', AMD: 'Armenian Dram',
  ANG: 'Neth. Antillean Guilder', AOA: 'Angolan Kwanza', ARS: 'Argentine Peso',
  AUD: 'Australian Dollar', AWG: 'Aruban Florin', AZN: 'Azerbaijani Manat',
  BAM: 'Bosnia Convertible Mark', BBD: 'Barbadian Dollar', BDT: 'Bangladeshi Taka',
  BGN: 'Bulgarian Lev', BHD: 'Bahraini Dinar', BIF: 'Burundian Franc',
  BMD: 'Bermudian Dollar', BND: 'Brunei Dollar', BOB: 'Bolivian Boliviano',
  BRL: 'Brazilian Real', BSD: 'Bahamian Dollar', BTN: 'Bhutanese Ngultrum',
  BWP: 'Botswana Pula', BYN: 'Belarusian Ruble', BZD: 'Belize Dollar',
  CAD: 'Canadian Dollar', CDF: 'Congolese Franc', CHF: 'Swiss Franc',
  CLP: 'Chilean Peso', CNY: 'Chinese Yuan', COP: 'Colombian Peso',
  CRC: 'Costa Rican Colon', CUP: 'Cuban Peso', CVE: 'Cape Verdean Escudo',
  CZK: 'Czech Koruna', DJF: 'Djiboutian Franc', DKK: 'Danish Krone',
  DOP: 'Dominican Peso', DZD: 'Algerian Dinar', EGP: 'Egyptian Pound',
  ERN: 'Eritrean Nakfa', ETB: 'Ethiopian Birr', EUR: 'Euro',
  FJD: 'Fijian Dollar', FKP: 'Falkland Islands Pound', GBP: 'British Pound',
  GEL: 'Georgian Lari', GHS: 'Ghanaian Cedi', GIP: 'Gibraltar Pound',
  GMD: 'Gambian Dalasi', GNF: 'Guinean Franc', GTQ: 'Guatemalan Quetzal',
  GYD: 'Guyanese Dollar', HKD: 'Hong Kong Dollar', HNL: 'Honduran Lempira',
  HRK: 'Croatian Kuna', HTG: 'Haitian Gourde', HUF: 'Hungarian Forint',
  IDR: 'Indonesian Rupiah', ILS: 'Israeli New Shekel', INR: 'Indian Rupee',
  IQD: 'Iraqi Dinar', IRR: 'Iranian Rial', ISK: 'Icelandic Krona',
  JMD: 'Jamaican Dollar', JOD: 'Jordanian Dinar', JPY: 'Japanese Yen',
  KES: 'Kenyan Shilling', KGS: 'Kyrgyzstani Som', KHR: 'Cambodian Riel',
  KMF: 'Comorian Franc', KPW: 'North Korean Won', KRW: 'South Korean Won',
  KWD: 'Kuwaiti Dinar', KYD: 'Cayman Islands Dollar', KZT: 'Kazakhstani Tenge',
  LAK: 'Lao Kip', LBP: 'Lebanese Pound', LKR: 'Sri Lankan Rupee',
  LRD: 'Liberian Dollar', LSL: 'Lesotho Loti', LYD: 'Libyan Dinar',
  MAD: 'Moroccan Dirham', MDL: 'Moldovan Leu', MGA: 'Malagasy Ariary',
  MKD: 'Macedonian Denar', MMK: 'Myanmar Kyat', MNT: 'Mongolian Tugrik',
  MOP: 'Macanese Pataca', MRU: 'Mauritanian Ouguiya', MUR: 'Mauritian Rupee',
  MVR: 'Maldivian Rufiyaa', MWK: 'Malawian Kwacha', MXN: 'Mexican Peso',
  MYR: 'Malaysian Ringgit', MZN: 'Mozambican Metical', NAD: 'Namibian Dollar',
  NGN: 'Nigerian Naira', NIO: 'Nicaraguan Cordoba', NOK: 'Norwegian Krone',
  NPR: 'Nepalese Rupee', NZD: 'New Zealand Dollar', OMR: 'Omani Rial',
  PAB: 'Panamanian Balboa', PEN: 'Peruvian Sol', PGK: 'Papua New Guinean Kina',
  PHP: 'Philippine Peso', PKR: 'Pakistani Rupee', PLN: 'Polish Zloty',
  PYG: 'Paraguayan Guarani', QAR: 'Qatari Riyal', RON: 'Romanian Leu',
  RSD: 'Serbian Dinar', RUB: 'Russian Ruble', RWF: 'Rwandan Franc',
  SAR: 'Saudi Riyal', SBD: 'Solomon Islands Dollar', SCR: 'Seychellois Rupee',
  SDG: 'Sudanese Pound', SEK: 'Swedish Krona', SGD: 'Singapore Dollar',
  SHP: 'Saint Helena Pound', SLE: 'Sierra Leonean Leone', SOS: 'Somali Shilling',
  SRD: 'Surinamese Dollar', SSP: 'South Sudanese Pound', STN: 'Sao Tome Dobra',
  SVC: 'Salvadoran Colon', SYP: 'Syrian Pound', SZL: 'Eswatini Lilangeni',
  THB: 'Thai Baht', TJS: 'Tajikistani Somoni', TMT: 'Turkmenistan Manat',
  TND: 'Tunisian Dinar', TOP: 'Tongan Paanga', TRY: 'Turkish Lira',
  TTD: 'Trinidad & Tobago Dollar', TWD: 'Taiwan Dollar', TZS: 'Tanzanian Shilling',
  UAH: 'Ukrainian Hryvnia', UGX: 'Ugandan Shilling', USD: 'US Dollar',
  UYU: 'Uruguayan Peso', UZS: 'Uzbekistani Som', VES: 'Venezuelan Bolivar',
  VND: 'Vietnamese Dong', VUV: 'Vanuatu Vatu', WST: 'Samoan Tala',
  XAF: 'Central African CFA Franc', XCD: 'East Caribbean Dollar',
  XOF: 'West African CFA Franc', XPF: 'CFP Franc', YER: 'Yemeni Rial',
  ZAR: 'South African Rand', ZMW: 'Zambian Kwacha', ZWL: 'Zimbabwean Dollar',
};

// ---------------------------------------------------------------------------
// Cache plumbing (in-memory, per-process) with in-flight dedupe.
// ---------------------------------------------------------------------------
type CacheEntry<T> = { value: T; expiresAt: number };
const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

async function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  const now = Date.now();
  if (hit && now < hit.expiresAt) return hit.value as T;

  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = loader()
    .then((value) => {
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000), ...init });
  if (!response.ok) {
    throw new Error(`Exchange-rate provider error: ${response.status}`);
  }
  return response.json();
}

// ---------------------------------------------------------------------------
// FIAT — ExchangeRate API
// ---------------------------------------------------------------------------
const FIAT_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

type FiatRateData = { rates: Record<string, number>; source: string };

function exchangerateKey(): string {
  return process.env.EXCHANGERATE_API_KEY || '';
}

/** Latest fiat rates vs USD. Falls back to the free open.er-api.com feed. */
export async function getFiatRates(): Promise<FiatRateData> {
  return cached('fiat-rates', FIAT_CACHE_TTL_MS, async () => {
    const key = exchangerateKey();
    // Primary: keyed ExchangeRate API (v6)
    if (key) {
      try {
        const data = await fetchJson(`https://v6.exchangerate-api.com/v6/${key}/latest/USD`);
        if (data?.result === 'success' && data.conversion_rates) {
          return { rates: data.conversion_rates, source: 'exchangerate-api' };
        }
      } catch (err) {
        console.error('[exchange-rates] keyed fiat fetch failed, falling back:', err instanceof Error ? err.message : err);
      }
    }
    // Fallback: free open endpoint (no key required)
    const data = await fetchJson('https://open.er-api.com/v6/latest/USD');
    if (!data?.rates) throw new Error('Unable to load fiat exchange rates');
    return { rates: data.rates, source: key ? 'exchangerate-api-fallback' : 'exchangerate-api' };
  });
}

/**
 * Supported fiat currencies (code + English name), alphabetically ordered.
 * The code list comes from the ExchangeRate API itself — never hard-coded.
 */
export async function getFiatCurrencies(): Promise<{ code: string; name: string }[]> {
  return cached('fiat-currencies', FIAT_CACHE_TTL_MS, async () => {
    let codes: string[] = [];
    const key = exchangerateKey();

    if (key) {
      try {
        const data = await fetchJson(`https://v6.exchangerate-api.com/v6/${key}/codes`);
        if (data?.result === 'success' && Array.isArray(data.supported_codes)) {
          codes = data.supported_codes.map((entry: [string, string]) => entry[0]);
        }
      } catch (err) {
        console.error('[exchange-rates] keyed /codes failed, deriving from rates:', err instanceof Error ? err.message : err);
      }
    }

    if (codes.length === 0) {
      const { rates } = await getFiatRates();
      codes = Object.keys(rates);
    }

    return codes
      .filter((code) => /^[A-Z]{3}$/.test(code))
      .map((code) => ({ code, name: FIAT_CURRENCY_NAMES[code] || code }))
      .sort((a, b) => a.code.localeCompare(b.code));
  });
}

/** Fiat → USD rate (how many USD one unit of `code` buys). */
export async function getFiatToUsdRate(code: string): Promise<number> {
  const upper = code.toUpperCase();
  if (upper === 'USD') return 1;
  const { rates } = await getFiatRates();
  const rate = Number(rates[upper]);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(`Unsupported fiat currency: ${upper}`);
  }
  return rate;
}

// ---------------------------------------------------------------------------
// CRYPTO — CoinMarketCap Pro
// ---------------------------------------------------------------------------
const CRYPTO_LIST_TTL_MS = 5 * 60 * 1000;   // 5 minutes
const CRYPTO_PRICE_TTL_MS = 5 * 60 * 1000;  // 5 minutes

type CryptoEntry = { symbol: string; name: string; slug: string; priceUsd: number };

function coinmarketcapHeaders(): Record<string, string> {
  return { 'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY || '', accept: 'application/json' };
}

/** Top-500 crypto listings with live USD prices (cached). */
async function getCryptoListings(): Promise<CryptoEntry[]> {
  return cached('crypto-listings', CRYPTO_LIST_TTL_MS, async () => {
    const data = await fetchJson(
      'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=500&convert=USD',
      { headers: coinmarketcapHeaders() },
    );
    if (!Array.isArray(data?.data)) throw new Error('Unable to load cryptocurrency list');
    return data.data.map((row: any) => ({
      symbol: String(row.symbol).toUpperCase(),
      name: row.name,
      slug: row.slug,
      priceUsd: Number(row.quote?.USD?.price ?? 0),
    }));
  });
}

/** Supported cryptocurrencies (symbol + name), alphabetically ordered. */
export async function getCryptoCurrencies(): Promise<{ symbol: string; name: string }[]> {
  const listings = await getCryptoListings();
  const seen = new Set<string>();
  return listings
    .filter((entry) => {
      if (seen.has(entry.symbol)) return false;
      seen.add(entry.symbol);
      return true;
    })
    .map(({ symbol, name }) => ({ symbol, name }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));
}

/** Crypto → USD price for a single symbol (uses the cached listing first). */
export async function getCryptoToUsdPrice(symbol: string): Promise<number> {
  const upper = symbol.toUpperCase();

  const listings = await getCryptoListings();
  const match = listings.find((entry) => entry.symbol === upper);
  if (match && match.priceUsd > 0) return match.priceUsd;

  // Symbol outside the top-500: query it directly (also cached).
  const price = await cached(`crypto-price:${upper}`, CRYPTO_PRICE_TTL_MS, async () => {
    const data = await fetchJson(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${encodeURIComponent(upper)}&convert=USD`,
      { headers: coinmarketcapHeaders() },
    );
    const quote = data?.data?.[upper]?.quote?.USD?.price;
    if (!Number.isFinite(Number(quote))) throw new Error(`Unsupported cryptocurrency: ${upper}`);
    return Number(quote);
  });
  return price;
}

// ---------------------------------------------------------------------------
// Public conversion API used by the deposit flow
// ---------------------------------------------------------------------------
export type ConversionKind = 'fiat' | 'crypto';
export type ConversionResult = {
  kind: ConversionKind;
  originalAmount: number;
  originalCurrency: string;
  exchangeRate: number;   // units of USD per 1 unit of originalCurrency
  usdAmount: number;      // locked USD credit for the deposit
  source: string;         // which provider supplied the rate
};

/** Stablecoins that are hard-pegged to USD (rate = 1, no external call needed). */
const USD_PEGGED = new Set(['USD', 'USDT', 'USDC', 'DAI', 'BUSD', 'FDUSD', 'PYUSD', 'TUSD']);

function isKnownCryptoSymbol(symbol: string): boolean {
  return USD_PEGGED.has(symbol.toUpperCase());
}

/**
 * Convert any amount of a fiat currency or cryptocurrency into USD.
 * Resolves the currency kind automatically:
 *  - stablecoins pegged to USD convert at exactly 1:1 (no API call),
 *  - otherwise crypto symbols are resolved via CoinMarketCap,
 *  - everything else is treated as fiat via the ExchangeRate API.
 */
export async function convertToUsd(amount: number, code: string): Promise<ConversionResult> {
  const upper = String(code || '').toUpperCase().trim();
  if (!upper) throw new Error('Currency is required');

  if (USD_PEGGED.has(upper)) {
    return {
      kind: 'crypto',
      originalAmount: amount,
      originalCurrency: upper,
      exchangeRate: 1,
      usdAmount: round8(amount),
      source: 'usd-pegged',
    };
  }

  try {
    const price = await getCryptoToUsdPrice(upper);
    return {
      kind: 'crypto',
      originalAmount: amount,
      originalCurrency: upper,
      exchangeRate: price,
      usdAmount: round8(amount * price),
      source: 'coinmarketcap',
    };
  } catch {
    // Not a crypto symbol (or CMC unavailable) — treat as fiat.
  }

  const rate = await getFiatToUsdRate(upper);
  return {
    kind: 'fiat',
    originalAmount: amount,
    originalCurrency: upper,
    exchangeRate: rate,
    usdAmount: round8(amount * rate),
    source: 'exchangerate-api',
  };
}

function round8(value: number): number {
  return Math.round(value * 1e8) / 1e8;
}