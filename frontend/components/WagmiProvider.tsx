'use client';

import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiConfig, createConfig } from 'wagmi';
import { metaMask, walletConnect } from '@wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { mainnet, bsc } from 'wagmi/chains';

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const chains = [mainnet, bsc] as const;

const queryClient = new QueryClient();

const connectors = [
  metaMask(),
  ...(walletConnectProjectId
    ? [
        walletConnect({
          projectId: walletConnectProjectId,
        }),
      ]
    : []),
];

const wagmiConfig = createConfig({
  chains,
  connectors,
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
  },
});

export default function WagmiProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider initialChain={mainnet.id} theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
}
