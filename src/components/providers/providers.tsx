"use client";
import FrameProvider from "./wagmiWithFrameProvider";
import { lightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import sdk, { type Context } from "@farcaster/frame-sdk";
import { useState, useEffect } from "react";
import { darkTheme } from "@rainbow-me/rainbowkit";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { useTheme } from "next-themes";
import { CoinbaseWalletProvider } from "@/context/CoinbaseWalletContext";

export default function Providers({ children }: { children: React.ReactNode }) {
	const [mounted, setMounted] = useState(false);
	const [isSDKLoaded, setIsSDKLoaded] = useState(false);
	const [_context, setContext] = useState<Context.FrameContext>();
	const { resolvedTheme } = useTheme();
	console.log("Providers theme: ", resolvedTheme);

	useEffect(() => {
		setMounted(true);
	}, []);

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

	// wait for client mounting for user's local preference of theme to load
	if (!mounted) {
		return null;
	}

	return (
		<FrameProvider>
			<RainbowKitProvider>
				<CoinbaseWalletProvider>
					{/* To provide theme for RainbowKit in Providers */}
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						{children}
					</ThemeProvider>
				</CoinbaseWalletProvider>
			</RainbowKitProvider>
		</FrameProvider>
	);
}
