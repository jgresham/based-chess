import { useEnsName, useEnsAvatar } from "wagmi";
import { mainnet } from "wagmi/chains";
import { mainnetConfig } from "../../lib/wagmiconfig";
import { normalize } from "viem/ens";
import { EmojiAvatar } from "./EmojiAvatar";
import type { FarcasterUser } from "../../lib/neynar.server";
import { Check } from "lucide-react";
import { Copy } from "lucide-react";
import { useState } from "react";

// Displays an ethereum address in a truncated format by showing the first 6 and last 4 characters
export const truncateAddress = (address: `0x${string}` | undefined) => {
	if (!address) {
		return "";
	}
	return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
};

export default function DisplayAddress({
	address,
	farcasterData,
	showAddress = false,
	emphasize = false,
}: {
	address: `0x${string}` | undefined;
	farcasterData?: FarcasterUser;
	showAddress?: boolean;
	emphasize?: boolean;
}) {
	const { data: ensName } = useEnsName({ config: mainnetConfig, address, chainId: mainnet.id });
	const { data: avatarURL } = useEnsAvatar({
		name: normalize(ensName ?? ""),
		config: mainnetConfig,
		chainId: mainnet.id,
	});
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		if (!address) return;
		navigator.clipboard.writeText(address);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="flex flex-row items-center gap-2">
			<EmojiAvatar
				address={address || ""}
				ensImage={farcasterData?.pfp_url ? farcasterData.pfp_url : (avatarURL ?? "")}
				size={24}
			/>
			{/* <img className={`w-6 h-6 rounded-full ${avatarURL ? 'visible' : 'invisible'}`} src={avatarURL} alt="avatar" /> */}
			{showAddress || (!ensName && !farcasterData) ? (
				<span className={`${emphasize ? "font-bold" : ""}`}>{truncateAddress(address)}</span>
			) : (
				<span className={`${emphasize ? "font-bold" : ""}`}>
					{farcasterData?.username ? farcasterData.username : ensName}
				</span>
			)}
			<button
				type="button"
				onClick={handleCopy}
				className="p-1 rounded-md transition-all duration-200 hover:bg-gray-200 hover:scale-120 dark:hover:bg-gray-700 touch-manipulation"
				aria-label="Copy address to clipboard"
			>
				{copied ? (
					<Check color="green" className="w-3 h-3 md:w-4 md:h-4" />
				) : (
					<Copy
						className="w-3 h-3 md:w-4 md:h-4 transition-all duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 touch-manipulation"
						color="gray"
					/>
				)}
			</button>
		</div>
	);
}
