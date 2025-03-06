import type { Metadata } from "next";
import localFont from "next/font/local";
import { ConnectButton, darkTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import "./globals.css";
import FrameProvider from "../lib/frameProvider";
import sdk from "@farcaster/frame-sdk";
import { useState } from "react";
import Providers from "./providers";
import '../../node_modules/@rainbow-me/rainbowkit/dist/index.css';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const appUrl = process.env.NEXT_PUBLIC_URL;

export const metadata: Metadata = {
  title: "Based Chess",
  description: "Welcome to Based Chess",
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: `${appUrl}/based-chess-logo-3-2-2.png`,
      button: {
        title: "Play Chess",
        action: {
          type: "launch_frame",
          name: "Based Chess",
          url: `${appUrl}/`,
          splashImageUrl: `${appUrl}/based-chess-logo-200.jpg`,
          splashBackgroundColor: "#ffffff"
        }
      }
    })
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* inside of body prev */}
        <Providers>
          {/* // 98% to leave room for vertical scrollbar */}
          <main className="flex flex-col items-center h-full w-[98%] justify-self-center">
            <div className='flex flex-row items-center justify-between w-full p-2'>
              <div className='font-bold'>Based Chess</div>
              {process.env.NEXT_PUBLIC_WORKER_DOMAIN?.includes("localhost") && <div className='text-xs text-green-500'>DEV</div>}
              {process.env.NEXT_PUBLIC_WORKER_DOMAIN?.includes("staging") && <div className='text-xs text-yellow-500'>STAGING</div>}
              <div><ConnectButton /></div>
            </div>
            {children}
            <div className='flex flex-col items-center justify-center pt-16 pb-8 pr-8 pl-8 gap-2'>
              <a href="https://github.com/jgresham/based-chess">Based Chess Github</a>
              <p className='text-xs'>Credits to <a href="https://github.com/jhlywa/chess.js" target="_blank" rel="noopener noreferrer">chess.js</a>{" "}
                for the chess engine and <a href="https://github.com/Clariity/react-chessboard">react-chessboard</a>{" "}
                for the ui component.</p>
            </div>
          </main>
        </Providers>
      </body>
    </html>
  );
}
