// Wallet integration types and utilities

export type Chain = 'solana' | 'ethereum' | 'bnb';

export type WalletConnectionState =
  | 'Detecting Wallet'
  | 'Opening Wallet'
  | 'Waiting for Approval'
  | 'Connected'
  | 'Connection Failed';

export interface WalletInfo {
  address: string;
  chain: Chain;
  walletType: string;
  balance?: string;
}

export interface MobileWalletInfo {
  id: string;
  name: string;
  scheme: string;
  installUrl: string;
  playStoreUrl?: string;
  desktopInstallUrl?: string;
  chain: 'solana' | 'ethereum' | 'bnb' | 'walletconnect' | 'multi';
}

export const mobileWallets: MobileWalletInfo[] = [
  {
    id: 'phantom',
    name: 'Phantom',
    scheme: 'phantom://',
    installUrl: 'https://apps.apple.com/app/phantom-trade-markets/id1598432977',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=app.phantom',
    desktopInstallUrl: 'https://phantom.com/download',
    chain: 'solana',
  },
  {
    id: 'solflare',
    name: 'Solflare',
    scheme: 'solflare://',
    installUrl: 'https://apps.apple.com/app/solflare-solana-crypto-wallet/id1580902717',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.solflare.mobile',
    desktopInstallUrl: 'https://solflare.com/download',
    chain: 'solana',
  },
  {
    id: 'backpack',
    name: 'Backpack',
    scheme: 'backpack://',
    installUrl: 'https://apps.apple.com/app/backpack-crypto-wallet/id6445964121',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=app.backpack.mobile',
    desktopInstallUrl: 'https://backpack.app/download',
    chain: 'solana',
  },
  {
    id: 'binance-wallet',
    name: 'Binance Wallet',
    scheme: 'bnc://',
    installUrl: 'https://www.binance.com/en/download',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.binance.dev',
    desktopInstallUrl: 'https://www.binance.com/en/web3wallet',
    chain: 'bnb',
  },
  {
    id: 'metamask',
    name: 'MetaMask',
    scheme: 'metamask://',
    installUrl: 'https://apps.apple.com/app/metamask/id1438144202',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=io.metamask',
    desktopInstallUrl: 'https://metamask.io/download',
    chain: 'ethereum',
  },
  {
    id: 'trust',
    name: 'Trust Wallet',
    scheme: 'trust://',
    installUrl: 'https://apps.apple.com/app/trust-crypto-bitcoin-wallet/id1288339409',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp',
    desktopInstallUrl: 'https://trustwallet.com/download',
    chain: 'ethereum',
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    scheme: 'wc://',
    installUrl: 'https://walletconnect.com/explorer?type=wallet',
    playStoreUrl: 'https://walletconnect.com/explorer?type=wallet',
    desktopInstallUrl: 'https://walletconnect.com/explorer?type=wallet',
    chain: 'walletconnect',
  },
];

function getSolanaProvider(walletId?: string) {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  if (walletId === 'phantom') return w.phantom?.solana || (w.solana?.isPhantom ? w.solana : null);
  if (walletId === 'solflare') return w.solflare || (w.solana?.isSolflare ? w.solana : null);
  if (walletId === 'backpack') return w.backpack?.solana || (w.solana?.isBackpack ? w.solana : null);
  return w.solana || w.phantom?.solana || w.solflare || w.backpack?.solana || null;
}

