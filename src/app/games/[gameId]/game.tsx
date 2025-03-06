"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { Chess, type Move, type Piece, type Square } from "chess.js";
import type { WsMessage } from "../../../../../chess-worker/src/index";
import { signMessage, verifyMessage, waitForTransactionReceipt, watchContractEvent, writeContract } from '@wagmi/core'
import { useAccount, useChainId, useConnections, useFeeData, useReadContract, useSimulateContract, useWriteContract } from 'wagmi'
import { frameWagmiConfig } from '../../../lib/wagmiconfig'
import Link from "next/link";
import { useParams } from "next/navigation";
import type { BoardOrientation } from "react-chessboard/dist/chessboard/types";
import { useInterval } from "../../../lib/useInterval";
import useInactive from "../../../components/hooks/useInactive";
import DisplayAddress from "../../../components/util/DisplayAddress";
import { copyPngToClipboard } from "../../../lib/downloadPng";
import { sdk, type Context } from "@farcaster/frame-sdk"
import OnTheClock from "../../../components/OnTheClock";
import { SyncGameBtn } from "./SyncGameBtn";
import { useToast } from "../../../components/hooks/useToast";
import type { SupportedChainId } from "../../../lib/contracts";
import { contracts } from "../../../lib/contracts";
import { stringify } from "../../../lib/stringifyContractData";

export function meta({ params }: { params: { gameId: string } }) {
  return [
    { name: "description", content: `Chess Game ${params.gameId}` },
    // {/* prod */}
    // {
    //   name: "fc:frame", content: JSON.stringify({
    //     "version": "next",
    //     "imageUrl": "https://basedchess.xyz/based-chess-logo-3-2-2.png",
    //     "button": {
    //       "title": "Play Based Chess",
    //       "action": {
    //         "type": "launch_frame", "name": "Based Chess", "url": "https://based-chess-frame.pages.dev/",
    //         "splashImageUrl": "https://basedchess.xyz/based-chess-logo-200.jpg", "splashBackgroundColor": "#ffffff"
    //       }
    //     }
    //   })
    // },

    // {/* dev */}
    // {
    //   name: "fc:frame", content: JSON.stringify({
    //     "version": "next",
    //     "imageUrl": "https://basedchess.xyz/based-chess-logo-3-2-2.png",
    //     "button": {
    //       "title": `Chess Game ${params.gameId}`,
    //       "action": {
    //         "type": "launch_frame", "name": "Based Chess", "url": `https://6701-52-119-126-16.ngrok-free.app/games/${params.gameId}`,
    //         "splashImageUrl": "https://basedchess.xyz/based-chess-logo-200.jpg", "splashBackgroundColor": "#ffffff"
    //       }
    //     }
    //   })
    // }
  ]
}

