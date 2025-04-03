"use client";

import { useAccount } from "wagmi";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { sdk, type Context } from "@farcaster/frame-sdk";
import NewGameSheet from "../components/NewGameSheet";
import { TriangleAlert, Download } from "lucide-react";
import GameSummary from "../components/GameSummary";
import { Separator } from "@/components/ui/separator";
import { useSetFarcasterContext } from "../components/hooks/useFarcasterContext";
import type { FarcasterUser } from "../lib/neynar.server";

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

export type GameData = {
	player1Address: `0x${string}`;
	player2Address: `0x${string}`;
	gameId: string;
	liveViewers: number | undefined;
	contractGameId: number;
	createdTimestamp: number;
	pgn: string;
	player1FarcasterData?: FarcasterUser;
	player2FarcasterData?: FarcasterUser;
};

export default function Page() {
	const [games, setGames] = useState<GameData[]>([]);
	const { address } = useAccount();
	const [isSDKLoaded, setIsSDKLoaded] = useState(false);
	const [context, setContext] = useState<Context.FrameContext>();
	const [errorFetchGames, setErrorFetchGames] = useState("");
	const { mutate: setFarcasterContext } = useSetFarcasterContext();

	useEffect(() => {
		const load = async () => {
			const context = await sdk.context;
			setContext(context);
			if (context) {
				setFarcasterContext(context);
				try {
					console.log("Calling sdk.actions.ready()");
					sdk.actions.ready();
					sdk.actions.addFrame();
				} catch (error) {
					console.error("Error frame ready or calling add frame", error);
				}
			}
		};
		if (sdk && !isSDKLoaded) {
			console.log("Calling load");
			setIsSDKLoaded(true);
			load();
			return () => {
				sdk.removeAllListeners();
			};
		}
	}, [isSDKLoaded, setFarcasterContext]);

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
			games: GameData[];
		} = await response.json();
		console.log("data:", data);
		const games = data.games;
		if (!games) {
			console.error("No games in response");
			setErrorFetchGames("Unable to get user games");
			setGames([]);
			return;
		}
		console.log("games", games);
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
		backgroundSize: "100px 100px",
		backgroundRepeat: "repeat",
	};
	return (
		<div
			className="flex flex-col gap-6 md:gap-20 w-full items-center backdrop-blur-[3px]"
			style={bgChessBoardStyles}
		>
			{/* Main Content */}
			<div className="flex flex-col md:min-h-[500px] md:flex-row md:gap-14 w-full items-center space-y-6">
				{/* Devices image */}
				<div className="md:w-1/2">
					<Image
						src="/screenshot.png"
						alt="Based Chess iPhone screenshot"
						width={3000}
						height={1957}
						className="md:pl-10 lg:pl-28"
						priority
					/>
				</div>

				<div className="flex flex-col">
					<h1 className="text-4xl font-hand mb-6 text-center lg:text-left">Play Chess</h1>

					{/* Invite a friend button and dialog */}
					<NewGameSheet />

					{/* Features List */}
					<div className="w-full space-y-4 my-4">
						<div className="flex items-center gap-3">
							<span className="text-lg md:text-xl font-hand">🔒 Openly verifiable wins</span>
						</div>

						<div className="flex items-center gap-3">
							<span className="text-lg md:text-xl font-hand">⛓️ Save games onchain</span>
						</div>

						<div className="flex items-center gap-3">
							<span className="text-lg md:text-xl font-hand">💻 Opensource code</span>
						</div>

						<div className="flex items-center gap-3">
							<span className="text-lg md:text-xl font-hand">🏆 Mint a GameWin NFT</span>
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
					<TriangleAlert />
					<span className="text-red-500">{errorFetchGames}</span>
				</div>
			)}

			<div className="flex flex-col ">
				{games.length > 0 && (
					<div className="flex flex-row gap-2 items-center justify-center">
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
							<Download size={16} />
						</button>
					</div>
				)}
				{games.map((game) => (
					<div key={game.gameId}>
						<GameSummary game={game} loggedInAddress={address} />
						<Separator className="" />
					</div>
				))}
			</div>
		</div>
	);
}
