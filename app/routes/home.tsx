import { useAccount } from 'wagmi'
import { QueryClient } from '@tanstack/react-query'
import { useState } from "react";
import { useNavigate } from 'react-router';

export function meta() {
  return [
    { title: "Based Chess" },
    { name: "description", content: "Welcome to Based Chess" },
  ];
}

export default function Home() {
  const [player2Address, setPlayer2Address] = useState("");
  const [errorCreateGame, setErrorCreateGame] = useState("");
  const { address } = useAccount()
  const navigate = useNavigate();

  const onClickCreateGame = async () => {
    setErrorCreateGame("");
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
      return;
    }
    navigate(`/games/${gameId}`);
  }

  return (
    <>
      <p>Home</p>
      <label htmlFor="player2AddressInput">Player 2 Address:</label>
      <input type="text" id="player2AddressInput" value={player2Address} onChange={(e) => setPlayer2Address(e.target.value)} />
      <button type="button" onClick={() => onClickCreateGame()}>Create Game</button>
      {errorCreateGame && <p>{errorCreateGame}</p>}
    </>
  )
}

