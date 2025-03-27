"use client";

import { useAccount, useEnsAddress } from 'wagmi'
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import DisplayAddress from '../components/util/DisplayAddress';
import { sdk, type Context } from "@farcaster/frame-sdk"
import NewGameSheet from '../components/NewGameSheet';

// export function metadata() {
//   return [
//     { title: "Based Chess" },
//     { name: "description", content: "Welcome to Based Chess" },
//     // {/* prod */}
//     // {
//     //   name: "fc:frame", content: JSON.stringify({
//     //     "version": "next",
//     //     "imageUrl": "https://basedchess.xyz/based-chess-logo-3-2-2.png",
//     //     "button": {
//     //       "title": "Play Based Chess",
//     //       "action": {
//     //         "type": "launch_frame", "name": "Based Chess", "url": "https://based-chess-frame.pages.dev/",
//     //         "splashImageUrl": "https://basedchess.xyz/based-chess-logo-200.jpg", "splashBackgroundColor": "#ffffff"
//     //       }
//     //     }
//     //   })
//     // },

//     // {/* dev */}
//     // {
//     //   name: "fc:frame", content: JSON.stringify({
//     //     "version": "next",
//     //     "imageUrl": "https://basedchess.xyz/based-chess-logo-3-2-2.png",
//     //     "button": {
//     //       "title": "Play Based Chess",
//     //       "action": {
//     //         "type": "launch_frame", "name": "Based Chess", "url": "https://6701-52-119-126-16.ngrok-free.app/",
//     //         "splashImageUrl": "https://basedchess.xyz/based-chess-logo-200.jpg", "splashBackgroundColor": "#ffffff"
//     //       }
//     //     }
//     //   })
//     // }
//   ];
// }

type GameData = {
  player1Address: `0x${string}` | undefined,
  player2Address: `0x${string}` | undefined,
  gameId: string | undefined,
  liveViewers: number | undefined,
}

export default function Page() {
  const [games, setGames] = useState<GameData[]>([]);
  const { address } = useAccount()
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();
  const [errorFetchGames, setErrorFetchGames] = useState("");

  useEffect(() => {
    const load = async () => {
      const context = await sdk.context;
      setContext(context);
      console.log("Calling sdk.actions.ready()");
      sdk.actions.ready();
    }
    if (sdk && !isSDKLoaded) {
      console.log("Calling load");
      setIsSDKLoaded(true);
      load();
      return () => {
        sdk.removeAllListeners();
      };
    }
  }, [isSDKLoaded]);

  const getUserGames = useCallback(async () => {
    setErrorFetchGames("");
    const httpsProtocol = window.location.protocol === "https:" ? "https" : "http";
    const domain = process.env.NEXT_PUBLIC_WORKER_DOMAIN || "chess-worker.johnsgresham.workers.dev";
    // const domain = "localhost:8787";
    const url = `${httpsProtocol}://${domain}/user/games?address=${address}`;
    const response = await fetch(url, {
      method: "GET",
    });
    console.log("response:", response);
    const data: {
      games: GameData[]
    } = await response.json();
    console.log("data:", data);
    const games = data.games;
    if (!games) {
      console.error("No games in response");
      setErrorFetchGames("Unable to get user games");
      setGames([]);
      return;
    }
    setGames(games);
  }, [address]);

  useEffect(() => {
    if (address) {
      getUserGames();
    } else {
      setGames([]);
    }
  }, [address, getUserGames]);


  // Chess board background pattern with subtle blur
  const BG_OPACITY = 0.025;
  const bgChessBoardStyles = {
    backgroundImage: `
      conic-gradient(rgba(241, 241, 241, ${BG_OPACITY}) 0deg, 
      rgba(241, 241, 241, ${BG_OPACITY}) 90deg, 
      rgba(51, 51, 51, ${BG_OPACITY}) 90deg, 
      rgba(51, 51, 51, ${BG_OPACITY}) 180deg, 
      rgba(241, 241, 241, ${BG_OPACITY}) 180deg, 
      rgba(241, 241, 241, ${BG_OPACITY}) 270deg, 
      rgba(51, 51, 51, ${BG_OPACITY}) 270deg, 
      rgba(51, 51, 51, ${BG_OPACITY}) 360deg)`,
    backgroundSize: '100px 100px',
    backgroundRepeat: 'repeat',
  }
  return (
    <div className="flex flex-col gap-20 w-full items-center backdrop-blur-[3px]" style={bgChessBoardStyles}>

      {/* Main Content */}
      <div className="flex flex-col md:min-h-[500px] md:flex-row md:gap-14 w-full items-center space-y-6">

        {/* Devices image */}
        <div className="md:w-1/2">
          <Image src="/laptop-n-phone-based-chess-screenshot.png"
            alt="Based Chess iPhone screenshot" width={1300} height={400}
            className="md:pl-10 lg:pl-28" />
        </div>


        <div className="flex flex-col">
          <h1 className="text-4xl font-hand mb-6 text-center lg:text-left">Play Chess</h1>

          {/* Invite a friend button and dialog */}
          <NewGameSheet />

          {/* Features List */}
          <div className="w-full space-y-4 my-4">
            <div className="flex items-center gap-3">
              <span className="text-xl font-hand">🔒 Openly verifiable wins</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xl font-hand">⛓️ Save games onchain</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xl font-hand">💻 Opensource code</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xl font-hand">🏆 Winners get an NFT</span>
            </div>
          </div>
        </div>

      </div>
      {/* <div>
        <Button variant="link" className="text-white font-hand text-xl">
          &lt;How it works blog&gt;
        </Button>

        <div className="text-3xl font-hand mt-6">Coming soon</div>
      </div> */}

      {errorFetchGames && (
        <div className="flex flex-row gap-2 items-center justify-center text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <title>Error</title>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <span className="text-red-500">{errorFetchGames}</span>
        </div>
      )}

      <div className='flex flex-col '>
        {games.length > 0 && <div className="flex flex-row gap-2 items-center justify-center">
          <span>Games</span>
          <button
            type="button"
            onClick={() => {
              // Convert JSON object to string
              const jsonString = JSON.stringify(games, null, 2);
              // Create a blob with JSON content and MIME type
              const blob = new Blob([jsonString], { type: "application/json" });
              // Create a link element
              const link = document.createElement("a");
              // Set download attribute with a filename
              link.download = `games_data_${address}.json`;
              // Create a URL for the blob and set it as the href attribute
              link.href = URL.createObjectURL(blob);
              // Append link to the body
              document.body.appendChild(link);
              // Programmatically click the link to trigger the download
              link.click();
              // Remove the link after triggering the download
              document.body.removeChild(link);
            }}
            className="bg-transparent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <title>Download</title>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button></div>}
        {games.map((game) => (
          <div key={game.gameId} className="p-4 max-w-lg">
            <div className="border border-gray-300 rounded-lg p-4 gap-2">
              <a href={`/games/${game.gameId}`} className="text-lg font-semibold">Go to Game</a>
              {/* <p>Player 1: {DisplayAddress({ address: game.player1Address })}</p>
              <p>Player 2: {DisplayAddress({ address: game.player2Address })}</p> */}
              <div className='flex flex-row flex-wrap gap-2'>Player 1: <DisplayAddress address={game.player1Address} /></div>
              <div className='flex flex-row flex-wrap gap-2'>Player 2: <DisplayAddress address={game.player2Address} /></div>
              <p>Game: {game.gameId}</p>
              <div className="flex flex-row items-center gap-1">
                {game && <span>{game.liveViewers}</span>}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                  <title>Live Viewers</title>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


