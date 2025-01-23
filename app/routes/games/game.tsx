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
import type { BoardOrientation } from "react-chessboard/dist/chessboard/types";
import { truncateAddress } from "../home";
import { useInterval } from "../../useInterval";


export default function Game() {
  const wsRef = useRef<WebSocket | null>(null);
  const [game, setGame] = useState<Chess | undefined>();
  const { address } = useAccount()
  const [awaitSigningMove, setAwaitSigningMove] = useState(false);
  const [boardOrientation, setBoardOrientation] = useState<BoardOrientation>("white");
  const params = useParams();
  const [player1Address, setPlayer1Address] = useState("");
  const [player2Address, setPlayer2Address] = useState("");
  const [liveViewers, setLiveViewers] = useState<number>();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (isVisible) {
      console.log("page visibility changed and is visible")
      if (wsRef.current === null
        || wsRef.current.readyState === WebSocket.CLOSED
        || wsRef.current.readyState !== WebSocket.CLOSING) {
        console.log("websocket is closed or closing. starting websocket")
        wsRef.current = startWebSocket();
      }
    } else {
      console.log("page visibility changed and is not visible")
    }
    return () => wsRef.current?.close();
  }, [isVisible]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    console.log("useEffect game:", game);
    if (game?.isGameOver()) {
      console.log("game is over");
    }
  }, [game]);

  useEffect(() => {
    // Assuming player1Address and player2Address are defined elsewhere in the component
    if (address === player1Address) {
      setBoardOrientation("white");
    } else if (address === player2Address) {
      setBoardOrientation("black");
    }
  }, [address, player1Address, player2Address]);

  const updateGame = (game: Chess) => {
    const newGame = new Chess();
    newGame.loadPgn(game.pgn());
    console.log("game received:", newGame.ascii());
    console.log("game received fen:", newGame.fen());
    console.log("game received pgn:", newGame.pgn());
    setGame(newGame);
  }

  const onMoveRecieved = (messageData: { data: any, type: string }) => {
    // using previous state is required because accessing game within the onMessage callback
    // results in a stale copy of game at the time the callback is registered (undefined)
    setGame(prevGame => {
      if (!prevGame) {
        console.error("game not initialized");
        return;
      }
      console.log("onMoveRecieved prevGame, messageData:", prevGame, messageData);
      // validate move
      try {
        const move = prevGame.move(messageData.data);
        console.log("move received:", move);
      } catch (error) {
        // illegal move (this gets called multiple times in local dev. ignore)
        console.error("error invalid move:", error);
        return prevGame;
      }

      // update game
      const newGame = new Chess();
      newGame.loadPgn(prevGame.pgn());
      return newGame;
    })
  }

  const startWebSocket = () => {
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
    ws.onmessage = async (message: MessageEvent) => {
      const messageData: { data: any, type: string } = JSON.parse(message.data);
      console.log("ws onmessage:", messageData, game);
      switch (messageData.type) {
        case "move":
          onMoveRecieved(messageData);
          return;
        case "game":
          const newGame = new Chess();
          newGame.loadPgn(messageData.data.pgn);
          updateGame(newGame);
          // only needed first time (optimize later)
          if (messageData.data.player1Address && messageData.data.player1Address !== player1Address) {
            setPlayer1Address(messageData.data.player1Address);
          }
          if (messageData.data.player2Address && messageData.data.player2Address !== player2Address) {
            setPlayer2Address(messageData.data.player2Address);
          }
          if (messageData.data.liveViewers) {
            setLiveViewers(messageData.data.liveViewers);
          }
          break;
        case "live-viewers":
          console.log("live-viewers:", messageData.data.liveViewers);
          setLiveViewers(messageData.data.liveViewers);
          break;
        default:
          break;
      }
    };
    ws.onclose = () => {
      console.log("websocket closed");
      wsRef.current = null;
    };
    return ws;
  }

  // useEffect(() => {
  //   wsRef.current = startWebSocket();
  //   return () => wsRef.current?.close();
  //   // biome-disable-next-line react-hooks/exhaustive-deps
  // }, []);

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

  function onDrop(sourceSquare: string, targetSquare: string, piece: string) {
    console.log("onDrop game:", game, sourceSquare, targetSquare, piece);
    if (!game) {
      console.error("game not initialized");
      return false;
    }
    if (awaitSigningMove) {
      console.error("awaiting previously signed move");
      return false;
    }
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // always promote to a queen for example simplicity
      });
      console.log("move:", move);
      // check if the piece is of the correct player
      if (move.color === 'w' && address !== player1Address) {
        console.error("illegal move: white piece moved by black player");
        game.undo();
        return false;
      }
      if (move.color === 'b' && address !== player2Address) {
        console.error("illegal move: black piece moved by white player");
        game.undo();
        return false;
      }

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
    } catch (error) {
      // illegal move
      console.error("error invalid move:", error);
      return false;
    }
  }

  useInterval(() => {
    console.log("Health check websocket status");
    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED || wsRef.current.readyState === WebSocket.CLOSING) {
      console.log("websocket is closed or closing. starting websocket")
      wsRef.current = startWebSocket();
    }
    wsRef.current?.send(
      JSON.stringify({ type: "live-viewers", data: {} }),
    )
  }, 30000);

  return (
    <>
      {/* icons showing the number of live views and a share url button */}
      <div className="w-full flex flex-row justify-end items-center">
        <div className="flex flex-row items-center gap-1">
          {game && <span>{liveViewers}</span>}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
        </div>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert("Game URL copied!");
          }}
          className="bg-transparent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
          </svg>
        </button>
      </div>
      <div className="w-full flex flex-col md:flex-row">
        {/* Chessboard container */}
        <div className="w-full p-2 md:w-1/2 md:p-0 border-box">
          {game &&
            <Chessboard position={game.fen()} onPieceDrop={onDrop}
              boardOrientation={boardOrientation}
              arePiecesDraggable={address === player1Address || address === player2Address} />}
          {/* Collapsible sidebar on the right of the chessboard */}

        </div>

        {/* Game info container */}
        <div className="w-full md:w-1/2 border-gray-200 flex flex-col gap-2 p-2 break-words">
          {game && <p>{game.isGameOver() === true && `Game Over! ${game.turn() === 'w' ? 'Black Wins!' : 'White Wins!'}`}</p>}
          {game && <p>{game.isGameOver() === false && (game.turn() === 'b' ? 'Black\'s Turn!' : 'White\'s Turn!')}</p>}
          {/* {game && <div>Legal moves:{JSON.stringify(game.moves())}</div>} */}
          {/* {game && <div>Fen: {game.fen()}</div>} */}
          {/* {game && <div>History: {game.history()}</div>} */}
          {game && <p>Moves made: {game.history().length}</p>}
          {player1Address && <p>Player 1 (white): {truncateAddress(player1Address as `0x${string}`)}</p>}
          {player2Address && <p>Player 2 (black): {truncateAddress(player2Address as `0x${string}`)}</p>}
          {game && <p>Pgn: {game.pgn()}</p>}
          {/* iwjoijweiofjiowejfoiwjeifjweiojfiowejiofjwef
          wejfiwjef
          wefwefwef
          wefwefwe
          iwjoijweiofjiowejfoiwjeifjweiojfiowejiofjwef
          wejfiwjef
          wefwefwef
          wefwefwe
          iwjoijweiofjiowejfoiwjeifjweiojfiowejiofjwef
          wejfiwjef
          wefwefwef
          wefwefwe */}
        </div>
      </div>
      {address === "0x7D20fd2BD3D13B03571A36568cfCc2A4EB3c749e" && <div>
        <button type="button" onClick={() => {
          wsRef.current?.send(
            JSON.stringify({ type: "reset-game", data: {} }),
          )
        }}>Reset Game</button>
      </div>
      }
    </>
  );
}