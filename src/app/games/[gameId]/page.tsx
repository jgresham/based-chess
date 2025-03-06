import type { Metadata } from "next";
import Game from "./game";

const appUrl = process.env.NEXT_PUBLIC_URL;
console.log("appUrl", appUrl);
interface Props {
  params: Promise<{
    gameId: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { gameId } = await params;

  const frame = {
    version: "next",
    // imageUrl: `${appUrl}/frames/hello/${name}/opengraph-image`,
    imageUrl: `${appUrl}/based-chess-logo-3-2.jpg`,
    button: {
      title: `LaunchGame ${gameId}`,
      action: {
        type: "launch_frame",
        name: "Game Farcaster Frames v2 Demo",
        url: `${appUrl}/games/${gameId}/`,
        // splashImageUrl: `${appUrl}/splash.png`,
        splashImageUrl: `${appUrl}/based-chess-logo-200.jpg`,
        splashBackgroundColor: "#f7f7f7",
      },
    },
  };

  return {
    title: `Game, ${gameId}`,
    description: `A personalized game frame for ${gameId}`,
    openGraph: {
      title: `Game, ${gameId}`,
      description: `A personalized game frame for ${gameId}`,
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  };
}

export default async function GameFrame() {
  return <Game />;
}
