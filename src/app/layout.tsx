import type { Metadata } from "next";
import localFont from "next/font/local";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import "./globals.css";
import Providers from "../components/providers/providers";
import "../../node_modules/@rainbow-me/rainbowkit/dist/index.css";
import Link from "next/link";
import Image from "next/image";
import { Footer } from "./footer";
import { useDevMode } from "../components/hooks/useLocalSettings";
import { ErudaEnabler } from "../components/util/ErudaEnabler";
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
						<div className="flex flex-row items-center justify-between w-full p-2">
							<Link href={"/"}>
								<div className="flex flex-row items-center gap-2">
									<Image
										src="/based-chess-logo-200.jpg"
										alt="Based Chess Logo"
										width={32}
										height={32}
										unoptimized
									/>
									<div className="font-bold hidden sm:block">Based Chess</div>
								</div>
							</Link>
							{process.env.NEXT_PUBLIC_WORKER_DOMAIN?.includes("localhost") && (
								<div className="text-xs text-green-500">DEV</div>
							)}
							{process.env.NEXT_PUBLIC_WORKER_DOMAIN?.includes("staging") && (
								<div className="text-xs text-yellow-500">STAGING</div>
							)}
							<div>
								<ConnectButton />
							</div>
						</div>
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
