import { http, createConfig } from 'wagmi'
import { base, mainnet } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

export const config = getDefaultConfig({
  appName: 'Based Chess',
  projectId: 'fc0abe40a98d684825700df3507dc133',
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
  ssr: false, // If your dApp uses server side rendering (SSR)
})