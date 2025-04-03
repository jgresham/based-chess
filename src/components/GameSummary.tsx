import { useEffect, useState } from "react";
import type { GameData } from "../app/page";
import DisplayAddress from "./util/DisplayAddress";
import { Chess } from "chess.js";
import { getAddressOfWinner, isMyTurn } from "../lib/chessjsUtils";
import Link from "next/link";
import { buttonVariants } from "./ui/button";
import { timeSince } from "../lib/time";
export default function GameSummary({
	game,
	loggedInAddress,
}: { game: GameData; loggedInAddress: `0x${string}` | undefined }) {
	const [chessJsGame, setChessJsGame] = useState<Chess | null>(null);
	const [winnerAddress, setWinnerAddress] = useState<`0x${string}` | null>(null);

	useEffect(() => {
		const newGame = new Chess();
		newGame.loadPgn(game.pgn);
		setChessJsGame(newGame);

		const winnerAddress = getAddressOfWinner({
			game: newGame,
			player1Address: game.player1Address,
			player2Address: game.player2Address,
		});
		setWinnerAddress(winnerAddress);
	}, [game]);

	const otherPlayer =
		game.player1Address === loggedInAddress ? game.player2Address : game.player1Address;
	const otherPlayerFarcasterData =
		game.player1Address === otherPlayer ? game.player1FarcasterData : game.player2FarcasterData;

	return (
		<div className="max-w-xxl flex flex-row flex-wrap items-center gap-4 rounded-lg p-4">
			{/* <p>Player 1: {DisplayAddress({ address: game.player1Address })}</p>
              <p>Player 2: {DisplayAddress({ address: game.player2Address })}</p> */}
			<div className="flex flex-row items-center gap-1">
				{otherPlayer && (
					<DisplayAddress address={otherPlayer} farcasterData={otherPlayerFarcasterData} />
				)}
				{/* <div className="flex flex-row flex-wrap gap-2">
				Player 1: <DisplayAddress address={game.player1Address} />
			</div>
			<div className="flex flex-row flex-wrap gap-2">
				Player 2: <DisplayAddress address={game.player2Address} />
			</div> */}

				<p className="text-xs text-muted-foreground">· {game.gameId}</p>
				<p className="text-xs text-muted-foreground">· {timeSince(game.createdTimestamp)}</p>
			</div>
			<div className="flex flex-row items-center justify-between w-full">
				<p className={"min-w-[80px]"}>
					{winnerAddress ? (
						<>{winnerAddress === loggedInAddress ? "🏆 Win" : "😥 Loss"}</>
					) : (
						`🕹️ In Progress ${
							isMyTurn({
								game: chessJsGame,
								address: loggedInAddress,
								player1Address: game.player1Address,
								player2Address: game.player2Address,
							})
								? " - Your Turn!"
								: ""
						}`
					)}
				</p>
				<Link
					href={`/games/${game.gameId}`}
					// className="text-lg font-semibold"
					className={`inline-block ${buttonVariants({ variant: `${chessJsGame?.isGameOver() ? "outline" : "default"}` })} w-fit`}
				>
					{`${chessJsGame?.isGameOver() ? "View Game" : "Play"}`}
				</Link>
			</div>

			{/* <TooltipProvider>
				<Tooltip side="bottom">
					<TooltipTrigger>
						<div className="flex flex-row items-center gap-1 group relative text-xs">
							{game && <span>{game.liveViewers}</span>}
							<Eye size={16} />
						</div>
					</TooltipTrigger>
					<TooltipContent>
						<p>Viewers</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider> */}
		</div>
	);
}
