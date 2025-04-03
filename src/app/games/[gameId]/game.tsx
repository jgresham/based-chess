"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Chessboard } from "react-chessboard";
import { Chess, type Move, type Square } from "chess.js";
import {
	signMessage,
	verifyMessage,
	waitForTransactionReceipt,
	watchContractEvent,
	writeContract,
} from "@wagmi/core";
import { useAccount, useChainId, useConnections, useReadContract } from "wagmi";
import { frameWagmiConfig } from "../../../lib/wagmiconfig";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { BoardOrientation } from "react-chessboard/dist/chessboard/types";
import { useInterval } from "../../../lib/useInterval";
import useInactive from "../../../components/hooks/useInactive";
import DisplayAddress from "../../../components/util/DisplayAddress";
// import { copyPngToClipboard } from "../../../lib/downloadPng";
import { sdk, type Context } from "@farcaster/frame-sdk";
import OnTheClock from "../../../components/OnTheClock";
import { SyncGameBtn } from "./SyncGameBtn";
import { useToast } from "../../../components/hooks/useToast";
import type { SupportedChainId } from "../../../lib/contracts";
import { blockExplorers, contracts } from "../../../lib/contracts";
import { stringify } from "../../../lib/stringifyContractData";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button, buttonVariants } from "../../../components/ui/button";
import { ArrowUpRight, ChevronLeft, Download, Eye, Share } from "lucide-react";
import { MintGameWinNFTBtn, type MintStep } from "./MintGameWinNFTBtn";
import { useDevMode } from "../../../components/hooks/useLocalSettings";
import { useFarcasterUser } from "../../../components/hooks/useFarcasterUser";
import { FarcasterUser } from "../../../lib/neynar.server";

export type WsMessage = {
	type: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: any;
};

/**
 * If the player is the winner according a local game state
 */
const isPlayerLocalWinner = ({
	game,
	address,
	player1Address,
	player2Address,
}: {
	game: Chess;
	address?: `0x${string}`;
	player1Address?: `0x${string}`;
	player2Address?: `0x${string}`;
}) => {
	if (address && player1Address && player2Address) {
		if (game.isGameOver() === true && game.turn() === "b" && player1Address === address) {
			return true;
		}
		if (game.isGameOver() === true && game.turn() === "w" && player2Address === address) {
			return true;
		}
	}
	return false;
};

type NFTMetadata = {
	name: string;
	description: string;
	image: string;
	properties: Record<string, string | number | boolean>;
};

