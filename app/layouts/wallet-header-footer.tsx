'use client';

import { Outlet } from 'react-router';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import 'node_modules/@rainbow-me/rainbowkit/dist/index.css';

export default function WalletHeaderAndFooter() {
  return (
    // 98% to leave room for vertical scrollbar
    <main className="flex flex-col items-center h-full w-[98%] justify-self-center">
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
