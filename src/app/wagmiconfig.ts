import { http, createConfig } from 'wagmi'
import { base, baseSepolia, mainnet } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

export const config = getDefaultConfig({
  appName: 'Based Chess',
  projectId: 'fc0abe40a98d684825700df3507dc133',
  chains: [mainnet, base, baseSepolia],
  // chains: [base],
  transports: {
    [base.id]: http('https://base-mainnet.g.alchemy.com/v2/xFjQGD9_D32OdWAY-iyViQ7xHYHIUF-i'),
    [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/xFjQGD9_D32OdWAY-iyViQ7xHYHIUF-i'),
  },
  // chains: [base],
});

// used for ens lookups. Ex. A provider on Base doesnt work for ens lookups.
export const mainnetConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/xFjQGD9_D32OdWAY-iyViQ7xHYHIUF-i'),
  },
})