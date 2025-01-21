"use client";
import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import type { ChessGame } from "../../../../chess-worker/src/index";
import { Chessboard } from "react-chessboard";
import { Chess, Move } from "chess.js";
import type { WsMessage } from "../../../../chess-worker/src/index";
import { signMessage, verifyMessage } from '@wagmi/core'
import { useAccount } from 'wagmi'
import { config } from '../../wagmiconfig'
import { useParams } from "react-router";


export default function Game() {
  console.log("Game:");
  const wsRef = useRef<WebSocket | null>(null);
  const [game, setGame] = useState<Chess | undefined>();
  const { address } = useAccount()
  const [awaitSigningMove, setAwaitSigningMove] = useState(false);
  const params = useParams();

  const updateGame = (game: Chess) => {
    const newGame = new Chess();
    newGame.loadPgn(game.pgn());
    console.log("game received:", newGame.ascii());
    console.log("game received fen:", newGame.fen());
    console.log("game received pgn:", newGame.pgn());
    setGame(newGame);
  }

  function startWebSocket() {
    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const domain = "chess-worker.johnsgresham.workers.dev";
    // const domain = "localhost:8787";
    const ws = new WebSocket(
      `${wsProtocol}://${domain}/ws?gameId=${params.gameId}`,
      //   `${wsProtocol}://localhost:8787/ws?id=${props.id}`,
      //   `${wsProtocol}://${process.env.REACT_APP_PUBLIC_WS_HOST}/ws?id=${props.id}`,
    );
    ws.onopen = () => {

      const message: WsMessage = { type: "get-game", data: "" };
      ws.send(JSON.stringify(message));
    };
    ws.onmessage = async (message) => {
      const messageData: { data: any, type: string } = JSON.parse(message.data);
      console.log("ws onmessage:", messageData);
      switch (messageData.type) {
        case "move":
          if (!game) {
            console.error("game not initialized");
            return;
          }
          // validate move
          const move = game.move(messageData.data);
          console.log("move received:", move);

          // illegal move
          // todo: handle illegal move
          if (move === null) {
            console.error("illegal move: ", messageData);
            return;
          }

          // update game
          updateGame(game);
          break;
        case "game":
          const newGame = new Chess();
          newGame.loadPgn(messageData.data);
          updateGame(newGame);
          break;
        default:
          break;
      }
    };
    // ws.onclose = () => setCursors(new Map());
    return ws;
  }

  useEffect(() => {
    console.log("params", params);
    wsRef.current = startWebSocket();
    return () => wsRef.current?.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signMove = async (move: { from: string, to: string, promotion: string }, moveMove: Move) => {
    if (!address) {
      console.error("no address");
      return;
    }
    // sign move
    const message = JSON.stringify(moveMove.lan)
    const signature = await signMessage(config, {
      message
    })
    console.log("user move signature:", signature);

    const verified = await verifyMessage(config, {
      address,
      message,
      signature,
    })
    console.log("user move signature verified:", verified);

    setAwaitSigningMove(false);
    // update server
    wsRef.current?.send(
      JSON.stringify({
        type: "move", data: { ...move, signature, message, address }
      }),
    );
  }

  const onDrop = (sourceSquare: string, targetSquare: string) => {
    console.log("onDrop game:", game, sourceSquare, targetSquare);
    if (!game) {
      console.error("game not initialized");
      return false;
    }
    if (awaitSigningMove) {
      console.error("awaiting previously signed move");
      return false;
    }
    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // always promote to a queen for example simplicity
    });
    console.log("move:", move);

    // illegal move
    if (move === null) return false;

    // update the game state
    const newGame = new Chess();
    newGame.load(move.after);
    newGame.loadPgn(game.pgn());
    setGame(newGame);

    setAwaitSigningMove(true);
    signMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // always promote to a queen for example simplicity
    }, move);

    return true;
  }

  return (
    <>
      <div className="flex-1 w-full overflow-hidden" style={{ containerType: "size" }}>
        <div style={{ aspectRatio: "1 / 1", width: "100cqmin", margin: "auto" }}>
          {game && <Chessboard position={game.fen()} onPieceDrop={onDrop} />}
          {/* Collapsible sidebar on the right of the chessboard */}
          <div id="rightSidebar" className="fixed top-0 right-0 h-full w-1/4 border-l border-gray-200">
            {game && <div>Pgn: {game.pgn()}</div>}
            {game && <div>Fen: {game.fen()}</div>}
            {game && <div>Ascii: {game.ascii()}</div>}
            {game && <div>History: {game.history()}</div>}
            {game && <div>Moves made: {game.history().length}</div>}
          </div>
        </div>
      </div>
      <div>
        <button type="button" onClick={() => {
          wsRef.current?.send(
            JSON.stringify({ type: "reset-game", data: {} }),
          )
        }}>Reset Game</button>
      </div>
    </>
  );
}

