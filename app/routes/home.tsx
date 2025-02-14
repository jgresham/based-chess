import { useAccount } from 'wagmi'
import { QueryClient } from '@tanstack/react-query'
import { useEffect, useState } from "react";
import { useNavigate } from 'react-router';
import LoadingIcon from '../loadingIcon';
import DisplayAddress from '../DisplayAddress';

export function meta() {
  return [
    { title: "Based Chess" },
    { name: "description", content: "Welcome to Based Chess" },
  ];
}

type GameData = {
  player1Address: `0x${string}` | undefined,
  player2Address: `0x${string}` | undefined,
  gameId: string | undefined,
  liveViewers: number | undefined,
}

export default function Home() {
  const [player2Address, setPlayer2Address] = useState("");
  const [errorCreateGame, setErrorCreateGame] = useState("");
  const [loadingCreateGame, setLoadingCreateGame] = useState(false);
  const [games, setGames] = useState<GameData[]>([]);
  const { address } = useAccount()
  const navigate = useNavigate();

  useEffect(() => {
    if (address) {
      getUserGames();
    } else {
      setGames([]);
    }
  }, [address]);

  const onClickCreateGame = async () => {
    setErrorCreateGame("");
    setLoadingCreateGame(true);
    const httpsProtocol = window.location.protocol === "https:" ? "https" : "https";
    const domain = "chess-worker.johnsgresham.workers.dev";
    const url = `${httpsProtocol}://${domain}/game`;
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ player1Address: address, player2Address }),
    });
    console.log("response:", response);
    const data: { gameId: string } = await response.json();
    console.log("data:", data);
    const gameId = data.gameId;
    if (!gameId) {
      console.error("No gameId in response");
      setErrorCreateGame("Unable to create game");
      setLoadingCreateGame(false);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
    navigate(`/games/${gameId}`);
    setLoadingCreateGame(false);
  }

  const getUserGames = async () => {
    setErrorCreateGame("");
    const httpsProtocol = window.location.protocol === "https:" ? "https" : "http";
    const domain = "chess-worker.johnsgresham.workers.dev";
    // const domain = "localhost:8787";
    const url = `${httpsProtocol}://${domain}/user/games?address=${address}`;
    const response = await fetch(url, {
      method: "GET",
    });
    console.log("response:", response);
    const data: {
      games: GameData[]
    } = await response.json();
    console.log("data:", data);
    const games = data.games;
    if (!games) {
      console.error("No games in response");
      setErrorCreateGame("Unable to get user games");
      setGames([]);
      return;
    }
    setGames(games);
  }

  return (
    <>
      <div className="flex flex-col">
        <div className="flex flex-col gap-2 items-center">
          <p className="text-2xl font-bold">Openly Verifiable Chess</p>
          <p>Own your wins</p>
          <p>Build without permission</p>
        </div>
        <div className="p-4 max-w-sm">
          <div className="border border-gray-300 rounded-lg p-4 flex flex-col gap-2">
            <p className="text-lg font-semibold">New Game</p>
            <label htmlFor="player2AddressInput">Player 2 Address:</label>
            <input type="text" id="player2AddressInput" value={player2Address}
              onChange={(e) => setPlayer2Address(e.target.value)} autoComplete="off"
              data-1p-ignore data-lpignore="true" data-protonpass-ignore="true" />
            <button type="button" disabled={loadingCreateGame} onClick={() => onClickCreateGame()}>{loadingCreateGame ? <LoadingIcon /> : "Create Game"}</button>
          </div>
        </div>
      </div>

      {errorCreateGame && <p>{errorCreateGame}</p>}
      <div className='flex flex-col '>
        {games.length > 0 && <div className="flex flex-row gap-2 items-center justify-center">
          <span>Games</span>
          <button
            type="button"
            onClick={() => {
              // Convert JSON object to string
              const jsonString = JSON.stringify(games, null, 2);
              // Create a blob with JSON content and MIME type
              const blob = new Blob([jsonString], { type: "application/json" });
              // Create a link element
              const link = document.createElement("a");
              // Set download attribute with a filename
              link.download = `games_data_${address}.json`;
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
          </button></div>}
        {games.map((game) => (
          <div key={game.gameId} className="p-4 max-w-lg">
            <div className="border border-gray-300 rounded-lg p-4 gap-2">
              <a href={`/games/${game.gameId}`} className="text-lg font-semibold">Go to Game</a>
              {/* <p>Player 1: {DisplayAddress({ address: game.player1Address })}</p>
              <p>Player 2: {DisplayAddress({ address: game.player2Address })}</p> */}
              <div className='flex flex-row flex-wrap gap-2'>Player 1: <DisplayAddress address={game.player1Address} /></div>
              <div className='flex flex-row flex-wrap gap-2'>Player 2: <DisplayAddress address={game.player2Address} /></div>
              <p>Game: {game.gameId}</p>
              <div className="flex flex-row items-center gap-1">
                {game && <span>{game.liveViewers}</span>}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                  <title>Live Viewers</title>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}


// Displays an ethereum address in a truncated format by showing the first 6 and last 4 characters
export const truncateAddress = (address: `0x${string}` | undefined) => {
  if (!address) {
    return "";
  }
  return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
}