function getEvmProvider(walletId?: string) {
  if (typeof window === 'undefined') return null;
  const ethereum = (window as any).ethereum;
  if (!ethereum) return null;
  const providers = ethereum.providers || [ethereum];
  if (walletId === 'metamask') return providers.find((p: any) => p.isMetaMask && !p.isBraveWallet) || null;
  if (walletId === 'trust') return providers.find((p: any) => p.isTrust || p.isTrustWallet) || null;
  if (walletId === 'binance-wallet') return providers.find((p: any) => p.isBinance || p.isBinanceWallet || p.bnbSign) || (window as any).BinanceChain || null;
  return ethereum;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

export function detectWalletProvider(chain: Chain): { available: boolean; provider: string | null } {
  if (typeof window === 'undefined') return { available: false, provider: null };

  if (chain === 'solana') {
    const solana = getSolanaProvider();
    if (!solana) return { available: false, provider: null };
    if (solana.isPhantom) return { available: true, provider: 'Phantom' };
    if (solana.isSolflare) return { available: true, provider: 'Solflare' };
    if (solana.isBackpack) return { available: true, provider: 'Backpack' };
    return { available: true, provider: 'Solana Wallet' };
  }

  const ethereum = getEvmProvider();
  if (!ethereum) return { available: false, provider: null };
  const provider = ethereum.isMetaMask
    ? 'MetaMask'
    : ethereum.isCoinbaseWallet
    ? 'Coinbase Wallet'
    : ethereum.isTrust || ethereum.isTrustWallet
    ? 'Trust Wallet'
    : ethereum.isBinance || ethereum.isBinanceWallet
    ? 'Binance Wallet'
    : 'EVM Wallet';
  return { available: true, provider };
}

export function isWalletProviderAvailable(walletId: string): boolean {
  if (walletId === 'phantom' || walletId === 'solflare' || walletId === 'backpack') return Boolean(getSolanaProvider(walletId));
  if (walletId === 'metamask' || walletId === 'trust' || walletId === 'binance-wallet') return Boolean(getEvmProvider(walletId));
  return false;
}

export async function connectSolanaWallet(walletId?: string): Promise<WalletInfo> {
  const solana = getSolanaProvider(walletId);
  const walletName = walletId === 'solflare' ? 'Solflare' : walletId === 'backpack' ? 'Backpack' : 'Phantom';
  if (!solana) throw new Error(`${walletName} is not available in this browser. Open the app or install it first.`);

  try {
    const response = await solana.connect();
    const address = response.publicKey.toString();
    const walletType = solana.isPhantom ? 'Phantom' : solana.isSolflare ? 'Solflare' : solana.isBackpack ? 'Backpack' : 'Solana Wallet';
    return { address, chain: 'solana', walletType };
  } catch (error: any) {
    console.error('[Wallet] Solana connect error:', error);
    throw new Error(error.message || 'Failed to connect Solana wallet');
  }
}

export async function connectEvmWallet(chain: Chain, walletId?: string): Promise<WalletInfo> {
  const ethereum = getEvmProvider(walletId);
  const walletName = walletId === 'trust' ? 'Trust Wallet' : walletId === 'binance-wallet' ? 'Binance Wallet' : 'MetaMask';
  if (!ethereum) throw new Error(`${walletName} is not available in this browser. Open the app or install it first.`);

  try {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    const address = accounts[0];
    const walletType = ethereum.isMetaMask
      ? 'MetaMask'
      : ethereum.isCoinbaseWallet
      ? 'Coinbase Wallet'
      : ethereum.isTrust || ethereum.isTrustWallet
      ? 'Trust Wallet'
      : ethereum.isBinance || ethereum.isBinanceWallet
      ? 'Binance Wallet'
      : 'EVM Wallet';

    if (chain === 'bnb') {
      try {
        await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x38' }] });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x38',
              chainName: 'BNB Smart Chain',
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              rpcUrls: ['https://bsc-dataseed.binance.org'],
              blockExplorerUrls: ['https://bscscan.com'],
            }],
          });
        } else {
          throw switchError;
        }
      }
    }

    return { address, chain, walletType };
  } catch (error: any) {
    console.error('[Wallet] EVM connect error:', error);
    throw new Error(error.message || 'Failed to connect EVM wallet');
  }
}

export async function signSolanaMessage(message: string, walletId?: string): Promise<string> {
  try {
    const solana = getSolanaProvider(walletId);
    if (!solana) throw new Error('No Solana wallet found');
    const encodedMessage = new TextEncoder().encode(message);
    const signature = await solana.signMessage(encodedMessage, 'utf8');
    return bytesToBase64(signature.signature);
  } catch (error: any) {
    console.error('[Wallet] Solana sign error:', error);
    throw new Error(error.message || 'Failed to sign message with Solana wallet');
  }
}

export async function signEvmMessage(message: string, walletId?: string): Promise<string> {
  try {
    const ethereum = getEvmProvider(walletId);
    if (!ethereum) throw new Error('No EVM wallet found');
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    const selectedAddress = ethereum.selectedAddress || accounts?.[0];
    if (!selectedAddress) throw new Error('No EVM account selected');
    return ethereum.request({ method: 'personal_sign', params: [message, selectedAddress] });
  } catch (error: any) {
    console.error('[Wallet] EVM sign error:', error);
    throw new Error(error.message || 'Failed to sign message with EVM wallet');
  }
}

