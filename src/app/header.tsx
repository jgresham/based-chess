"use client";

import { Button } from "../components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useCoinbaseWallet } from "../context/CoinbaseWalletContext";
import DisplayAddress from "../components/util/DisplayAddress";

export const Header = () => {
	const { isConnected, connect, disconnect, address, subAccount, createSubAccount } =
		useCoinbaseWallet();

	return (
		<div className="flex sm:flex-row flex-wrap items-center justify-between w-full p-2">
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
				<div className="text-xs text-yellow-500">Sub Accounts Demo</div>
			)}
			<div>
				{/* <ConnectButton /> */}
				{isConnected ? (
					<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
						<span>
							Account: <DisplayAddress address={address} />
						</span>

						{!subAccount && (
							<Button type="button" onClick={createSubAccount} className="w-fit">
								<span className="text-xs">Create Sub Account</span>
							</Button>
						)}

						{subAccount && (
							<span>
								Sub Account: <DisplayAddress address={subAccount} />
							</span>
						)}

						<Button type="button" onClick={disconnect} className="w-fit">
							<span className="text-xs">Disconnect Wallet</span>
						</Button>
					</div>
				) : (
					<Button type="button" onClick={connect} className="w-fit">
						<span className="text-xs">Connect Wallet</span>
					</Button>
				)}
			</div>
		</div>
	);
};
