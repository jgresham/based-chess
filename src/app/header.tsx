"use client";
import Link from "next/link";
import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export const Header = () => {
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
				<div className="text-xs text-yellow-500">STAGING</div>
			)}
			<div>
				<ConnectButton />
			</div>
		</div>
	);
};