export default function Game() {
	const { data: isDevMode } = useDevMode();
	const wsRef = useRef<WebSocket | null>(null);
	const chessboardRef = useRef<HTMLDivElement>(null);
	const [game, setGame] = useState<Chess | undefined>();
	const { address, isConnected } = useAccount();
	const [awaitSigningMove, setAwaitSigningMove] = useState(false);
	const [boardOrientation, setBoardOrientation] = useState<BoardOrientation>("white");
	const params = useParams();
	const [player1Address, setPlayer1Address] = useState("");
	const [player2Address, setPlayer2Address] = useState("");
	const { data: player1FarcasterData } = useFarcasterUser(
		player1Address.toLowerCase() as `0x${string}`,
	);
	const { data: player2FarcasterData } = useFarcasterUser(
		player2Address.toLowerCase() as `0x${string}`,
	);
	const [liveViewers, setLiveViewers] = useState<number>();
	const [latestPlayer1Signature, setLatestPlayer1Signature] = useState<`0x${string}` | undefined>();
	const [latestPlayer1Message, setLatestPlayer1Message] = useState<string | undefined>();
	const [latestPlayer2Signature, setLatestPlayer2Signature] = useState<`0x${string}` | undefined>();
	const [latestPlayer2Message, setLatestPlayer2Message] = useState<string | undefined>();
	const [latestSignedMessage, setLatestSignedMessage] = useState(latestPlayer1Message);
	const [latestSignedPlayer, setLatestSignedPlayer] = useState(player1Address);
	const [latestSignedSignature, setLatestSignedSignature] = useState(latestPlayer1Signature);
	const [contractGameId, setContractGameId] = useState<number | undefined>();
	const [isVisible, setIsVisible] = useState(true);
	const isInactive = useInactive(1800000); // after 2 minutes, allow websocket to close
	const [logs, setLogs] = useState<string[]>([navigator.userAgent]);
	const [inCheck, setInCheck] = useState(false);
	const [connections] = useConnections();
	const [audioPlayerDropChessPiece, setAudioPlayerDropChessPiece] = useState<
		HTMLAudioElement | undefined
	>();
	const [audioPlayerLoseGame, setAudioPlayerLoseGame] = useState<HTMLAudioElement | undefined>();
	const [audioPlayerWinGame, setAudioPlayerWinGame] = useState<HTMLAudioElement | undefined>();
	const [audioPlayerDrawGame, setAudioPlayerDrawGame] = useState<HTMLAudioElement | undefined>();

	const [isSDKLoaded, setIsSDKLoaded] = useState(false);
	const [context, setContext] = useState<Context.FrameContext>();

	// clicking squares functionality
	const [moveFrom, setMoveFrom] = useState("");
	const [moveTo, setMoveTo] = useState<Square | null>(null);
	const [optionSquares, setOptionSquares] = useState<
		Partial<
			Record<
				Square,
				{
					background?: string;
					borderRadius?: string;
				}
			>
		>
	>({});

	const { showToast, Toast } = useToast();
	const chainId = useChainId();

	const [winner, setWinner] = useState<`0x${string}` | undefined>();
	const [isNFTMinted, setIsNFTMinted] = useState(false);
	const [isNFTReadyToMint, setIsNFTReadyToMint] = useState(false);
	const [nftTokenId, setNftTokenId] = useState<string | undefined>();
	const [nftMetadata, setNftMetadata] = useState<NFTMetadata | undefined>();
	const [mintStep, setMintStep] = useState<MintStep>(-1);
	// const { writeContract: writeContractContractGame, isPending: isPendingContractGame, error: errorContractGame, data: txHashContractGame } = useWriteContract();
	const {
		data: contractGameData,
		isPending: isPendingContractGame,
		error: errorContractGame,
	} = useReadContract({
		address: contracts.gamesContract[chainId as SupportedChainId].address as `0x${string}`,
		abi: contracts.gamesContract[chainId as SupportedChainId].abi,
		functionName: "getGame",
		args: [contractGameId],
	});
	const {
		data: nftUriSetData,
		isPending: isPendingNftUriSet,
		error: errorNftUriSet,
		refetch: refetchNftUriSet,
	} = useReadContract({
		address: contracts.nftContract[chainId as SupportedChainId].address as `0x${string}`,
		abi: contracts.nftContract[chainId as SupportedChainId].abi,
		functionName: "getNftUri",
		args: [contracts.gamesContract[chainId as SupportedChainId].address, contractGameId],
	});
	const {
		data: gameToMintedTokenIdData,
		isPending: isPendingGameToMintedTokenId,
		error: errorGameToMintedTokenId,
	} = useReadContract({
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
			fetch(`https://ipfs.io/ipfs/${nftUriSetData.split("//")[1]}`)
				.then((res) => res.json())
				.then((data) => {
					console.log("Tanstack: nftUriMetadata", data);
					setNftMetadata(data as NFTMetadata);
				});
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
			const [
				_gameIdBigInt,
				_creator,
				_player1,
				_player2,
				result,
				winnerIfNotDraw,
				_updatesSignatures,
			] = contractGameData as [
				bigint,
				`0x${string}`,
				`0x${string}`,
				`0x${string}`,
				number,
				`0x${string}`,
				`0x${string}`,
			];
			if (
				result === 1 &&
				winnerIfNotDraw !== undefined &&
				winnerIfNotDraw !== "0x0000000000000000000000000000000000000000"
			) {
				setWinner(winnerIfNotDraw);
				// call getNftUri() manually?
				refetchNftUriSet();
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
		};
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
			console.log("page visibility changed and is visible");
			if (
				wsRef.current === null ||
				wsRef.current.readyState === WebSocket.CLOSED ||
				wsRef.current.readyState === WebSocket.CLOSING
			) {
				console.log("websocket is closed or closing. starting websocket");
				setLogs((prevLogs) => [
					...prevLogs,
					"isVisible now: websocket is closed or closing. starting websocket",
				]);
				wsRef.current = startWebSocket();
			}
		} else {
			console.log("page visibility changed and is not visible");
		}
		// return () => wsRef.current?.close();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isVisible]);

	useEffect(() => {
		const handleVisibilityChange = () => {
			setIsVisible(document.visibilityState === "visible");
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
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
			} else if (
				(address === player1Address && game.turn() === "w") ||
				(address === player2Address && game.turn() === "b")
			) {
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
			if (
				(game.turn() === "w" && address === player1Address) ||
				(game.turn() === "b" && address === player2Address)
			) {
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

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const processContractGameOverEvent = useCallback(
		(log: any) => {
			console.log("processContractGameOverEvent", log);
			const { gameId, result, winnerIfNotDraw, loserIfNotDraw, creator } = log.args;
			const rawGameId = gameId;
			const bigIntGameId = BigInt(rawGameId as string);
			const contractGameId = Number(bigIntGameId); // As number: 291 (if within safe range)
			// biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
			console.log(`GameOver detected:`);
			console.log(`  Game ID: ${contractGameId}`);
			console.log(`  Result: ${result}`);
			console.log(`  Winner: ${winnerIfNotDraw}`);
			console.log(`  Loser: ${loserIfNotDraw}`);
			console.log(`  Creator: ${creator}`);
			console.log("---");
			showToast("Game result saved to Base", "success", 5000);

			// if the player is the winner, prompt them to mint a winner NFT
			if (result === 1) {
				// draw
				console.log("player is the winner!");
				setWinner(winnerIfNotDraw);
			} else if (winnerIfNotDraw === address) {
				console.log("game is a draw");
			}
		},
		[showToast, address],
	);

	useEffect(() => {
		let unwatch: () => void;
		if (game?.isGameOver()) {
			unwatch = watchContractEvent(frameWagmiConfig, {
				address: contracts.gamesContract[chainId as SupportedChainId].address as `0x${string}`,
				abi: contracts.gamesContract[chainId as SupportedChainId].abi,
				eventName: "GameOver",
				args: {
					gameId: contractGameId,
				},
				onLogs: (logs) => {
					// biome-ignore lint/complexity/noForEach: <explanation>
					logs.forEach((log) => processContractGameOverEvent(log));
				},
				onError: (error) => {
					console.error("Error watching events:", error);
				},
			});
		}

		return () => {
			if (unwatch) unwatch();
		};
	}, [game, contractGameId, chainId, processContractGameOverEvent]);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const processNftUriSetEvent = useCallback(
		(log: any) => {
			console.log("processNftUriSetEvent", log);
			const { gamesContractAddress, gameId, nftUri } = log.args;
			const rawGameId = gameId;
			const bigIntGameId = BigInt(rawGameId as string);
			const contractGameId = Number(bigIntGameId); // As number: 291 (if within safe range)
			// biome-ignore lint/style/noUnusedTemplateLiteral: <explanation>
			console.log(`NftUriSet detected:`);
			console.log(`  Games Contract Address: ${gamesContractAddress}`);
			console.log(`  Game ID: ${contractGameId}`);
			console.log(`  Nft URI: ${nftUri}`);
			console.log("---");

			// if the player is the winner, prompt them to mint a winner NFT
			if (winner === address) {
				console.log("nft uri is set and player is the winner!");
				setIsNFTReadyToMint(true);
			}
		},
		[address, winner],
	);

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
				eventName: "NftUriSet",
				args: {
					gamesContractAddress: contracts.gamesContract[chainId as SupportedChainId]
						.address as `0x${string}`,
					gameId: contractGameId,
				},
				onLogs: (logs) => {
					for (const log of logs) {
						processNftUriSetEvent(log);
					}
				},
				onError: (error) => {
					console.error("Error watching events:", error);
				},
			});
		}

		return () => {
			if (unwatch) unwatch();
		};
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
	};

	const playDropChessPieceSound = async () => {
		audioPlayerDropChessPiece?.play();
	};

	// todo: validate the other user's signature with the move and the pgn
	const onMoveRecieved = (messageData: {
		data: Move;
		type: string;
	}) => {
		// using previous state is required because accessing game within the onMessage callback
		// results in a stale copy of game at the time the callback is registered (undefined)
		setGame((prevGame) => {
			if (!prevGame) {
				console.error("game not initialized");
				return;
			}
			console.log("onMoveRecieved prevGame, messageData:", prevGame, messageData);
			// validate move
			try {
				// if (prevGame.isGameOver()) {
				// todo: this is only needed to get the latest player's signed moves
				// instead, the signatures should be sent with each move
				const message: WsMessage = {
					type: "get-game",
					data: "",
				};
				wsRef.current?.send(JSON.stringify(message));
				// }
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
		});
	};

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
			const message: WsMessage = {
				type: "get-game",
				data: "",
			};
			ws.send(JSON.stringify(message));
		};
		ws.onmessage = async (message: MessageEvent) => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const messageData: {
				data: any;
				type: string;
			} = JSON.parse(message.data);
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
						setLogs((prevLogs) => [
							...prevLogs,
							"received game has less moves than current game. not updating game",
						]);
					} else {
						updateGame(newGame);
					}
					// only needed first time (optimize later)
					if (
						messageData.data.player1Address &&
						messageData.data.player1Address !== player1Address
					) {
						setPlayer1Address(messageData.data.player1Address);
					}
					if (
						messageData.data.player2Address &&
						messageData.data.player2Address !== player2Address
					) {
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
	};

	const closeWebsocket = () => {
		console.log("closing websocket");
		wsRef.current?.close();
	};

	useEffect(() => {
		// Only close the websocket when the component unmounts
		if (
			wsRef.current === null ||
			wsRef.current.readyState === WebSocket.CLOSED ||
			wsRef.current.readyState === WebSocket.CLOSING
		) {
			console.log("websocket is closed or closing. starting websocket");
			setLogs((prevLogs) => [
				...prevLogs,
				"onMount: websocket is closed or closing. starting websocket",
			]);
			wsRef.current = startWebSocket();
		}
		window.addEventListener("beforeunload", closeWebsocket);

		return () => {
			wsRef.current?.close();
			window.removeEventListener("beforeunload", closeWebsocket);
			audioPlayerDrawGame?.pause();
			audioPlayerLoseGame?.pause();
			audioPlayerWinGame?.pause();
			audioPlayerDropChessPiece?.pause();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const signMove = async (
		game: Chess,
		move: {
			from: string;
			to: string;
			promotion: string;
		},
	) => {
		if (!address) {
			console.error("no address");
			return;
		}
		// sign move
		const message = game.pgn();
		// const message = JSON.stringify(moveMove.lan)
		const signature = await signMessage(frameWagmiConfig, {
			message,
		});
		console.log("user move signature:", signature);

		const verified = await verifyMessage(frameWagmiConfig, {
			address,
			message,
			signature,
		});
		console.log("user move signature verified:", verified);

		setAwaitSigningMove(false);
		// update server
		// on mobile, the websocket gets closed while the user is switched to their wallet
		// so we need to wait for the websocket to open before sending the move at least 5 to 10 seconds
		let hasSentMove = false;
		setLogs((prevLogs) => [...prevLogs, `readyState: ${wsRef.current?.readyState}`]);
		if (
			wsRef.current === null ||
			wsRef.current.readyState === WebSocket.CLOSED ||
			wsRef.current.readyState === WebSocket.CLOSING
		) {
			console.log("after signing move: websocket is closed or closing. starting websocket");
			setLogs((prevLogs) => [
				...prevLogs,
				"after signing move: websocket is closed or closing. starting websocket",
			]);
			wsRef.current = startWebSocket();
		}
		if (wsRef.current?.readyState === WebSocket.OPEN) {
			try {
				wsRef.current?.send(
					JSON.stringify({
						type: "move",
						data: {
							...move,
							signature,
							message,
							address,
						},
					}),
				);
				hasSentMove = true;
				setLogs((prevLogs) => [...prevLogs, "move 1st try sent"]);
			} catch (err) {
				console.log("sending move failed:", err);
				setLogs((prevLogs) => [
					...prevLogs,
					`sending move 1st try failed. ${wsRef.current?.readyState}`,
				]);
			}
		}
		setLogs((prevLogs) => [...prevLogs, `readyState: ${wsRef.current?.readyState}`]);
		if (!hasSentMove) {
			console.log("websocket is not open. waiting for 2 seconds before sending move");
			await new Promise((resolve) => setTimeout(resolve, 2000));
			try {
				wsRef.current?.send(
					JSON.stringify({
						type: "move",
						data: {
							...move,
							signature,
							message,
							address,
						},
					}),
				);
				hasSentMove = true;
				setLogs((prevLogs) => [...prevLogs, "move 2nd try sent"]);
			} catch (err) {
				console.log("sending move failed on 2nd try:", err);
				setLogs((prevLogs) => [
					...prevLogs,
					`sending move 2nd try failed. ${wsRef.current?.readyState}`,
				]);
			}
		}
		setLogs((prevLogs) => [...prevLogs, `readyState: ${wsRef.current?.readyState}`]);
		if (!hasSentMove) {
			console.log("websocket is not open. waiting for 5 seconds before sending move");
			await new Promise((resolve) => setTimeout(resolve, 5000));
			try {
				wsRef.current?.send(
					JSON.stringify({
						type: "move",
						data: {
							...move,
							signature,
							message,
							address,
						},
					}),
				);
				hasSentMove = true;
				setLogs((prevLogs) => [...prevLogs, "move 3rd try sent"]);
			} catch (err) {
				console.log("sending move failed on 3rd try:", err);
				setLogs((prevLogs) => [
					...prevLogs,
					`sending move 3rd try failed. ${wsRef.current?.readyState}`,
				]);
			}
		}
		setLogs((prevLogs) => [...prevLogs, `readyState: ${wsRef.current?.readyState}`]);
	};

	/**
	 * Undoes the move if the user doesnt sign it
	 * or sends the move to the server if the user does sign it
	 * @param game the game state with the move already made
	 * @param move the move being made (from, to, promotion) notation
	 */
	async function askUserToSignMove(
		game: Chess,
		move: {
			from: string;
			to: string;
			promotion: string;
		},
	) {
		setAwaitSigningMove(true);
		try {
			// todo: top level onDrop cant be async
			await signMove(game, move);
		} catch (error) {
			console.error("error signing move:", error);
			setLogs((prevLogs) => [...prevLogs, `error signing move: ${error}`]);
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

	function onDrop(sourceSquare: Square, targetSquare: Square) {
		console.log("onDrop game:", game, sourceSquare, targetSquare);
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
			if (move.color === "w" && address !== player1Address) {
				console.error("illegal move: white piece moved by black player");
				game.undo();
				setLogs((prevLogs) => [...prevLogs, "illegal move: white piece moved by black player"]);
				return false;
			}
			if (move.color === "b" && address !== player2Address) {
				console.error("illegal move: black piece moved by white player");
				game.undo();
				setLogs((prevLogs) => [...prevLogs, "illegal move: black piece moved by white player"]);
				return false;
			}

			// update the game state
			console.log("updating game state");
			setLogs((prevLogs) => [
				...prevLogs,
				"updating game state with move, still awaiting user signature",
			]);
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
			});
			setLogs((prevLogs) => [...prevLogs, "askUserToSignMove"]);
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
			verbose: true,
		});
		if (moves.length === 0) {
			setOptionSquares({});
			return false;
		}
		const newSquares: Partial<
			Record<
				Square,
				{
					background: string;
					borderRadius?: string;
				}
			>
		> = {};
		moves.map((move) => {
			newSquares[move.to] = {
				background:
					game.get(move.to) && game?.get(move.to)?.color !== game?.get(square)?.color
						? "radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)"
						: "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
				borderRadius: "50%",
			};
			return move;
		});
		newSquares[square] = {
			background: "rgba(255, 255, 0, 0.4)", // yellow
		};
		setOptionSquares(newSquares);
		return true;
	}

	function onSquareClick(square: Square, piece: string | undefined) {
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
				square: moveFrom as Square,
				verbose: true,
			});
			const foundMove = moves.find((m) => m.from === moveFrom && m.to === square);
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
			const isMoveValid = onDrop(moveFrom as Square, square);
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
		if (
			!wsRef.current ||
			wsRef.current.readyState === WebSocket.CLOSED ||
			wsRef.current.readyState === WebSocket.CLOSING
		) {
			console.log("websocket is closed or closing. starting websocket");
			setLogs((prevLogs) => [...prevLogs, "websocket is closed or closing. starting websocket"]);
			wsRef.current = startWebSocket();
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}
		setLogs((prevLogs) => [...prevLogs, `Health check: websocket is ${wsRef.current?.readyState}`]);
		console.log("sending live-viewers message");
		wsRef.current?.send(
			JSON.stringify({
				type: "live-viewers",
				data: {},
			}),
		);
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
		playerOnTheClock = (game?.turn() === "w" ? player1Address : player2Address) as `0x${string}`;
	}

	useEffect(() => {
		if (
			latestPlayer1Message &&
			latestPlayer2Message &&
			latestPlayer2Message?.length > latestPlayer1Message?.length
		) {
			setLatestSignedMessage(latestPlayer2Message);
			setLatestSignedPlayer(player2Address);
			setLatestSignedSignature(latestPlayer2Signature);
		} else {
			setLatestSignedMessage(latestPlayer1Message);
			setLatestSignedPlayer(player1Address);
			setLatestSignedSignature(latestPlayer1Signature);
		}
	}, [
		latestPlayer1Message,
		latestPlayer2Message,
		player1Address,
		player2Address,
		latestPlayer1Signature,
		latestPlayer2Signature,
	]);

	useEffect(() => {
		let newMintStep: MintStep = -1;
		if (isPendingGameToMintedTokenId) {
			// wait until data is loaded before showing mint btn
			newMintStep = -1;
			return;
		}
		if (game?.isGameOver() === true) {
			newMintStep = 0;
		}
		if (isNFTReadyToMint) {
			newMintStep = 1;
		}
		if (isNFTMinted) {
			newMintStep = 2;
		}
		console.log("MintGameWinNFTBtn newMintStep: ", newMintStep, isNFTReadyToMint, isNFTMinted);
		setMintStep(newMintStep);
	}, [game, isNFTReadyToMint, isNFTMinted, isPendingGameToMintedTokenId]);

	return (
		<>
			{/* icons showing the number of live views and a share url button */}
			<div className="w-full flex flex-row justify-end items-center pr-2 gap-1">
				<div className="flex flex-1 flex-row gap-1 items-space-between">
					<div className="flex-1">
						<Link className={`${buttonVariants({ variant: "link" })} w-fit text-xs`} href={"/"}>
							<ChevronLeft />
							{"Games"}
						</Link>
					</div>

					<div className="flex-1 w-fit">
						{/* {isNFTReadyToMint && !isNFTMinted && <Button
              className="w-fit relative overflow-hidden bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 text-white font-bold hover:from-yellow-500 hover:via-pink-500 hover:to-purple-500 transition-all duration-300 shadow-lg"
              onClick={() => {
                promptUserToMintNFT();
              }}
            >
              <span className="absolute inset-0 w-1/3 h-full bg-white opacity-20 transform -skew-x-12 animate-shine" />
              <Download className="mr-1" size={16} />
              Mint Game Win NFT
            </Button>} */}
					</div>
				</div>
				<TooltipProvider>
					<Tooltip side="bottom">
						<TooltipTrigger>
							<div className="flex flex-row items-center gap-1 group relative text-xs">
								{game && <span>{liveViewers}</span>}
								<Eye size={16} />
							</div>
						</TooltipTrigger>
						<TooltipContent>
							<p>Viewers</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>

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
				<TooltipProvider>
					<Tooltip side="bottom">
						<TooltipTrigger asChild>
							<Button
								onClick={() => {
									navigator.clipboard.writeText(window.location.href);
									alert("Game URL copied!");
								}}
								variant="ghost"
							>
								{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
								{/* <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                </svg> */}
								<Share size={20} />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Share</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				<TooltipProvider>
					<Tooltip side="bottom">
						<TooltipTrigger>
							<span className="text-xs">{params.gameId}</span>
						</TooltipTrigger>
						<TooltipContent>
							<p>Game ID</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
			<div className="w-full flex flex-col md:flex-row md:gap-6">
				{/* Chessboard container */}
				<div ref={chessboardRef} className={"w-full p-2 md:w-1/2 md:p-0 md:pl-6 border-box"}>
					{/* If address is player1 or not player2, show player2's address on top. 
          Board orientation is white on bottom by default. */}
					<div className="flex flex-row pb-2 items-center justify-between">
						<span>
							<DisplayAddress
								address={topAddress as `0x${string}`}
								emphasize={playerOnTheClock === topAddress}
								farcasterData={
									topAddress === player1Address ? player1FarcasterData : player2FarcasterData
								}
							/>
						</span>
						{playerOnTheClock === topAddress && <OnTheClock />}
					</div>
					{game && (
						<Chessboard
							position={game.fen()}
							onPieceDrop={(sourceSquare, targetSquare, _piece) =>
								onDrop(sourceSquare, targetSquare)
							}
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
							}}
						/>
					)}
					{/* If address is player1 or not player2, show player1's address on bottom. 
          Board orientation is white on bottom by default. */}
					<div className="flex flex-row pt-2 items-center justify-between">
						<span>
							<DisplayAddress
								address={bottomAddress as `0x${string}`}
								emphasize={playerOnTheClock === bottomAddress}
								farcasterData={
									bottomAddress === player1Address ? player1FarcasterData : player2FarcasterData
								}
							/>
						</span>
						{playerOnTheClock === bottomAddress && <OnTheClock />}
					</div>
				</div>

				{/* Game info container */}
				<div className="w-full md:w-1/2 border-gray-200 flex flex-col gap-2 p-2 break-words">
					{/* Onchain actions */}
					{game?.isGameOver() === true &&
						isPlayerLocalWinner({
							game,
							address,
							player1Address,
							player2Address,
						}) && (
							<div className="text-center">
								<MintGameWinNFTBtn
									mintStep={mintStep}
									game={game}
									contractGameId={contractGameId}
									message={latestSignedMessage}
									signer={latestSignedPlayer as `0x${string}`}
									signature={latestSignedSignature}
								/>
							</div>
						)}
					{isNFTMinted && (
						<div className="flex flex-col gap-2 mb-6 pl-2 items-center">
							<p>
								NFT Minted!
								<Link
									href={`${blockExplorers[chainId as SupportedChainId]?.url}/nft/${contracts.nftContract[chainId as SupportedChainId]?.address}/${nftTokenId}`}
									className={`${buttonVariants({ variant: "link" })} w-fit`}
									target="_blank"
								>
									View NFT on {blockExplorers[chainId as SupportedChainId]?.name} <ArrowUpRight />
								</Link>
							</p>
							{nftMetadata && (
								<div className="w-[200px] h-[200px]">
									<Image
										src={`https://ipfs.io/ipfs/${nftMetadata?.image.split("//")[1]}`}
										alt="NFT"
										width={780}
										height={780}
										unoptimized
									/>
								</div>
							)}
							{nftMetadata && (
								<div>
									{/* ex: https://basescan.org/nft/0xc43383b7265ebC4DB56df41b8D88289Ec87d1621/5 */}
								</div>
							)}
							{/* hide sync game button if contract game result != 0 or if a winner is already declared */}
						</div>
					)}

					{game && (
						<div className="mb-10">
							<p>
								{game.isGameOver() === true &&
									`Game Over! ${game.turn() === "w" ? "Black Wins!" : "White Wins!"}`}
							</p>
							<p>{game.isGameOver() === false && game.isCheck() ? "Check!" : ""}</p>
							{/* {!game.isGameOver() && <p>Move #{game.history().length + 1}</p>} */}
							<div className="flex flex-col gap-2">
								<p>Moves:</p>
								<div className="flex flex-col gap-2">
									{game
										?.history({
											verbose: true,
										})
										.reduce((acc, move, index, array) => {
											if (index % 2 === 0) {
												const moveNumber = index / 2 + 1;
												const whiteMove = move;
												const blackMove = array[index + 1];

												acc.push(
													<div key={`move-${moveNumber}`} className="flex flex-row gap-2">
														<span className="flex-shrink-0">{moveNumber}.</span>
														<span className="min-w-20">{whiteMove.san}</span>
														<span className="min-w-20">{blackMove?.san}</span>{" "}
														{/* black might not have moved yet */}
														{/* todo show special moves like capture or promotions */}
													</div>,
												);
											}
											return acc;
										}, [] as React.ReactNode[])}
								</div>
							</div>
						</div>
					)}

					{/* ------ Technical info ------ */}
					<h3 className="pt-6 text-h3">Verifiable game state</h3>
					{!isNFTMinted && game?.history().length > 0 && (
						<SyncGameBtn
							game={game}
							contractGameId={contractGameId}
							message={latestSignedMessage}
							signer={latestSignedPlayer as `0x${string}`}
							signature={latestSignedSignature}
						/>
					)}
					<div className="flex flex-row gap-2 items-center">
						<span className="text-sm">Download</span>
						<Button
							type="button"
							onClick={() => {
								// Convert JSON object to string
								const jsonString = JSON.stringify(
									{
										player1Address,
										player2Address,
										latestPlayer1Signature,
										latestPlayer1Message,
										latestPlayer2Signature,
										latestPlayer2Message,
										gameId: params.gameId,
									},
									null,
									2,
								);
								// Create a blob with JSON content and MIME type
								const blob = new Blob([jsonString], {
									type: "application/json",
								});
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
							variant="ghost"
						>
							{/* <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                <title>Download</title>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg> */}
							<Download />
						</Button>
					</div>
					<Accordion type="single" collapsible className="w-full">
						<AccordionItem value="item-1">
							<AccordionTrigger>View</AccordionTrigger>
							<AccordionContent>
								<div className="flex flex-col gap-1">
									{game && <span>Current PGN: {game.pgn()}</span>}
									<br />
									{latestPlayer1Signature && (
										<span>Latest Player 1 Signature: {latestPlayer1Signature}</span>
									)}
									<br />
									{latestPlayer1Message && (
										<span>Latest Player 1 PGN Message: {latestPlayer1Message}</span>
									)}
									<br />
									{latestPlayer2Signature && (
										<span>Latest Player 2 Signature: {latestPlayer2Signature}</span>
									)}
									<br />
									{latestPlayer2Message && (
										<span>Latest Player 2 PGN Message: {latestPlayer2Message}</span>
									)}
									<br />
									{<span>Contract Game ID: {contractGameId}</span>}
									<br />
									{
										<span>
											Contract Game Address:{" "}
											{contracts.gamesContract[chainId as SupportedChainId].address}
										</span>
									}
									<br />
									{
										<span>
											Contract NFT address:{" "}
											{contracts.nftContract[chainId as SupportedChainId].address}
										</span>
									}
								</div>
							</AccordionContent>
						</AccordionItem>
						{isDevMode && (
							<>
								<AccordionItem value="item-2">
									<AccordionTrigger>Debug Info</AccordionTrigger>
									<AccordionContent>
										<div className="flex flex-col gap-2">
											{<p>NFT URI Data: {JSON.stringify(nftUriSetData)}</p>}
											{<p>NFT URI pending: {JSON.stringify(isPendingNftUriSet)}</p>}
											{<p>NFT URI error: {JSON.stringify(errorNftUriSet)}</p>}
											{<p>Game to Minted Token ID Data: {stringify(gameToMintedTokenIdData)}</p>}
											{
												<p>
													Game to Minted Token ID pending:{" "}
													{JSON.stringify(isPendingGameToMintedTokenId)}
												</p>
											}
											{
												<p>
													Game to Minted Token ID error: {JSON.stringify(errorGameToMintedTokenId)}
												</p>
											}
											{logs.map((log, index) => (
												<p key={`${index}-${log.slice(0, 8)}`}>{log}</p>
											))}
										</div>
									</AccordionContent>
								</AccordionItem>
								<AccordionItem value="item-3">
									<AccordionTrigger>Farcaster Context</AccordionTrigger>
									<AccordionContent>
										<div className="flex flex-col gap-2">
											<p>{JSON.stringify(context)}</p>
										</div>
									</AccordionContent>
								</AccordionItem>
							</>
						)}
					</Accordion>
				</div>
			</div>
			<Toast />
		</>
	);
}
