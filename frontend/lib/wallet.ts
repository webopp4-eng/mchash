// Wallet integration types and utilities

export type Chain = 'solana' | 'ethereum' | 'bnb';

export interface WalletInfo {
  address: string;
  chain: Chain;
  walletType: string;
  balance?: string;
}

// Detect if a wallet provider is available
export function detectWalletProvider(chain: Chain): { available: boolean; provider: string | null } {
  if (typeof window === 'undefined') return { available: false, provider: null };

  if (chain === 'solana') {
    const solana = (window as any).solana;
    if (solana) {
      if (solana.isPhantom) return { available: true, provider: 'Phantom' };
      if (solana.isSolflare) return { available: true, provider: 'Solflare' };
      if (solana.isBackpack) return { available: true, provider: 'Backpack' };
      return { available: true, provider: 'Solana Wallet' };
    }
    return { available: false, provider: null };
  }

  if (chain === 'ethereum' || chain === 'bnb') {
    const ethereum = (window as any).ethereum;
    if (ethereum) {
      const provider = ethereum.isMetaMask ? 'MetaMask' : ethereum.isCoinbaseWallet ? 'Coinbase Wallet' : ethereum.isTrust ? 'Trust Wallet' : 'EVM Wallet';
      return { available: true, provider };
    }
    return { available: false, provider: null };
  }

  return { available: false, provider: null };
}

// Connect to Solana wallet
export async function connectSolanaWallet(): Promise<WalletInfo> {
  const solana = (window as any).solana;
  if (!solana) throw new Error('No Solana wallet found. Please install Phantom or Solflare.');

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

// Connect to EVM wallet (Ethereum/BNB)
export async function connectEvmWallet(chain: Chain): Promise<WalletInfo> {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error('No EVM wallet found. Please install MetaMask or Trust Wallet.');

  try {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    const address = accounts[0];
    const walletType = ethereum.isMetaMask ? 'MetaMask' : ethereum.isCoinbaseWallet ? 'Coinbase Wallet' : ethereum.isTrust ? 'Trust Wallet' : 'EVM Wallet';

    // Switch network if needed
    if (chain === 'bnb') {
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }], // BNB Smart Chain
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x38',
              chainName: 'BNB Smart Chain',
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              rpcUrls: ['https://bsc-dataseed.binance.org'],
            }],
          });
        }
      }
    }

    return { address, chain, walletType };
  } catch (error: any) {
    console.error('[Wallet] EVM connect error:', error);
    throw new Error(error.message || 'Failed to connect EVM wallet');
  }
}

// Sign a message with Solana wallet
export async function signSolanaMessage(message: string): Promise<string> {
  try {
    const solana = (window as any).solana;
    if (!solana) throw new Error('No Solana wallet found');

    const encodedMessage = new TextEncoder().encode(message);
    const signature = await solana.signMessage(encodedMessage, 'utf8');
    return Buffer.from(signature.signature).toString('base64');
  } catch (error: any) {
    console.error('[Wallet] Solana sign error:', error);
    throw new Error(error.message || 'Failed to sign message with Solana wallet');
  }
}

// Sign a message with EVM wallet
export async function signEvmMessage(message: string): Promise<string> {
  try {
    const ethereum = (window as any).ethereum;
    if (!ethereum) throw new Error('No EVM wallet found');

    const signature = await ethereum.request({
      method: 'personal_sign',
      params: [message, ethereum.selectedAddress],
    });
    return signature;
  } catch (error: any) {
    console.error('[Wallet] EVM sign error:', error);
    throw new Error(error.message || 'Failed to sign message with EVM wallet');
  }
}

// Get wallet balance
export async function getWalletBalance(chain: Chain, address: string): Promise<string> {
  if (chain === 'solana') {
    return '0';
  }
  return '0';
}

// Shorten wallet address for display
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// Mobile deep linking for wallet apps
export interface MobileWalletInfo {
  id: string;
  name: string;
  deepLink: string;
  installUrl: string;
  chain: 'solana' | 'ethereum' | 'bnb';
}

export const mobileWallets: MobileWalletInfo[] = [
  {
    id: 'phantom',
    name: 'Phantom',
    deepLink: 'phantom:',
    installUrl: 'https://apps.apple.com/app/phantom/id1438144202',
    chain: 'solana',
  },
  {
    id: 'backpack',
    name: 'Backpack',
    deepLink: 'backpack:',
    installUrl: 'https://apps.apple.com/app/backpack/id6472684877',
    chain: 'solana',
  },
  {
    id: 'metamask',
    name: 'MetaMask',
    deepLink: 'metamask:',
    installUrl: 'https://apps.apple.com/app/metamask/id1438144202',
    chain: 'ethereum',
  },
];

// Check if we are on a mobile device
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Check if a wallet is installed on mobile
export async function isMobileWalletInstalled(walletId: string): Promise<boolean> {
  if (!isMobileDevice()) return false;

  if (walletId === 'phantom') {
    try {
      window.location.href = 'phantom:unlock';
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

// Open a wallet app via deep link
export function openMobileWallet(walletId: string, deepLinkData?: string): void {
  if (typeof window === 'undefined') return;

  const wallet = mobileWallets.find((w) => w.id === walletId);
  if (!wallet) return;

  if (deepLinkData) {
    if (walletId === 'phantom') {
      window.location.href = `phantom:connect?dappUrl=${encodeURIComponent(window.location.origin)}`;
    } else if (walletId === 'backpack') {
      window.location.href = `backpack://connect?dappUrl=${encodeURIComponent(window.location.origin)}`;
    } else if (walletId === 'metamask') {
      window.location.href = `metamask://connect?dappUrl=${encodeURIComponent(window.location.origin)}`;
    }
  } else {
    window.location.href = wallet.deepLink;
  }
}

// Get installation link for mobile wallet
export function getWalletInstallUrl(walletId: string): string {
  const wallet = mobileWallets.find((w) => w.id === walletId);
  return wallet?.installUrl || '';
}

// Detect installed wallets on the current platform
export function detectInstalledWallets(): string[] {
  if (typeof window === 'undefined') return [];

  const detected: string[] = [];
  const solana = (window as any).solana;
  const ethereum = (window as any).ethereum;

  if (solana) {
    if (solana.isPhantom) detected.push('Phantom');
    if (solana.isSolflare) detected.push('Solflare');
    if (solana.isBackpack) detected.push('Backpack');
  }

  if (ethereum) {
    if (ethereum.isMetaMask) detected.push('MetaMask');
    if (ethereum.isCoinbaseWallet) detected.push('Coinbase Wallet');
    if (ethereum.isTrust) detected.push('Trust Wallet');
  }

  return detected;
}