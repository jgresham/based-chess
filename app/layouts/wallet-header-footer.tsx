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
import { ConnectButton } from '@rainbow-me/rainbowkit';

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
    <main className="flex flex-col items-center h-full w-full">
      <div className='flex flex-row items-center justify-between w-full p-2'>
        <div className='font-bold'>Based Chess</div>
        <div><ConnectButton /></div>
      </div>
      <Outlet />
      <div className='flex flex-col items-center justify-center pt-16 pb-8 pr-8 pl-8 gap-2'>
        <a href="https://github.com/jgresham/based-chess">Based Chess Github</a>
        <p className='text-xs'>Credits to <a href="https://github.com/jhlywa/chess.js" target="_blank" rel="noopener noreferrer">chess.js</a>{" "}
          for the chess engine and <a href="https://github.com/Clariity/react-chessboard">react-chessboard</a>{" "}
          for the ui component.</p>
      </div>
    </main>
  );
}
