import type { Metadata } from "next";
import Game from "./game";
import { HEIGHT, WIDTH } from "../../images/games/[gameId]/opengraph-image/route";

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
    imageUrl: `${appUrl}/images/games/${gameId}/opengraph-image?`,
    button: {
      title: "View Game",
      action: {
        type: "launch_frame",
        name: "Based Chess",
        url: `${appUrl}/games/${gameId}/`,
        // splashImageUrl: `${appUrl}/splash.png`,
        splashImageUrl: `${appUrl}/based-chess-logo-200.jpg`,
        splashBackgroundColor: "#f7f7f7",
      },
    },
  };

  const now = new Date().getTime();

  return {
    title: "Based Chess",
    description: `Game ${gameId}`,
    openGraph: {
      title: "Based Chess",
      description: `Game ${gameId}`,
      images: [
        {
          url: `${appUrl}/images/games/${gameId}/opengraph-image?${now}`,
          width: WIDTH,
          height: HEIGHT,
        },
      ],
    },
    other: {
      "fc:frame": JSON.stringify(frame),
      "og:updated_time": now,
    },
  };
}

export default async function GameFrame() {
  return <Game />;
}
