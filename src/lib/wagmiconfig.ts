'use client';

import { http } from "wagmi";
import { createConfig } from "wagmi";
import { base, baseSepolia, mainnet, type Chain } from "wagmi/chains";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { walletConnect } from "wagmi/connectors";
import {
  coinbaseWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { connectorsForWallets } from "@rainbow-me/rainbowkit";

const walletConnectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      rainbowWallet,
      metaMaskWallet,
      coinbaseWallet,
      walletConnectWallet,
    ],
  }],
  {
    appName: 'Based Chess',
    projectId: 'fc0abe40a98d684825700df3507dc133',
  },
);

const chains: Chain[] = [base];
if (process.env.NEXT_PUBLIC_WORKER_DOMAIN?.includes("staging") || process.env.NEXT_PUBLIC_WORKER_DOMAIN?.includes("localhost")) {
  chains.push(baseSepolia);
}
// else {
//   chains.push(baseSepolia);
// }
// todo push local chain
// if(process.env.WALLET_ENV === "development") {
//   chains.push(baseSepolia);
// }

export const frameWagmiConfig = createConfig({
  chains: chains as [Chain, ...Chain[]],
  transports: {
    [base.id]: http('https://base-mainnet.g.alchemy.com/v2/xFjQGD9_D32OdWAY-iyViQ7xHYHIUF-i'),
    [baseSepolia.id]: http('https://base-sepolia.g.alchemy.com/v2/xFjQGD9_D32OdWAY-iyViQ7xHYHIUF-i'),
  },
  connectors: [farcasterFrame(),
  // walletConnect({
  //   projectId: 'fc0abe40a98d684825700df3507dc133',
  //   metadata: {
  //     name: 'Based Chess',
  //     description: 'Own your wins',
  //     url: 'https://basedchess.xyz',
  //     icons: ['https://basedchess.xyz/based-chess-logo.jpg'],
  //   },
  // }),
  ...walletConnectors],
});

// used for ens lookups. Ex. A provider on Base doesnt work for ens lookups.
export const mainnetConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/xFjQGD9_D32OdWAY-iyViQ7xHYHIUF-i'),
  },
})

// export const config = getDefaultConfig({
//   appName: 'Based Chess',
//   projectId: 'fc0abe40a98d684825700df3507dc133',
//   chains: [mainnet, base, baseSepolia],
//   // chains: [base],
//   transports: {
//     [base.id]: http('https://base-mainnet.g.alchemy.com/v2/xFjQGD9_D32OdWAY-iyViQ7xHYHIUF-i'),
//     [mainnet.id]: http('https://eth-mainnet.g.alchemy.com/v2/xFjQGD9_D32OdWAY-iyViQ7xHYHIUF-i'),
//   },
//   // chains: [base],
// });
