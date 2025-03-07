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
  const gameData = await durObjStub.getUserFacingGameData();
  console.log("gameData", gameData);
  // const gameData = {
  //   player1Address: '0x7D20fd2BD3D13B03571A36568cfCc2A4EB3c749e',
  //   player2Address: '0x2a99EC82d658F7a77DdEbFd83D0f8F591769cB64',
  //   gameId: '6VQ3KF',
  //   liveViewers: 1,
  //   latestPlayer1Signature: '0xca7507bf6533a781246ee647c4c9e2063370153fbd11c3aaa0e8365bcdbd64137478ccbf26f0806f1771ab2d74863bf8d8db1a6a2cc51046e1bfe388062d75fc1c',
  //   latestPlayer1Message: '[White "0x7D20fd2BD3D13B03571A36568cfCc2A4EB3c749e"]\n' +
  //     '[Black "0x2a99EC82d658F7a77DdEbFd83D0f8F591769cB64"]\n' +
  //     '[Event "12,6VQ3KF"]\n' +
  //     '[Site "Based Chess"]\n' +
  //     '[Date "2025-03-06T22:30:37.454Z"]\n' +
  //     '\n' +
  //     '1. e3 f6 2. Nc3 g5 3. Qh5#',
  //   latestPlayer2Signature: '0x581fcce02f1caefb8c324f51d1a62e815ad19fce4fc9ea1ec00d1b436711f85f072cafaebe18ffbd201f72be030466599dc9af2e0edb04da47a52f9ccefeb8a71c',
  //   latestPlayer2Message: '[White "0x7D20fd2BD3D13B03571A36568cfCc2A4EB3c749e"]\n' +
  //     '[Black "0x2a99EC82d658F7a77DdEbFd83D0f8F591769cB64"]\n' +
  //     '[Event "12,6VQ3KF"]\n' +
  //     '[Site "Based Chess"]\n' +
  //     '[Date "2025-03-06T22:30:37.454Z"]\n' +
  //     '\n' +
  //     '1. e3 f6 2. Nc3 g5',
  //   createdTimestamp: 1741300237454,
  //   contractGameId: 12,
  //   pgn: '[White "0x7D20fd2BD3D13B03571A36568cfCc2A4EB3c749e"]\n' +
  //     '[Black "0x2a99EC82d658F7a77DdEbFd83D0f8F591769cB64"]\n' +
  //     '[Event "12,6VQ3KF"]\n' +
  //     '[Site "Based Chess"]\n' +
  //     '[Date "2025-03-06T22:30:37.454Z"]\n' +
  //     '\n' +
  //     '1. e3 f6 2. Nc3 g5 3. Qh5#'
  // }
  if (!gameData || !gameData.player1Address || !gameData.player2Address) {
    console.log("Game not found", { gameId });
    return new Response("Game not found", { status: 404 });
  }
  console.log("loading chess game");
  const chessGame = new Chess();
  chessGame.loadPgn(gameData.pgn || "");


  return new ImageResponse((
    <div tw="h-full w-full flex flex-col items-center justify-center">
      <h1>Game {gameId} </h1>
      <p>{chessGame.moves()} </p>
      < p > {chessGame.isGameOver() ? "Game over" : "In Progress"} </p>
      < p > Game data: {JSON.stringify(gameData)} </p>
    </div>
  ), {
    width: WIDTH,
    height: HEIGHT,
    debug: true
  });
}
