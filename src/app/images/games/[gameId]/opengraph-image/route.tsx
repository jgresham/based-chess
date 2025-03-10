import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { Chess } from "chess.js";

const WIDTH = 1200;
const HEIGHT = 630;

// export default async function handler(request: NextRequest, { params }: { params: { gameId: string } }) {
export async function GET(request: NextRequest, { params }: { params: { gameId: string } }) {
  console.log("IMAGES request.url", request.url);
  const { gameId } = await params;
  // get the cloudflaredurable object using gameId to get the game details
  console.log("getting game durable object");
  const cf = await getCloudflareContext();
  const durObjId = await cf.env.CHESS_GAME.idFromName(gameId);
  const durObjStub = cf.env.CHESS_GAME.get(durObjId);
  // const gameData = await durObjStub.getUserFacingGameData();
  const gameData = {
    player1Address: '0x7D20fd2BD3D13B03571A36568cfCc2A4EB3c749e',
    player2Address: '0x2a99EC82d658F7a77DdEbFd83D0f8F591769cB64',
    gameId: '6VQ3KF',
    liveViewers: 1,
    latestPlayer1Signature: '0xca7507bf6533a781246ee647c4c9e2063370153fbd11c3aaa0e8365bcdbd64137478ccbf26f0806f1771ab2d74863bf8d8db1a6a2cc51046e1bfe388062d75fc1c',
    latestPlayer1Message: '[White "0x7D20fd2BD3D13B03571A36568cfCc2A4EB3c749e"]\n' +
      '[Black "0x2a99EC82d658F7a77DdEbFd83D0f8F591769cB64"]\n' +
      '[Event "12,6VQ3KF"]\n' +
      '[Site "Based Chess"]\n' +
      '[Date "2025-03-06T22:30:37.454Z"]\n' +
      '\n' +
      '1. e3 f6 2. Nc3 g5 3. Qh5#',
    latestPlayer2Signature: '0x581fcce02f1caefb8c324f51d1a62e815ad19fce4fc9ea1ec00d1b436711f85f072cafaebe18ffbd201f72be030466599dc9af2e0edb04da47a52f9ccefeb8a71c',
    latestPlayer2Message: '[White "0x7D20fd2BD3D13B03571A36568cfCc2A4EB3c749e"]\n' +
      '[Black "0x2a99EC82d658F7a77DdEbFd83D0f8F591769cB64"]\n' +
      '[Event "12,6VQ3KF"]\n' +
      '[Site "Based Chess"]\n' +
      '[Date "2025-03-06T22:30:37.454Z"]\n' +
      '\n' +
      '1. e3 f6 2. Nc3 g5',
    createdTimestamp: 1741300237454,
    contractGameId: 12,
    pgn: '[White "0x7D20fd2BD3D13B03571A36568cfCc2A4EB3c749e"]\n' +
      '[Black "0x2a99EC82d658F7a77DdEbFd83D0f8F591769cB64"]\n' +
      '[Event "12,6VQ3KF"]\n' +
      '[Site "Based Chess"]\n' +
      '[Date "2025-03-06T22:30:37.454Z"]\n' +
      '\n' +
      '1. e3 f6 2. Nc3 g5 3. Qh5#'
  }
  console.log("gameData", gameData);
  if (!gameData || !gameData.player1Address || !gameData.player2Address) {
    console.log("Game not found", { gameId });
    return new Response("Game not found", { status: 404 });
  }
  console.log("loading chess game");
  const chessGame = new Chess();
  chessGame.loadPgn(gameData.pgn || "");

  // Determine game status
  const isGameOver = chessGame.isGameOver();
  const isDraw = chessGame.isDraw();
  let statusText = "Game in Progress";
  let statusColor = "bg-blue-100 text-blue-800";

  if (isGameOver) {
    if (isDraw) {
      statusText = "Game Ended in Draw";
      statusColor = "bg-yellow-100 text-yellow-800";
    } else {
      const winnerAddress = chessGame.turn() === 'b' ?
        gameData.player1Address : gameData.player2Address;
      statusText = `${winnerAddress.slice(0, 6)}...${winnerAddress.slice(-4)} Wins!`;
      statusColor = "bg-green-100 text-green-800";
    }
  }

  return new ImageResponse((
    // <div tw="h-full w-full flex flex-col items-center justify-center">
    //   <h1>Game {gameId} </h1>
    //   <p>{chessGame.moves()} </p>
    //   < p > {chessGame.isGameOver() ? "Game over" : "In Progress"} </p>
    //   < p > Game data: {JSON.stringify(gameData)} </p>
    // </div>
    <div tw="w-[1200px] h-[630px] bg-gray-800 flex flex-col font-sans text-white">
      {/* <!-- Header --> */}
      <div tw="h-24 flex items-center justify-between px-8">
        <div tw="flex flex-row items-center gap-8">
          {/* <!-- Replace with your actual logo path --> */}
          <img src="https://basedchess.xyz/based-chess-logo-200.jpg" alt="Company Logo" tw="h-16 mr-10" />
          <h1 tw="text-3xl font-bold text-white">BasedChess</h1>
        </div>
      </div>

      {/* <!-- Main Content --> */}
      <div tw="flex-1 flex flex-col items-center justify-center p-8 gap-8">
        {/* <!-- Game Status --> */}
        <div tw="flex flex-col rounded-lg shadow-lg p-6 w-full max-w-2xl">
          <h2 tw="text-2xl font-bold text-gray-200 mb-6 text-center">Game Summary</h2>

          {/* <!-- Players --> */}
          <div tw="flex justify-between items-center mb-6">
            <div tw="flex flex-col items-center">
              <span tw="text-lg font-semibold text-gray-300">White</span>
              <span tw="text-xl text-gray-200 mt-2">Player1</span>
            </div>
            <div tw="text-2xl font-bold text-gray-300">vs</div>
            <div tw="flex flex-col items-center">
              <span tw="text-lg font-semibold text-gray-300">Black</span>
              <span tw="text-xl text-gray-200 mt-2">Player2</span>
            </div>
          </div>

          {/* Game Status */}
          <div tw="mt-6 text-center flex justify-center">
            <div tw={`flex ${statusColor} px-4 py-2 rounded-lg inline-block`}>
              <span tw="text-lg font-medium">{statusText}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  ), {
    width: WIDTH,
    height: HEIGHT,
    // debug: true
  });
}
