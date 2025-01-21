import { useAccount, useEnsName, WagmiProvider } from 'wagmi'
import { WalletOptions } from '../wallet-options'
import { Account } from '../account'
import { useState } from "react";
import { useEffect } from "react";
import { use } from "react";
import type { Route } from '../+types/root';
import Game from '../routes/games/game';
import { Outlet } from 'react-router';
import { config } from '../wagmiconfig';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// const queryClient = new QueryClient()

function ConnectWallet() {
  const { isConnected } = useAccount()
  if (isConnected) return <Account />
  return <WalletOptions />
}

export default function WalletHeaderAndFooter() {
  const { address } = useAccount()
  const { data: ensName } = useEnsName({ address })

  return (
    <main className="flex flex-col items-center justify-center h-full w-full">
      <div>Based Chess </div>
      <div><ConnectWallet /></div>
      <div></div>
      <Outlet />
      <div>Code at <a href="https://github.com/jgresham/based-chess">github.com/jgresham/based-chess</a></div>
    </main>
  );
}
