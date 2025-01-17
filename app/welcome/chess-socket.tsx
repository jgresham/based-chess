"use client";
import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import type { ChessGame } from "../../../chess-worker/src/index";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import type { WsMessage } from "../../../chess-worker/src/index";

export function ChessSocket(props: { id: string }) {
  const wsRef = useRef<WebSocket | null>(null);
//   const [cursors, setCursors] = useState<Map<string, Session>>(new Map());
const [game, setGame] = useState(new Chess());
//   const [chessFEN, setChessFEN] = useState<string>('');
  const lastSentTimestamp = useRef(0);
  const [messageState, dispatchMessage] = useReducer(messageReducer, {
    in: "",
    out: "",
  });

//   useEffect(() => {
//     const fetchGame = async () => {
//       const res = await fetch(`http://localhost:8787/games/12345`);
//       console.log("res:", res);
//       const gameString = await res.json();
//       console.log("gameString:", gameString.game);
//       const newGame = new Chess();
//       newGame.load(gameString.game);
//       setChessFEN(newGame);
//       // setGame(game.load(gameString.game));
//     }
//     console.log("calling fetchGame");
//     fetchGame();
//   }, []);

  function startWebSocket() {
    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(
      `${wsProtocol}://localhost:8787/ws?id=${props.id}`,
    //   `${wsProtocol}://${process.env.REACT_APP_PUBLIC_WS_HOST}/ws?id=${props.id}`,
    );
    ws.onopen = () => {
    //   highlightOut();
      dispatchMessage({ type: "out", message: "get-cursors" });
      const message: WsMessage = { type: "get-cursors" };
      ws.send(JSON.stringify(message));
    };
    ws.onmessage = (message) => {
        console.log("ws onmessage:", message);
      const messageData: { game: string, type: string } = JSON.parse(message.data);
      switch (messageData.type) {
        case "move":
            setGame(() => {
            const newGame = new Chess();
            newGame.load(messageData.game);
            setGame(newGame);
            return newGame;
          });
          break;
        default:
          break;
      }
    };
    // ws.onclose = () => setCursors(new Map());
    return ws;
  }

  useEffect(() => {
    wsRef.current = startWebSocket();
    return () => wsRef.current?.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.id]);

  function sendMessage() {
    highlightOut();
    dispatchMessage({ type: "out", message: "message" });
    wsRef.current?.send(
      JSON.stringify({ type: "message", data: "Ping" } satisfies WsMessage),
    );
  }

  const onDrop = (sourceSquare: string, targetSquare: string) => {

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
    setGame(newGame);

    // update server
    wsRef.current?.send(
        JSON.stringify({ type: "move", data: {
            from: sourceSquare,
            to: targetSquare,
            promotion: "q", // always promote to a queen for example simplicity
          } }),
      );
    
    return true;
  }

  return (
    <>
      <Chessboard position={game.fen()} onPieceDrop={onDrop}/>
    </>
  );
}

type MessageState = { in: string; out: string };
type MessageAction = { type: "in" | "out"; message: string };
function messageReducer(state: MessageState, action: MessageAction) {
  switch (action.type) {
    case "in":
      return { ...state, in: action.message };
    case "out":
      return { ...state, out: action.message };
    default:
      return state;
  }
}