export async function getWalletBalance(_chain: Chain, _address: string): Promise<string> {
  return '0';
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function validateWalletAddress(address: string, chain?: Chain): { valid: boolean; chain?: Chain; error?: string } {
  const trimmed = address.trim();
  const evm = /^0x[a-fA-F0-9]{40}$/.test(trimmed);
  const solana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);
  if (chain === 'ethereum' || chain === 'bnb') return evm ? { valid: true, chain } : { valid: false, error: 'Enter a valid EVM address beginning with 0x.' };
  if (chain === 'solana') return solana ? { valid: true, chain } : { valid: false, error: 'Enter a valid Solana address.' };
  if (evm) return { valid: true, chain: 'ethereum' };
  if (solana) return { valid: true, chain: 'solana' };
  return { valid: false, error: 'Enter a valid Solana or EVM wallet address.' };
}

export function detectMobilePlatform(): { isMobile: boolean; isIOS: boolean; isAndroid: boolean; browser: string } {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { isMobile: false, isIOS: false, isAndroid: false, browser: 'desktop' };
  }
  const userAgent = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/.test(userAgent) && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(userAgent);
  const isMobile = isIOS || isAndroid || /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent);
  const browser = /CriOS/i.test(userAgent)
    ? 'chrome-ios'
    : /Edg/i.test(userAgent)
    ? 'edge'
    : /Firefox/i.test(userAgent)
    ? 'firefox'
    : /Safari/i.test(userAgent)
    ? 'safari'
    : 'browser';
  return { isMobile, isIOS, isAndroid, browser };
}

export function isMobileDevice(): boolean {
  return detectMobilePlatform().isMobile;
}

const walletConnectionRoutes = new Set(['/login', '/', '/dashboard']);

export function getSafeWalletRedirectUrl(routeOrUrl?: string): string {
  if (typeof window === 'undefined') return '/login';
  const origin = window.location.origin;
  const fallback = `${origin}/login?autoconnect=1`;

  try {
    const candidate = new URL(routeOrUrl || '/login?autoconnect=1', origin);
    if (candidate.origin !== origin) return fallback;
    if (!walletConnectionRoutes.has(candidate.pathname)) return fallback;
    if (!candidate.searchParams.has('autoconnect')) candidate.searchParams.set('autoconnect', '1');
    return candidate.toString();
  } catch {
    return fallback;
  }
}

export function getWalletOpenUrl(walletId: string, dappUrl?: string): string {
  const wallet = mobileWallets.find((w) => w.id === walletId);
  if (!wallet) return '';
  const url = typeof window !== 'undefined' ? getSafeWalletRedirectUrl(dappUrl) : dappUrl || '/login';
  const withoutProtocol = url.replace(/^https?:\/\//, '');
  const encoded = encodeURIComponent(url);
  const ref = encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : url);
  if (walletId === 'phantom') return `https://phantom.app/ul/browse/${encoded}?ref=${ref}`;
  if (walletId === 'solflare') return `https://solflare.com/ul/v1/browse/${encoded}?ref=${ref}`;
  if (walletId === 'backpack') return `https://backpack.app/ul/browse?url=${encoded}`;
  if (walletId === 'metamask') return `https://link.metamask.io/dapp/${withoutProtocol}`;
  if (walletId === 'trust') return `trust://browser_enable?url=${encoded}`;
  if (walletId === 'binance-wallet') return `bnc://app.binance.com/cedefi/dapp?url=${encoded}`;
  if (walletId === 'walletconnect') return 'https://walletconnect.com/explorer?type=wallet';
  return wallet.scheme;
}

