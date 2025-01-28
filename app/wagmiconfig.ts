import { http, createConfig } from 'wagmi'
import { base, baseSepolia, mainnet } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

export const config = getDefaultConfig({
  appName: 'Based Chess',
  projectId: '7b2b30fc5c6e3d76890ab27b715b5f17',
  // chains: [mainnet, base],
  chains: [base],
  transports: {
    [base.id]: http(),
    // [mainnet.id]: http(),
  },
  // chains: [base],
  ssr: false, // If your dApp uses server side rendering (SSR)
});

export const mainnetConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
})