export default function Game() {
  const wsRef = useRef<WebSocket | null>(null);
  const chessboardRef = useRef<HTMLDivElement>(null);
  const [game, setGame] = useState<Chess | undefined>();
  const { address, isConnected } = useAccount()
  const [awaitSigningMove, setAwaitSigningMove] = useState(false);
  const [boardOrientation, setBoardOrientation] = useState<BoardOrientation>("white");
  const params = useParams();
  const [player1Address, setPlayer1Address] = useState("");
  const [player2Address, setPlayer2Address] = useState("");
  const [liveViewers, setLiveViewers] = useState<number>();
  const [latestPlayer1Signature, setLatestPlayer1Signature] = useState<`0x${string}` | undefined>();
  const [latestPlayer1Message, setLatestPlayer1Message] = useState<string | undefined>();
  const [latestPlayer2Signature, setLatestPlayer2Signature] = useState<`0x${string}` | undefined>();
  const [latestPlayer2Message, setLatestPlayer2Message] = useState<string | undefined>();
  const [contractGameId, setContractGameId] = useState<number | undefined>();
  const [isVisible, setIsVisible] = useState(true);
  const isInactive = useInactive(1800000); // after 2 minutes, allow websocket to close
  const [logs, setLogs] = useState<string[]>([navigator.userAgent]);
  const [inCheck, setInCheck] = useState(false);
  const [connections] = useConnections();
  const [audioPlayerDropChessPiece, setAudioPlayerDropChessPiece] = useState<HTMLAudioElement | undefined>();
  const [audioPlayerLoseGame, setAudioPlayerLoseGame] = useState<HTMLAudioElement | undefined>();
  const [audioPlayerWinGame, setAudioPlayerWinGame] = useState<HTMLAudioElement | undefined>();
  const [audioPlayerDrawGame, setAudioPlayerDrawGame] = useState<HTMLAudioElement | undefined>();

  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState<Context.FrameContext>();

  // clicking squares functionality
  const [moveFrom, setMoveFrom] = useState("");
  const [moveTo, setMoveTo] = useState<Square | null>(null);
  const [optionSquares, setOptionSquares] = useState({});

  const { showToast, Toast } = useToast();
  const chainId = useChainId();

  const [winner, setWinner] = useState<`0x${string}` | undefined>();
  const [isNFTMinted, setIsNFTMinted] = useState(false);
  const [isNFTReadyToMint, setIsNFTReadyToMint] = useState(false);
  const [nftTokenId, setNftTokenId] = useState<string | undefined>();
  const [nftMetadata, setNftMetadata] = useState<any | undefined>();
  // const { writeContract: writeContractContractGame, isPending: isPendingContractGame, error: errorContractGame, data: txHashContractGame } = useWriteContract();
  const { data: contractGameData, isPending: isPendingContractGame, error: errorContractGame } = useReadContract({
    address: contracts.gamesContract[chainId as SupportedChainId].address as `0x${string}`,
    abi: contracts.gamesContract[chainId as SupportedChainId].abi,
    functionName: "getGame",
    args: [contractGameId],
  });
  const { data: nftUriSetData, isPending: isPendingNftUriSet, error: errorNftUriSet } = useReadContract({
    address: contracts.nftContract[chainId as SupportedChainId].address as `0x${string}`,
    abi: contracts.nftContract[chainId as SupportedChainId].abi,
    functionName: "getNftUri",
    args: [contracts.gamesContract[chainId as SupportedChainId].address, contractGameId],
  });
  const { data: gameToMintedTokenIdData, isPending: isPendingGameToMintedTokenId, error: errorGameToMintedTokenId } = useReadContract({
    address: contracts.nftContract[chainId as SupportedChainId].address as `0x${string}`,
    abi: contracts.nftContract[chainId as SupportedChainId].abi,
    functionName: "gameToMintedTokenId",
    args: [contracts.gamesContract[chainId as SupportedChainId].address, contractGameId],
  });

  useEffect(() => {
    setAudioPlayerDropChessPiece(new Audio("/sounds/drop_piece.mp3"));
    setAudioPlayerLoseGame(new Audio("/sounds/lose_game.mp3"));
    setAudioPlayerWinGame(new Audio("/sounds/win_game.mp3"));
    setAudioPlayerDrawGame(new Audio("/sounds/draw_game.mp3"));
  }, []);


  useEffect(() => {
    console.log("Tanstack: isNFTMinted", isNFTMinted);
    console.log("Tanstack: nftUriSetData", nftUriSetData);
    if (isNFTMinted && nftUriSetData && typeof nftUriSetData === "string") {
      fetch(`https://ipfs.io/ipfs/${nftUriSetData.split("//")[1]}`).then(res => res.json()).then(data => {
        console.log("Tanstack: nftUriMetadata", data);
        setNftMetadata(data);
      })
    }
  }, [isNFTMinted, nftUriSetData]);

  useEffect(() => {
    console.log("Tanstack: gameToMintedTokenIdData", gameToMintedTokenIdData);
    // is not undefined, or not empty string, or not 0
    if (gameToMintedTokenIdData) {
      setIsNFTMinted(true);
      setNftTokenId(gameToMintedTokenIdData.toString());
    }
  }, [gameToMintedTokenIdData]);

  useEffect(() => {
    console.log("Tanstack: isPendingContractGame", isPendingContractGame);
    console.log("Tanstack: errorContractGame", errorContractGame);
    console.log("Tanstack: contractGameData", contractGameData);
    if (Array.isArray(contractGameData)) {
      const [gameIdBigInt, creator, player1, player2, result, winnerIfNotDraw, updatesSignatures] = contractGameData as [bigint, `0x${string}`, `0x${string}`, `0x${string}`, number, `0x${string}`, `0x${string}`];
      if (result === 1 && winnerIfNotDraw !== undefined && winnerIfNotDraw !== "0x0000000000000000000000000000000000000000") {
        setWinner(winnerIfNotDraw);
      }
    }
  }, [contractGameData, isPendingContractGame, errorContractGame]);

  useEffect(() => {
    console.log("Tanstack: isPendingNftUriSet", isPendingNftUriSet);
    console.log("Tanstack: errorNftUriSet", errorNftUriSet);
    console.log("Tanstack: nftUriSetData", nftUriSetData);
    console.log("Tanstack: address", address);
    console.log("Tanstack: winner", winner);

    // nftUriSetData is not undefined or empty string
    if (nftUriSetData && address === winner) {
      console.log("Tanstack: nftUriSetData", nftUriSetData);
      setIsNFTReadyToMint(true);
    }
  }, [nftUriSetData, isPendingNftUriSet, errorNftUriSet, address, winner]);

  // useEffect(() => {
  //   if (!isPendingContractGame && contractGameId !== undefined && chainId !== undefined && writeContractContractGame) {
  //     // todo: rate limit? looks like retry defaults to 0
  //     console.log("Tanstack: calling contract getGame()");
  //     writeContractContractGame({
  //       address: contracts.gamesContract[chainId as SupportedChainId].address as `0x${string}`,
  //       abi: contracts.gamesContract[chainId as SupportedChainId].abi,
  //       functionName: "getGame",
  //       args: [contractGameId],
  //     });
  //   }
  //   console.log("Tanstack: txHashContractGame", txHashContractGame);
  //   console.log("Tanstack: isPendingContractGame", isPendingContractGame);
  //   console.log("Tanstack: errorContractGame", errorContractGame);
  //   console.log("Tanstack: contractGameId", contractGameId);
  //   console.log("Tanstack: chainId", chainId);
  // }, [contractGameId, chainId, writeContractContractGame, txHashContractGame, isPendingContractGame, errorContractGame]);

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

  useEffect(() => {
    console.log("wagmi wallet isConnected", isConnected, connections);
  }, [isConnected, connections]);

  useEffect(() => {
    if (isVisible) {
      console.log("page visibility changed and is visible")
      if (wsRef.current === null
        || wsRef.current.readyState === WebSocket.CLOSED
        || wsRef.current.readyState === WebSocket.CLOSING) {
        console.log("websocket is closed or closing. starting websocket")
        setLogs(prevLogs => [...prevLogs, "isVisible now: websocket is closed or closing. starting websocket"]);
        wsRef.current = startWebSocket();
      }
    } else {
      console.log("page visibility changed and is not visible")
    }
    // return () => wsRef.current?.close();
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
      // play lose game sound if signed in player lost, otherwise play win game sound for everyone else
      // if game is draw, play win game sound
      if (game.isDraw()) {
        // audioPlayerDrawGame.play();
      } else if ((address === player1Address && game.turn() === 'w')
        || (address === player2Address && game.turn() === 'b')) {
        // If it is my turn, I lost
        // audioPlayerLoseGame.play();
      } else {
        // If it is not my turn, I won. or if I am a spectator, play win game sound
        // audioPlayerWinGame.play();
      }
    }
    if (game?.isCheck()) {
      console.log("game is in check", game);
      // if is check and your turn, add red border or text
      if ((game.turn() === 'w' && address === player1Address)
        || (game.turn() === 'b' && address === player2Address)) {
        console.log("game is in check and your turn");
        setInCheck(true);
      } else {
        setInCheck(false);
        console.log("game is in check but not your turn");
      }
    }
    // todo: enable once audio can be disabled
    // }, [game, address, player1Address, player2Address, audioPlayerDrawGame, audioPlayerLoseGame, audioPlayerWinGame]);
  }, [game, address, player1Address, player2Address]);

  const processContractGameOverEvent = useCallback((log: any) => {
    console.log("processContractGameOverEvent", log);
    const { gameId, result, winnerIfNotDraw, loserIfNotDraw, creator } = log.args;
    const rawGameId = gameId;
    const bigIntGameId = BigInt(rawGameId as string);
    const contractGameId = Number(bigIntGameId);   // As number: 291 (if within safe range)
    // biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
    console.log(`GameOver detected:`);
    console.log(`  Game ID: ${contractGameId}`);
    console.log(`  Result: ${result}`);
    console.log(`  Winner: ${winnerIfNotDraw}`);
    console.log(`  Loser: ${loserIfNotDraw}`);
    console.log(`  Creator: ${creator}`);
    console.log('---');
    showToast("Game result saved to Base", "success", 5000);

    // if the player is the winner, prompt them to mint a winner NFT
    if (result === 1) {
      // draw
      console.log("player is the winner!");
      setWinner(winnerIfNotDraw);
    } else if (winnerIfNotDraw === address) {
      console.log("game is a draw");
    }
  }, [showToast, address]);

  useEffect(() => {
    let unwatch: () => void;
    if (game?.isGameOver()) {
      unwatch = watchContractEvent(frameWagmiConfig, {
        address: contracts.gamesContract[chainId as SupportedChainId].address as `0x${string}`,
        abi: contracts.gamesContract[chainId as SupportedChainId].abi,
        eventName: 'GameOver',
        args: { gameId: contractGameId },
        onLogs: (logs) => {
          // biome-ignore lint/complexity/noForEach: <explanation>
          logs.forEach((log) => processContractGameOverEvent(log));
        },
        onError: (error) => {
          console.error('Error watching events:', error);
        },
      });
    }

    return () => {
      if (unwatch) unwatch();
    }
  }, [game, contractGameId, chainId, processContractGameOverEvent]);

  const processNftUriSetEvent = useCallback((log: any) => {
    console.log("processNftUriSetEvent", log);
    const { gamesContractAddress, gameId, nftUri } = log.args;
    const rawGameId = gameId;
    const bigIntGameId = BigInt(rawGameId as string);
    const contractGameId = Number(bigIntGameId);   // As number: 291 (if within safe range)
    // biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
    console.log(`NftUriSet detected:`);
    console.log(`  Games Contract Address: ${gamesContractAddress}`);
    console.log(`  Game ID: ${contractGameId}`);
    console.log(`  Nft URI: ${nftUri}`);
    console.log('---');

    // if the player is the winner, prompt them to mint a winner NFT
    if (winner === address) {
      console.log("nft uri is set and player is the winner!");
      setIsNFTReadyToMint(true);
    }
  }, [address, winner]);

  const promptUserToMintNFT = useCallback(async () => {
    // todo simulate contract
    const txHash = await writeContract(frameWagmiConfig, {
      address: contracts.nftContract[chainId as SupportedChainId].address as `0x${string}`,
      abi: contracts.nftContract[chainId as SupportedChainId].abi,
      functionName: "mintWinNFT",
      args: [contracts.gamesContract[chainId as SupportedChainId].address, contractGameId], // gameId, message, signature, address signer
    });
    console.log("promptUserToMintNFT txHash: ", txHash);
    const tx = await waitForTransactionReceipt(frameWagmiConfig, {
      hash: txHash,
    });
    console.log("promptUserToMintNFT tx: ", tx);
  }, [chainId, contractGameId]);

  useEffect(() => {
    if (isNFTReadyToMint && address === winner && !isNFTMinted) {
      console.log("nft is ready to mint");
      // promptUserToMintNFT();
    }
  }, [isNFTReadyToMint, address, winner, isNFTMinted]);

  // watch for nft ready event - NftUriSet
  useEffect(() => {
    let unwatch: () => void;
    if (game?.isGameOver()) {
      unwatch = watchContractEvent(frameWagmiConfig, {
        address: contracts.nftContract[chainId as SupportedChainId].address as `0x${string}`,
        abi: contracts.nftContract[chainId as SupportedChainId].abi,
        eventName: 'NftUriSet',
        args: { gamesContractAddress: contracts.gamesContract[chainId as SupportedChainId].address as `0x${string}`, gameId: contractGameId },
        onLogs: (logs) => {
          // biome-ignore lint/complexity/noForEach: <explanation>
          logs.forEach((log) => processNftUriSetEvent(log));
        },
        onError: (error) => {
          console.error('Error watching events:', error);
        },
      });
    }

    return () => {
      if (unwatch) unwatch();
    }
  }, [game, contractGameId, chainId, processNftUriSetEvent]);

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
    console.log("game received pgn:", newGame.pgn());
    // console.log("game received:", newGame.ascii());
    // console.log("game received fen:", newGame.fen());
    // console.log("game received pgn:", newGame.pgn());
    setGame(newGame);
  }

  const playDropChessPieceSound = async () => {
    audioPlayerDropChessPiece?.play();
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
        playDropChessPieceSound();
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
    const wsProtocol = window.location.protocol === "https:" ? "wss" : "wss";
    const domain = process.env.NEXT_PUBLIC_WORKER_DOMAIN || "chess-worker.johnsgresham.workers.dev";
    // const stagingDomain = "chess-worker-staging.johnsgresham.workers.dev";
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
          // don't update the game if the current game has more moves than the received game
          // this can happen when the user is on mobile and the websocket is closed 
          // while the user is switched to their wallet

          const newGame = new Chess();
          newGame.loadPgn(messageData.data.pgn);
          if (game && game.history().length > newGame.history().length) {
            setLogs(prevLogs => [...prevLogs, "received game has less moves than current game. not updating game"]);
          } else {
            updateGame(newGame);
          }
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
          setLatestPlayer1Signature(messageData.data.latestPlayer1Signature);
          setLatestPlayer1Message(messageData.data.latestPlayer1Message);
          setLatestPlayer2Signature(messageData.data.latestPlayer2Signature);
          setLatestPlayer2Message(messageData.data.latestPlayer2Message);
          setContractGameId(messageData.data.contractGameId);

          break;
        case "live-viewers":
          // console.log("live-viewers:", messageData.data.liveViewers);
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

  const closeWebsocket = () => {
    console.log("closing websocket");
    wsRef.current?.close();
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: only call on mount
  useEffect(() => {
    // Only close the websocket when the component unmounts
    if (wsRef.current === null
      || wsRef.current.readyState === WebSocket.CLOSED
      || wsRef.current.readyState === WebSocket.CLOSING) {
      console.log("websocket is closed or closing. starting websocket")
      setLogs(prevLogs => [...prevLogs, "onMount: websocket is closed or closing. starting websocket"]);
      wsRef.current = startWebSocket();
    }
    window.addEventListener('beforeunload', closeWebsocket);

    return () => {
      wsRef.current?.close();
      window.removeEventListener('beforeunload', closeWebsocket);
      audioPlayerDrawGame?.pause();
      audioPlayerLoseGame?.pause();
      audioPlayerWinGame?.pause();
      audioPlayerDropChessPiece?.pause();
    }
    // biome-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signMove = async (
    game: Chess,
    move: { from: string, to: string, promotion: string },
    moveMove: Move
  ) => {
    if (!address) {
      console.error("no address");
      return;
    }
    // sign move
    const message = game.pgn();
    // const message = JSON.stringify(moveMove.lan)
    const signature = await signMessage(frameWagmiConfig, {
      message
    });
    console.log("user move signature:", signature);

    const verified = await verifyMessage(frameWagmiConfig, {
      address,
      message,
      signature,
    })
    console.log("user move signature verified:", verified);

    setAwaitSigningMove(false);
    // update server
    // on mobile, the websocket gets closed while the user is switched to their wallet
    // so we need to wait for the websocket to open before sending the move at least 5 to 10 seconds
    let hasSentMove = false;
    setLogs(prevLogs => [...prevLogs, `readyState: ${wsRef.current?.readyState}`]);
    if (wsRef.current === null
      || wsRef.current.readyState === WebSocket.CLOSED
      || wsRef.current.readyState === WebSocket.CLOSING) {
      console.log("after signing move: websocket is closed or closing. starting websocket")
      setLogs(prevLogs => [...prevLogs, "after signing move: websocket is closed or closing. starting websocket"]);
      wsRef.current = startWebSocket();
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      try {
        wsRef.current?.send(
          JSON.stringify({
            type: "move", data: { ...move, signature, message, address }
          }),
        );
        hasSentMove = true;
        setLogs(prevLogs => [...prevLogs, "move 1st try sent"]);
      } catch (err) {
        console.log("sending move failed:", err);
        setLogs(prevLogs => [...prevLogs, `sending move 1st try failed. ${wsRef.current?.readyState}`]);
      }
    }
    setLogs(prevLogs => [...prevLogs, `readyState: ${wsRef.current?.readyState}`]);
    if (!hasSentMove) {
      console.log("websocket is not open. waiting for 2 seconds before sending move");
      await new Promise(resolve => setTimeout(resolve, 2000));
      try {
        wsRef.current?.send(
          JSON.stringify({
            type: "move", data: { ...move, signature, message, address }
          }),
        );
        hasSentMove = true;
        setLogs(prevLogs => [...prevLogs, "move 2nd try sent"]);
      } catch (err) {
        console.log("sending move failed on 2nd try:", err);
        setLogs(prevLogs => [...prevLogs, `sending move 2nd try failed. ${wsRef.current?.readyState}`]);
      }
    }
    setLogs(prevLogs => [...prevLogs, `readyState: ${wsRef.current?.readyState}`]);
    if (!hasSentMove) {
      console.log("websocket is not open. waiting for 5 seconds before sending move");
      await new Promise(resolve => setTimeout(resolve, 5000));
      try {
        wsRef.current?.send(
          JSON.stringify({
            type: "move", data: { ...move, signature, message, address }
          }),
        );
        hasSentMove = true;
        setLogs(prevLogs => [...prevLogs, "move 3rd try sent"]);
      } catch (err) {
        console.log("sending move failed on 3rd try:", err);
        setLogs(prevLogs => [...prevLogs, `sending move 3rd try failed. ${wsRef.current?.readyState}`]);
      }
    }
    setLogs(prevLogs => [...prevLogs, `readyState: ${wsRef.current?.readyState}`]);
  }

  /**
   * Undoes the move if the user doesnt sign it
   * or sends the move to the server if the user does sign it
   * @param game the game state with the move already made
   * @param move the move being made (from, to, promotion) notation
   * @param moveMove the move being made (chess.js Move object for move metadata and alternate notations)
   */
  async function askUserToSignMove(game: Chess, move: { from: string, to: string, promotion: string }, moveMove: Move) {
    setAwaitSigningMove(true);
    try {
      // todo: top level onDrop cant be async 
      await signMove(game, move, moveMove);
    } catch (error) {
      console.error("error signing move:", error);
      setLogs(prevLogs => [...prevLogs, `error signing move: ${error}`]);
      game.undo();
      // update the game state
      console.log("updating game state");
      const newGame = new Chess();
      newGame.load(game.fen());
      newGame.loadPgn(game.pgn());
      setGame(newGame);
      return false;
    } finally {
      console.log("finally setting awaitSigningMove to false");
      setAwaitSigningMove(false);
    }
    return true;
  }

  function onDrop(sourceSquare: Square, targetSquare: Square, piece: Piece) {
    console.log("onDrop game:", game, sourceSquare, targetSquare, piece);
    playDropChessPieceSound();

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
        setLogs(prevLogs => [...prevLogs, "illegal move: white piece moved by black player"]);
        return false;
      }
      if (move.color === 'b' && address !== player2Address) {
        console.error("illegal move: black piece moved by white player");
        game.undo();
        setLogs(prevLogs => [...prevLogs, "illegal move: black piece moved by white player"]);
        return false;
      }

      // update the game state
      console.log("updating game state");
      setLogs(prevLogs => [...prevLogs, "updating game state with move, still awaiting user signature"]);
      const newGame = new Chess();
      // newGame.load(move.after);
      newGame.loadPgn(game.pgn());
      setGame(newGame);

      // async function: undoes the move if the user doesnt sign it
      // or sends the move to the server if the user does sign it
      askUserToSignMove(newGame, {
        from: sourceSquare,
        to: targetSquare,
        promotion: "q", // always promote to a queen for example simplicity
      }, move);
      setLogs(prevLogs => [...prevLogs, "askUserToSignMove"]);
      return true;
    } catch (error) {
      // illegal move
      console.log("error invalid move:", error);
      return false;
    }
  }

  function getMoveOptions(square: Square) {
    if (!game) {
      console.error("game not initialized");
      return false;
    }
    const moves = game.moves({
      square,
      verbose: true
    });
    if (moves.length === 0) {
      setOptionSquares({});
      return false;
    }
    const newSquares: Record<Square, { background: string, borderRadius?: string }> = {};
    moves.map(move => {
      newSquares[move.to] = {
        background: game.get(move.to) && game?.get(move.to)?.color !== game?.get(square)?.color ? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)" : "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
        borderRadius: "50%"
      };
      return move;
    });
    newSquares[square] = {
      background: "rgba(255, 255, 0, 0.4)" // yellow
    };
    setOptionSquares(newSquares);
    return true;
  }

  function onSquareClick(square: Square, piece: Piece) {
    console.log("onSquareClick", square, piece);
    if (!game) {
      console.error("game not initialized");
      return;
    }
    // setRightClickedSquares({});

    // from square
    if (!moveFrom) {
      const hasMoveOptions = getMoveOptions(square);
      if (hasMoveOptions) setMoveFrom(square);
      return;
    }

    // to square
    if (!moveTo) {
      // check if valid move before showing dialog
      const moves = game.moves({
        moveFrom,
        verbose: true
      });
      const foundMove = moves.find(m => m.from === moveFrom && m.to === square);
      // not a valid move
      if (!foundMove) {
        // check if clicked on new piece
        const hasMoveOptions = getMoveOptions(square);
        // if new piece, setMoveFrom, otherwise clear moveFrom
        setMoveFrom(hasMoveOptions ? square : "");
        return;
      }

      // valid move
      setMoveTo(square);

      // if promotion move
      // if (foundMove.color === "w" && foundMove.piece === "p" && square[1] === "8" || foundMove.color === "b" && foundMove.piece === "p" && square[1] === "1") {
      //   setShowPromotionDialog(true);
      //   return;
      // }

      // is normal move
      const isMoveValid = onDrop(moveFrom as Square, square, piece);
      if (!isMoveValid) {
        const hasMoveOptions = getMoveOptions(square);
        if (hasMoveOptions) setMoveFrom(square);
        return;
      }
      // const gameCopy = new Chess();
      // gameCopy.loadPgn(game.pgn());
      // const move = gameCopy.move({
      //   from: moveFrom,
      //   to: square,
      //   promotion: "q"
      // });

      // if invalid, setMoveFrom and getMoveOptions
      // if (move === null) {
      //   const hasMoveOptions = getMoveOptions(square);
      //   if (hasMoveOptions) setMoveFrom(square);
      //   return;
      // }
      // updateGame(gameCopy); // game updated in onDrop
      setMoveFrom("");
      setMoveTo(null);
      setOptionSquares({});
      return;
    }
  }

  useInterval(async () => {
    // console.log("Health check websocket status");
    if (isInactive) {
      // console.log("user is inactive. not opening a new websocket or updating live-viewers");
      return;
    }
    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED || wsRef.current.readyState === WebSocket.CLOSING) {
      console.log("websocket is closed or closing. starting websocket")
      setLogs(prevLogs => [...prevLogs, "websocket is closed or closing. starting websocket"]);
      wsRef.current = startWebSocket();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    setLogs(prevLogs => [...prevLogs, `Health check: websocket is ${wsRef.current?.readyState}`]);
    console.log("sending live-viewers message");
    wsRef.current?.send(
      JSON.stringify({ type: "live-viewers", data: {} }),
    )
  }, 15000);

  useEffect(() => {
    console.log("user changed isInactive:", isInactive);
  }, [isInactive]);

  let topAddress = player2Address;
  if (address === player2Address) {
    topAddress = player1Address;
  }
  const bottomAddress = topAddress === player1Address ? player2Address : player1Address;
  let playerOnTheClock: `0x${string}` | undefined;
  if (game?.isGameOver() === false) {
    playerOnTheClock = (game?.turn() === 'w' ? player1Address : player2Address) as `0x${string}`;
  }

  let latestSignedMessage = latestPlayer1Message;
  let latestSignedPlayer = player1Address;
  let latestSignedSignature = latestPlayer1Signature;
  // ignore undefined case for now
  if (latestPlayer1Message && latestPlayer2Message && latestPlayer2Message?.length > latestPlayer1Message?.length) {
    latestSignedMessage = latestPlayer2Message;
    latestSignedPlayer = player2Address;
    latestSignedSignature = latestPlayer2Signature;
  }

  return (
    <>
      {/* icons showing the number of live views and a share url button */}
      <div className="w-full flex flex-row justify-end items-center pr-2">
        <Link className="flex-1 pl-2" href={"/"}>{"< Games"}</Link>
        <div className="flex flex-row items-center gap-1 mr-2 group relative">
          {game && <span>{liveViewers}</span>}
          {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            {/* <title>Live Viewers</title> */}
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          <span
            className="absolute z-10 top-full left-1/2 -translate-x-1/2 mt-2 w-max px-2 py-1 text-sm text-white bg-gray-800 rounded shadow-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            Live Viewers
          </span>
        </div>
        {/* <button type="button" data-tooltip-target="screenshot-board-copy"
          onClick={() => { copyPngToClipboard(chessboardRef) }}
          className="bg-transparent group relative px-4 py-2 text-black dark:text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:bg-transparent"> */}
        {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
        {/* <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
          </svg>
          <span
            className="absolute z-10 top-full left-1/2 -translate-x-1/2 mt-2 w-max px-2 py-1 text-sm text-white bg-gray-800 rounded shadow-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            Board Screenshot
          </span>
        </button> */}
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert("Game URL copied!");
          }}
          className="bg-transparent group relative px-4 py-2 text-black dark:text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:bg-transparent">
          {/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
          </svg>
          <span
            className="absolute z-10 top-full left-1/2 -translate-x-1/2 mt-2 w-max px-2 py-1 text-sm text-white bg-gray-800 rounded shadow-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            Share link
          </span>
        </button>
        <div className="group relative">
          <span className="text-sm">{params.gameId}</span>
          <span
            className="select-none absolute z-10 top-full left-1/2 -translate-x-1/2 mt-2 w-max px-2 py-1 text-sm text-white bg-gray-800 rounded shadow-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          >
            Game ID
          </span>
        </div>
      </div >
      <div className="w-full flex flex-col md:flex-row">
        {/* Chessboard container */}
        <div ref={chessboardRef} className={`w-full p-2 md:w-1/2 md:p-0 border-box border-2 ${inCheck ? 'border-red-500' : ' border-transparent'}`}>
          {/* If address is player1 or not player2, show player2's address on top. 
          Board orientation is white on bottom by default. */}
          <div className="flex flex-row pb-2 items-center justify-between">
            <span><DisplayAddress address={topAddress as `0x${string}`} emphasize={playerOnTheClock === topAddress} /></span>
            {playerOnTheClock === topAddress && <OnTheClock />}
          </div>
          {game &&
            <Chessboard
              position={game.fen()}
              onPieceDrop={onDrop}
              onSquareClick={onSquareClick}
              // onPieceDrop={(sourceSquare, targetSquare, piece) => { console.log("onPieceDrop", sourceSquare, targetSquare, piece); return onDrop(sourceSquare, targetSquare, piece) }}
              // onSquareClick={(square) => { console.log("onSquareClick", square); return onSquareClick(square) }}
              // onPieceDragBegin={() => console.log("onPieceDragBegin")}
              // onPieceDragEnd={() => console.log("onPieceDragEnd")}
              // onPieceDrop={() => { console.log("onPieceDrop"); return false }}
              // onPieceClick={() => console.log("onPieceClick")}
              // onSquareClick={() => console.log("onSquareClick")}
              boardOrientation={boardOrientation}
              arePiecesDraggable={address === player1Address || address === player2Address}
              customSquareStyles={{
                // ...moveSquares,
                ...optionSquares,
                // ...rightClickedSquares
              }} />
          }
          {/* If address is player1 or not player2, show player1's address on bottom. 
          Board orientation is white on bottom by default. */}
          <div className="flex flex-row pt-2 items-center justify-between">
            <span><DisplayAddress address={bottomAddress as `0x${string}`} emphasize={playerOnTheClock === bottomAddress} /></span>
            {playerOnTheClock === bottomAddress && <OnTheClock />}
          </div>
        </div>

        {/* Game info container */}
        <div className="w-full md:w-1/2 border-gray-200 flex flex-col gap-2 p-2 break-words">
          {game && <p>{game.isGameOver() === true && `Game Over! ${game.turn() === 'w' ? 'Black Wins!' : 'White Wins!'}`}</p>}
          {game &&
            <p>{game.isGameOver() === false && game.isCheck() ? "Check!" : ""}</p>}
          {game && !game.isGameOver() && <p>Move #{game.history().length + 1}</p>}
          <h3 className="pt-6 text-h3">Verifiable game state</h3>
          < div className="flex flex-row gap-2 items-center">
            <span className="text-sm">Download</span>
            <button
              type="button"
              onClick={() => {
                // Convert JSON object to string
                const jsonString = JSON.stringify({
                  player1Address, player2Address,
                  latestPlayer1Signature, latestPlayer1Message,
                  latestPlayer2Signature, latestPlayer2Message,
                  gameId: params.gameId
                }, null, 2);
                // Create a blob with JSON content and MIME type
                const blob = new Blob([jsonString], { type: "application/json" });
                // Create a link element
                const link = document.createElement("a");
                // Set download attribute with a filename
                link.download = `game_data_${params.gameId}.json`;
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
            </button></div>
          <details>
            <summary className="text-sm">View</summary>
            <p>
              {game && <span>Current PGN: {game.pgn()}</span>}
              <br />
              {latestPlayer1Signature && <span>Latest Player 1 Signature: {latestPlayer1Signature}</span>}
              <br />
              {latestPlayer1Message && <span>Latest Player 1 PGN Message: {latestPlayer1Message}</span>}
              <br />
              {latestPlayer2Signature && <span>Latest Player 2 Signature: {latestPlayer2Signature}</span>}
              <br />
              {latestPlayer2Message && <span>Latest Player 2 PGN Message: {latestPlayer2Message}</span>}
              <br />
              {<span>Contract Game ID: {contractGameId}</span>}
              <br />
              {<span>Contract Game Address: {contracts.gamesContract[chainId as SupportedChainId].address}</span>}
              <br />
              {<span>Contract NFT address: {contracts.nftContract[chainId as SupportedChainId].address}</span>}
            </p>
          </details>

          {/* {game && <p>Pgn: {game.pgn()}</p>}
          {latestPlayer1Signature && <p>Latest Player 1 Signature: {latestPlayer1Signature}</p>}
          {latestPlayer1Message && <p>Latest Player 1 Message: {latestPlayer1Message}</p>}
          {latestPlayer2Signature && <p>Latest Player 2 Signature: {latestPlayer2Signature}</p>}
          {latestPlayer2Message && <p>Latest Player 2 Message: {latestPlayer2Message}</p>} */}
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
          <h3 className="pt-6 text-h3">Debug Info</h3>
          <details>
            <summary className="text-sm">Logs</summary>
            <div className="flex flex-col gap-2">
              {isNFTMinted && <p>NFT Minted! Token ID: {nftTokenId}</p>}
              {nftMetadata && <img src={`https://ipfs.io/ipfs/${nftMetadata?.image.split("//")[1]}`} alt="NFT" />}
              {isNFTReadyToMint && !isNFTMinted && <button type="button" onClick={() => {
                promptUserToMintNFT();
              }}>Mint NFT</button>}
              {/* hide sync game button if contract game result != 0 or if a winner is already declared */}
              <SyncGameBtn game={game} contractGameId={contractGameId} message={latestSignedMessage} signer={latestSignedPlayer} signature={latestSignedSignature} />
              {<p>NFT URI Data: {JSON.stringify(nftUriSetData)}</p>}
              {<p>NFT URI pending: {JSON.stringify(isPendingNftUriSet)}</p>}
              {<p>NFT URI error: {JSON.stringify(errorNftUriSet)}</p>}
              {<p>Game to Minted Token ID Data: {stringify(gameToMintedTokenIdData)}</p>}
              {<p>Game to Minted Token ID pending: {JSON.stringify(isPendingGameToMintedTokenId)}</p>}
              {<p>Game to Minted Token ID error: {JSON.stringify(errorGameToMintedTokenId)}</p>}
              {logs.map((log, index) => <p key={index}>{log}</p>)}
            </div>
          </details>
          <details>
            <summary className="text-sm">Farcaster Context</summary>
            <div className="flex flex-col gap-2">
              <p>{JSON.stringify(context)}</p>
            </div>
          </details>
        </div>
      </div >
      <Toast />
    </>
  );
}