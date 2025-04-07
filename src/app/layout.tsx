import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "../components/providers/providers";
import "../../node_modules/@rainbow-me/rainbowkit/dist/index.css";
import { Footer } from "./footer";
import { useDevMode } from "../components/hooks/useLocalSettings";
import { ErudaEnabler } from "../components/util/ErudaEnabler";
import { Header } from "./header";
const geistSans = localFont({
	src: "./fonts/GeistVF.woff",
	variable: "--font-geist-sans",
	weight: "100 900",
});
const geistMono = localFont({
	src: "./fonts/GeistMonoVF.woff",
	variable: "--font-geist-mono",
	weight: "100 900",
});

// // todo: ensure all these are set from pre-nextjs
// {/* <meta property="og:title" content="Based Chess" />
// <meta property="og:url" content="https://basedchess.xyz" />
// <meta property="og:image" content="https://basedchess.xyz/based-chess-logo.jpg" />

// <meta name="twitter:card" content="summary_large_image" />
// <meta property="twitter:domain" content="basedchess.xyz" />
// <meta property="twitter:url" content="https://basedchess.xyz" />
// <meta name="twitter:title" content="Based Chess" />
// <meta name="twitter:description" content="Welcome to Based Chess" />
// <meta name="twitter:image" content="https://basedchess.xyz/based-chess-logo.jpg" /> */}

export function generateMetadata(): Metadata {
	const appUrl = process.env.NEXT_PUBLIC_URL;
	console.log("Layout appUrl: ", appUrl);
	const imageUrl = `${appUrl}/ogimage.jpg`;
	console.log("Layout imageUrl: ", imageUrl);
	const splashImageUrl = `${appUrl}/based-chess-logo-200.jpg`;
	console.log("Layout splashImageUrl: ", splashImageUrl);
	const icon = `${appUrl}/based-chess-logo-200.jpg`;
	console.log("Layout icon: ", icon);
	return {
		title: "Based Chess",
		description: "Chess onchain",
		openGraph: {
			title: "Based Chess",
			description: "Chess onchain",
			images: [
				{
					url: imageUrl,
					width: 1200,
					height: 800,
				},
			],
		},
		icons: {
			icon,
		},
		other: {
			"fc:frame": JSON.stringify({
				version: "next",
				imageUrl,
				button: {
					title: "Play Chess",
					action: {
						type: "launch_frame",
						name: "Based Chess",
						url: `${appUrl}/`,
						splashImageUrl,
						splashBackgroundColor: "#ffffff",
					},
				},
			}),
		},
	};
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		// Note! If you do not add suppressHydrationWarning to your <html> you will get
		// warnings because next-themes updates that element. This property only applies
		//  one level deep, so it won't block hydration warnings on other elements.
		<html lang="en" suppressHydrationWarning>
			<body
				className={`bg-background text-foreground ${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Providers>
					{/* // 98% to leave room for vertical scrollbar */}
					<main className="flex flex-col items-center h-full w-[98%] justify-self-center">
						<Header />
						{children}
						{/* <div className='flex flex-row items-center justify-end w-full p-2'> */}
						<Footer />
						{/* </div> */}
					</main>
					<ErudaEnabler />
				</Providers>
			</body>
		</html>
	);
}
