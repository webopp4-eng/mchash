'use client';

import type { PropsWithChildren } from 'react';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { createConfig, http } from 'wagmi';
import { metaMask, walletConnect } from '@wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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

const config = createConfig({
  chains,
  connectors,
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
  },
});

export default function Providers({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider theme={darkTheme()}>
          {children}
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
