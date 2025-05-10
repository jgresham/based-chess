"use client";
import { ArrowUpRight } from "lucide-react";
import { contracts, type SupportedChainId } from "../lib/contracts";
import { blockExplorers } from "../lib/contracts";
import { buttonVariants } from "../components/ui/button";
// import { useAccount } from "wagmi";
import Link from "next/link";
import { DarkModeToggle } from "../components/DarkModeToggle";
import { DevModeToggle } from "../components/DevModeToggle";
// import { useCoinbaseWallet } from "../context/CoinbaseWalletContext";

export const Footer = () => {
	// const { chainId } = useAccount();
	const chainId: SupportedChainId = 84532;

	return (
		<div className="flex flex-col w-full space-between items-center justify-center pt-16 pb-8 pr-8 pl-8 gap-2">
			<div className="flex flex-row flex-wrap gap-2 items-center justify-center">
				<Link
					href={`${blockExplorers[chainId as SupportedChainId]?.url}/address/${contracts.gamesContract[chainId as SupportedChainId]?.address}`}
					className={`${buttonVariants({ variant: "link" })} w-fit`}
					target="_blank"
				>
					Games Contract <ArrowUpRight />
				</Link>
				<Link
					href={`${blockExplorers[chainId as SupportedChainId]?.url}/address/${contracts.nftContract[chainId as SupportedChainId]?.address}`}
					className={`${buttonVariants({ variant: "link" })} w-fit`}
					target="_blank"
				>
					GameWin NFT Contract <ArrowUpRight />
				</Link>
			</div>
			<div className="flex flex-row flex-wrap gap-2 items-center justify-center">
				<DarkModeToggle />
				<a href="https://github.com/jgresham/based-chess">Based Chess Github</a>
				<DevModeToggle />
			</div>
		</div>
	);
};