export function openMobileWallet(
  walletId: string,
  deepLinkData?: string,
  onFallback?: (storeUrl: string) => void
): { started: boolean; fallbackUrl?: string; storeUrl?: string } {
  if (typeof window === 'undefined') return { started: false };
  const wallet = mobileWallets.find((w) => w.id === walletId);
  if (!wallet) return { started: false };

  const installUrl = getWalletInstallUrl(wallet.id);
  const opener = getSafeWalletRedirectUrl(deepLinkData);

  try {
    let leftPage = false;
    const markHidden = () => {
      if (document.hidden) leftPage = true;
    };
    window.addEventListener('pagehide', () => { leftPage = true; }, { once: true });
    document.addEventListener('visibilitychange', markHidden, { once: true });
    window.localStorage.setItem('cmhash_return_url', opener);
    window.location.href = getWalletOpenUrl(wallet.id, opener);

    // Set up listener for wallet app to redirect back
    const handleIncomingRedirect = (e: PopStateEvent) => {
      const returnUrl = window.localStorage.getItem('cmhash_return_url');
      if (returnUrl && e.state?.fromWallet) {
        // Process the wallet connection callback
        window.localStorage.removeItem('cmhash_return_url');
        window.removeEventListener('popstate', handleIncomingRedirect);
        // Trigger re-authentication
        window.dispatchEvent(new CustomEvent('cmhash:wallet-auth', {
          detail: { fromWallet: true, returnUrl }
        }));
      }
    };
    window.addEventListener('popstate', handleIncomingRedirect, { once: true });

    window.setTimeout(() => {
      if (!leftPage && !document.hidden && wallet.id !== 'walletconnect') {
        console.warn('[Wallet] Mobile wallet fallback triggered:', wallet.id, installUrl);
        onFallback?.(installUrl);
      }
    }, 1800);

    return { started: true, fallbackUrl: installUrl, storeUrl: installUrl };
  } catch (error) {
    console.error('[Wallet] Mobile wallet open failed:', wallet.id, error);
    return { started: false, fallbackUrl: installUrl, storeUrl: installUrl };
  }
}

export function getWalletInstallUrl(walletId: string): string {
  const wallet = mobileWallets.find((w) => w.id === walletId);
  if (!wallet) return '';
  const platform = detectMobilePlatform();
  if (!platform.isMobile) return wallet.desktopInstallUrl || wallet.installUrl;
  return platform.isAndroid ? wallet.playStoreUrl || wallet.installUrl : wallet.installUrl;
}

export function resolveWalletProtocol(walletId: string): string {
  return mobileWallets.find((w) => w.id === walletId)?.scheme || '';
}

export function getWalletConnections(): Array<{ id: string; name: string; type: string; chain: string; protocol: string; installUrl: string; downloadUrl?: string }> {
  return mobileWallets.map((wallet) => ({
    id: wallet.id,
    name: wallet.name,
    type: wallet.id,
    chain: wallet.chain,
    protocol: resolveWalletProtocol(wallet.id),
    installUrl: getWalletInstallUrl(wallet.id),
    downloadUrl: getWalletInstallUrl(wallet.id),
  }));
}

export function detectInstalledWallets(): string[] {
  if (typeof window === 'undefined') return [];
  const detected: string[] = [];
  if (isWalletProviderAvailable('phantom')) detected.push('Phantom');
  if (isWalletProviderAvailable('solflare')) detected.push('Solflare');
  if (isWalletProviderAvailable('backpack')) detected.push('Backpack');
  if (isWalletProviderAvailable('metamask')) detected.push('MetaMask');
  if (isWalletProviderAvailable('trust')) detected.push('Trust Wallet');
  if (isWalletProviderAvailable('binance-wallet')) detected.push('Binance Wallet');
  return detected;
}

export function detectWalletBrowser(): { walletId: string; name: string; chain: Chain } | null {
  if (typeof window === 'undefined') return null;
  const ua = navigator.userAgent || '';
  const platform = detectMobilePlatform();
  if (/Phantom/i.test(ua) || (platform.isMobile && isWalletProviderAvailable('phantom'))) return { walletId: 'phantom', name: 'Phantom', chain: 'solana' };
  if (/Solflare/i.test(ua) || (platform.isMobile && isWalletProviderAvailable('solflare'))) return { walletId: 'solflare', name: 'Solflare', chain: 'solana' };
  if (/Backpack/i.test(ua) || (platform.isMobile && isWalletProviderAvailable('backpack'))) return { walletId: 'backpack', name: 'Backpack', chain: 'solana' };
  if (/MetaMask/i.test(ua) || (platform.isMobile && isWalletProviderAvailable('metamask'))) return { walletId: 'metamask', name: 'MetaMask', chain: 'ethereum' };
  if (/Trust/i.test(ua) || (platform.isMobile && isWalletProviderAvailable('trust'))) return { walletId: 'trust', name: 'Trust Wallet', chain: 'ethereum' };
  return null;
}
