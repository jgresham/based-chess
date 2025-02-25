'use client';

import { http } from "wagmi";
import { createConfig } from "wagmi";
import { base, baseSepolia, type Chain } from "wagmi/chains";
import { frameConnector } from "./frameConnector";
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
  { appName: 'Based Chess', projectId: 'fc0abe40a98d684825700df3507dc133' },
);

let chains = [base];
if (import.meta.env.VITE_WORKER_DOMAIN?.includes("staging") || import.meta.env.VITE_WORKER_DOMAIN?.includes("localhost")) {
  chains.push(baseSepolia);
} else {
  chains.push(baseSepolia);
}

export const frameWagmiConfig = createConfig({
  chains: chains,
  transports: {
    [base.id]: http('https://eth-mainnet.g.alchemy.com/v2/xFjQGD9_D32OdWAY-iyViQ7xHYHIUF-i'),
    [baseSepolia.id]: http('https://base-sepolia.g.alchemy.com/v2/xFjQGD9_D32OdWAY-iyViQ7xHYHIUF-i'),
  },
  connectors: [frameConnector(),
  walletConnect({
    projectId: 'fc0abe40a98d684825700df3507dc133',
    metadata: {
      name: 'Based Chess',
      description: 'Own your wins',
      url: 'https://basedchess.xyz',
      icons: ['https://basedchess.xyz/based-chess-logo.jpg'],
    },
  }),
  ...walletConnectors],
  ssr: false,
});