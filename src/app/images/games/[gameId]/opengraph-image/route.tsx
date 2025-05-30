import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Chess } from "chess.js";
import { getFarcasterUserByAddress } from "../../../../../lib/neynar.server";

const truncateAddress = (address: `0x${string}` | undefined) => {
	if (!address) {
		return "";
	}
	return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
};

// 1.5 ratio?
// 478 x 320 on web tool
export const WIDTH = 900;
export const HEIGHT = 600;

// export default async function handler(request: NextRequest, { params }: { params: { gameId: string } }) {
export async function GET(request: NextRequest, { params }: { params: { gameId: string } }) {
	console.log("IMAGES request.url", request.url);
	const { gameId } = await params;
	// get the cloudflaredurable object using gameId to get the game details
	console.log("getting game durable object");
	const cf = await getCloudflareContext();
	let gameData = null;
	if (process.env.NODE_ENV === "development") {
		gameData = {
			player1Address: "0x7D20fd2BD3D13B03571A36568cfCc2A4EB3c749e",
			player2Address: "0x2a99EC82d658F7a77DdEbFd83D0f8F591769cB64",
			gameId: "6VQ3KF",
			liveViewers: 1,
			latestPlayer1Signature:
				"0xca7507bf6533a781246ee647c4c9e2063370153fbd11c3aaa0e8365bcdbd64137478ccbf26f0806f1771ab2d74863bf8d8db1a6a2cc51046e1bfe388062d75fc1c",
			latestPlayer1Message:
				'[White "0x7D20fd2BD3D13B03571A36568cfCc2A4EB3c749e"]\n' +
				'[Black "0x2a99EC82d658F7a77DdEbFd83D0f8F591769cB64"]\n' +
				'[Event "12,6VQ3KF"]\n' +
				'[Site "Based Chess"]\n' +
				'[Date "2025-03-06T22:30:37.454Z"]\n' +
				"\n" +
				"1. e3 f6 2. Nc3 g5 3. Qh5#",
			latestPlayer2Signature:
				"0x581fcce02f1caefb8c324f51d1a62e815ad19fce4fc9ea1ec00d1b436711f85f072cafaebe18ffbd201f72be030466599dc9af2e0edb04da47a52f9ccefeb8a71c",
			latestPlayer2Message:
				'[White "0x7D20fd2BD3D13B03571A36568cfCc2A4EB3c749e"]\n' +
				'[Black "0x2a99EC82d658F7a77DdEbFd83D0f8F591769cB64"]\n' +
				'[Event "12,6VQ3KF"]\n' +
				'[Site "Based Chess"]\n' +
				'[Date "2025-03-06T22:30:37.454Z"]\n' +
				"\n" +
				"1. e3 f6 2. Nc3 g5",
			createdTimestamp: 1741300237454,
			contractGameId: 12,
			pgn:
				'[White "0x7D20fd2BD3D13B03571A36568cfCc2A4EB3c749e"]\n' +
				'[Black "0x2a99EC82d658F7a77DdEbFd83D0f8F591769cB64"]\n' +
				'[Event "12,6VQ3KF"]\n' +
				'[Site "Based Chess"]\n' +
				'[Date "2025-03-06T22:30:37.454Z"]\n' +
				"\n" +
				// '1. e3 f6 2. Nc3 g5 3. Qh5#'
				"1. e3 f6 2. Nc3 g5 3. Qh5#",
		};
	} else {
		const durObjId = await cf.env.CHESS_GAME.idFromName(gameId);
		const durObjStub = cf.env.CHESS_GAME.get(durObjId);
		gameData = await durObjStub.getUserFacingGameData();
	}

	console.log("gameData", gameData);
	if (!gameData || !gameData.player1Address || !gameData.player2Address) {
		console.log("Game not found", { gameId });
		return new Response("Game not found", { status: 404 });
	}
	console.log("loading chess game");
	const chessGame = new Chess();
	chessGame.loadPgn(gameData.pgn || "");
	console.log("chessGame moves", chessGame.history());

	// Determine game status
	const isGameOver = chessGame.isGameOver();
	const isDraw = chessGame.isDraw();

	const [player1FarcasterUser, player2FarcasterUser] = await Promise.all([
		getFarcasterUserByAddress(gameData.player1Address),
		getFarcasterUserByAddress(gameData.player2Address),
	]);

	const player1DisplayName =
		player1FarcasterUser?.display_name?.slice(0, 18) ||
		truncateAddress(gameData.player1Address as `0x${string} `);
	const player2DisplayName =
		player2FarcasterUser?.display_name?.slice(0, 18) ||
		truncateAddress(gameData.player2Address as `0x${string} `);
	let statusText = "Game in Progress";
	let statusColor = "bg-blue-100 text-blue-800";

	if (isGameOver) {
		if (isDraw) {
			statusText = "Game Ended in Draw";
			statusColor = "bg-yellow-100 text-yellow-800";
		} else {
			const winner = chessGame.turn() === "b" ? player1DisplayName : player2DisplayName;
			statusText = `${winner} Won`;
			statusColor = "bg-green-100 text-green-800";
		}
	}
	statusText = `${statusText} at ${chessGame.history().length / 2} moves`;

	return new ImageResponse(
		// <div tw="h-full w-full flex flex-col items-center justify-center">
		//   <h1>Game {gameId} </h1>
		//   <p>{chessGame.moves()} </p>
		//   < p > {chessGame.isGameOver() ? "Game over" : "In Progress"} </p>
		//   < p > Game data: {JSON.stringify(gameData)} </p>
		// </div>
		<div
			tw="w-[900px] h-[600px] flex flex-col font-sans text-white"
			style={{
				background:
					"radial-gradient(circle at top left, #1e3a8a, transparent), radial-gradient(circle at bottom right, #1e293c, transparent), linear-gradient(to bottom right, #121212, #1e293c)",
			}}
		>
			{/* <!-- Header --> */}
			<div tw="h-38 flex items-center justify-between px-8 pt-24">
				<div tw="flex flex-row items-center gap-8">
					{/* <!-- Replace with your actual logo path --> */}
					<img
						src="https://basedchess.xyz/based-chess-logo-200.jpg"
						width={96}
						height={96}
						alt="Company Logo"
						tw="h-24 mr-10"
					/>
					<h1 tw="text-5xl font-bold text-white">Based Chess</h1>
				</div>
			</div>

			{/* cant useState in image gen for some reason? */}
			{/* <Chessboard
        position={chessGame.fen()}
        onPieceDrop={() => {
          console.log("onPieceDrop");
          return true;
        }}
      /> */}

			{/* {`p1:${ JSON.stringify(player1FarcasterUser) } `}
      {`p2:${ JSON.stringify(player2FarcasterUser) } `} */}

			{/* <!-- Main Content --> */}
			<div tw="flex-1 flex flex-col items-center justify-center p-8 gap-10">
				{/* <!-- Game Status --> */}
				<div tw="flex flex-col rounded-lg p-6 w-full">
					{/* <h2 tw="text-2xl font-bold text-gray-200 mb-6 text-center">Game Summary</h2> */}

					{/* <!-- Players --> */}
					<div tw="flex justify-between items-center mb-8">
						<div tw="flex flex-col items-center">
							{/* <span tw="text-lg font-semibold text-gray-300">White</span> */}
							{player1FarcasterUser?.pfp_url ? (
								<img
									src={player1FarcasterUser.pfp_url}
									alt="Player 1 Profile img"
									tw="h-32"
									width={128}
									height={128}
								/>
							) : (
								<div tw="h-32 w-32 bg-gray-700 rounded-full flex items-center justify-center">
									{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
									<svg
										width="80"
										height="80"
										viewBox="0 0 24 24"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
											fill="#A0AEC0"
										/>
									</svg>
								</div>
							)}
							<span tw="text-4xl text-gray-200 mt-3">{player1DisplayName}</span>
						</div>
						<div tw="text-5xl font-bold text-gray-300">vs</div>
						<div tw="flex flex-col items-center">
							{/* <span tw="text-lg font-semibold text-gray-300">Black</span> */}
							{player2FarcasterUser?.pfp_url ? (
								<img
									src={player2FarcasterUser.pfp_url}
									alt="Player 2 Profile img"
									tw="h-32"
									width={128}
									height={128}
								/>
							) : (
								<div tw="h-32 w-32 bg-gray-700 rounded-full flex items-center justify-center">
									{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
									<svg
										width="80"
										height="80"
										viewBox="0 0 24 24"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
											fill="#A0AEC0"
										/>
									</svg>
								</div>
							)}
							<span tw="text-4xl text-gray-200 mt-3">{player2DisplayName}</span>
						</div>
					</div>

					{/* Game Status */}
					<div tw="mt-8 text-center flex justify-center">
						<div tw={`flex ${statusColor} px-8 py-4 rounded-lg inline-block`}>
							<span tw="text-3xl font-medium">{statusText}</span>
						</div>
					</div>
				</div>
			</div>
		</div>,
		{
			width: WIDTH,
			height: HEIGHT,
			// debug: true
		},
	);
}
