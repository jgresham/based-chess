import type { Chess } from "chess.js";

/**
 * Returns the winner address if the game is over.
 * Assumes player1 is white, and player2 is black.
 */
export const getAddressOfWinner = ({
  game,
  player1Address,
  player2Address,
}: {
  game: Chess;
  player1Address?: `0x${string}`;
  player2Address?: `0x${string}`;
}) => {
  if (game.isGameOver() === true && player1Address && player2Address) {
    if (game.turn() === "b") {
      return player1Address;
    }
    if (game.turn() === "w") {
      return player2Address;
    }
  }
  return null;
};

/**
 * Returns false if the game is over
 * @param param0 
 * @returns 
 */
export const isMyTurn = ({
  game,
  address,
  player1Address,
  player2Address,
}: {
  game: Chess | null;
  address: `0x${string} | undefined`;
  player1Address?: `0x${string}`;
  player2Address?: `0x${string}`;
}) => {
  if (game?.isGameOver() === false && address && player1Address && player2Address) {
    if (game.turn() === "w") {
      return player1Address === address;
    }
    if (game.turn() === "b") {
      return player2Address === address;
    }
  }
  return false;
};