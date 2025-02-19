'use client';

import { http } from "wagmi";
import { createConfig } from "wagmi";
import { base } from "wagmi/chains";
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

export const frameWagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http('https://eth-mainnet.g.alchemy.com/v2/xFjQGD9_D32OdWAY-iyViQ7xHYHIUF-i'),
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