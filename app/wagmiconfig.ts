import { http, createConfig } from 'wagmi'
import { base, baseSepolia } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

export const config = getDefaultConfig({
  appName: 'Based Chess',
  projectId: '7b2b30fc5c6e3d76890ab27b715b5f17',
  chains: [base],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

// export const config = createConfig({
//   chains: [base, baseSepolia],
//   transports: {
//     [base.id]: http(),
//     [baseSepolia.id]: http(),
//   },
// })