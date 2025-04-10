"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import { useEffect, useState } from "react";
import { normalize } from "viem/ens";
import { useAccount, useEnsAddress } from "wagmi";
import { mainnetConfig } from "../lib/wagmiconfig";
import { isAddress } from "viem";
import DisplayAddress from "../components/util/DisplayAddress";
import LoadingIcon from "../components/loadingIcon";
import { useRouter } from "next/navigation";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import SearchSelectUser, { type User as FarcasterUserSelect } from "./SearchSelectUser";
import { Tabs, TabsTrigger, TabsList, TabsContent } from "@/components/ui/tabs";
import { useFarcasterContext } from "./hooks/useFarcasterContext";
import { useCoinbaseWallet } from "../context/CoinbaseWalletContext";

export default function NewGameSheet() {
	const [open, setOpen] = useState(false);
	const [player2AddressOrEnsInput, setPlayer2AddressOrEnsInput] = useState("");
	const [normalizedEnsName, setNormalizedEnsName] = useState<string | undefined>(undefined);
	const { data: player2AddressFromEns } = useEnsAddress({
		config: mainnetConfig,
		name: normalizedEnsName || "",
	});
	const [loadingCreateGame, setLoadingCreateGame] = useState(false);
	const [openAfterConnect, setOpenAfterConnect] = useState(false);
	const [errorCreateGame, setErrorCreateGame] = useState("");
	const router = useRouter();
	// const { address } = useAccount();
	const { openConnectModal } = useConnectModal();
	const { data: farcasterContext } = useFarcasterContext();
	const [selectedFarcasterUser, setSelectedFarcasterUser] = useState<FarcasterUserSelect | null>(
		null,
	);
	const {
		isConnected,
		connect,
		disconnect,
		address,
		subAccount,
		createSubAccount,
		subAccountWalletClient,
		provider,
	} = useCoinbaseWallet();

	useEffect(() => {
		if (openAfterConnect && address) {
			setOpen(true);
			setOpenAfterConnect(false);
		}
	}, [address, openAfterConnect]);

	useEffect(() => {
		try {
			setNormalizedEnsName(normalize(player2AddressOrEnsInput));
		} catch (error) {
			console.error("Error normalizing ens name:", error);
			setNormalizedEnsName(undefined);
		}
	}, [player2AddressOrEnsInput]);

	// Prevent the sheet from closing automatically when the button is clicked
	// This allows the onClick method to complete before the sheet closes
	const handleCreateGameClick = async (e: React.MouseEvent) => {
		// Prevent default behavior which closes the sheet
		e.preventDefault();
		await createGame();
		if (!errorCreateGame) {
			setOpen(false);
		}
		// The sheet will remain open until the operation completes
		// It will be redirected by the router.push in onClickCreateGame if successful
	};

	const createGame = async () => {
		setErrorCreateGame("");
		setLoadingCreateGame(true);
		const httpsProtocol = window.location.protocol === "https:" ? "https" : "https";
		const domain = process.env.NEXT_PUBLIC_WORKER_DOMAIN || "chess-worker.johnsgresham.workers.dev";
		const url = `${httpsProtocol}://${domain}/game`;
		// player2Address is the address of the player2 or the address derived from the ens name
		let player2Address = player2AddressFromEns || player2AddressOrEnsInput;
		if (selectedFarcasterUser) {
			console.log("using selected farcaster user", selectedFarcasterUser);
			player2Address = selectedFarcasterUser.preferredEthAddress;
		} else {
			console.log("using ens name or raw address");
		}
		// validate that player2Address is a valid ethereum address
		if (player2Address === address) {
			setErrorCreateGame("Invite someone else to play");
			setLoadingCreateGame(false);
			return;
		}
		if (!isAddress(player2Address)) {
			setErrorCreateGame("Invalid address or ens name");
			setLoadingCreateGame(false);
			return;
		}
		try {
			console.log(
				"creating game with player1Address:",
				address,
				"and player2Address:",
				player2Address,
			);
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
				setLoadingCreateGame(false);
				return;
			}
			await new Promise((resolve) => setTimeout(resolve, 3000));
			router.push(`/games/${gameId}`);
			setLoadingCreateGame(false);
		} catch (error) {
			console.error("Error creating game:", error);
			setErrorCreateGame("Unable to create game");
			setLoadingCreateGame(false);
		}
	};

	const handleInviteFriendClick = (e: React.MouseEvent) => {
		e.preventDefault();
		setOpenAfterConnect(false);
		if (address) {
			setOpen(true);
		} else {
			setOpenAfterConnect(true);
			openConnectModal?.();
		}
	};

	return (
		<div className="grid gap-2">
			<Sheet open={open} onOpenChange={setOpen}>
				<SheetTrigger asChild>
					<Button
						className="w-64 h-14 text-xl rounded-half"
						onClick={(e) => handleInviteFriendClick(e)}
					>
						Invite a Friend
					</Button>
				</SheetTrigger>
				<SheetContent side="bottom">
					<div className="flex justify-center">
						<div className="flex flex-col w-full max-w-lg">
							<SheetHeader>
								<SheetTitle>Invite a friend</SheetTitle>
								{/* <SheetDescription>Choose how to invite your friend</SheetDescription> */}
							</SheetHeader>
							<div className="py-4 flex flex-col gap-2">
								<Tabs defaultValue={"farcaster"} className="w-full">
									<TabsList className="grid w-full grid-cols-2">
										<TabsTrigger value="farcaster">Farcaster</TabsTrigger>
										<TabsTrigger value="address">Address/ENS</TabsTrigger>
									</TabsList>
									<TabsContent value="farcaster" className="mt-4 min-h-[330px] md:min-h-[150px]">
										<SearchSelectUser
											onSelect={(user) => {
												console.log("NewGameSheet: onSelect user:", user);
												setSelectedFarcasterUser(user);
											}}
										/>
									</TabsContent>
									<TabsContent value="address" className="mt-4 min-h-[130px]">
										<div className="mb-4">
											Enter their{" "}
											<Link
												href="https://www.base.org/"
												target="_blank"
												className="text-blue-500 hover:underline"
											>
												Base
											</Link>{" "}
											account address or ENS name
										</div>
										<Input
											type="text"
											id="player2AddressInput"
											value={player2AddressOrEnsInput}
											onChange={(e) => setPlayer2AddressOrEnsInput(e.target.value)}
											autoComplete="off"
											data-1p-ignore
											data-lpignore="true"
											data-protonpass-ignore="true"
											placeholder="address or ens"
											className="mb-2"
										/>
										{
											<DisplayAddress
												address={player2AddressFromEns as `0x${string}`}
												showAddress={player2AddressOrEnsInput.includes(".eth")}
											/>
										}
									</TabsContent>
								</Tabs>
								{errorCreateGame && (
									<div className="flex flex-row gap-2 items-center justify-center text-red-500">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											strokeWidth={1.5}
											stroke="currentColor"
											className="size-6"
										>
											<title>Error</title>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
											/>
										</svg>
										<span className="text-red-500">{errorCreateGame}</span>
									</div>
								)}
							</div>
							<SheetFooter className="pb-20">
								<SheetClose asChild>
									<Button
										type="button"
										disabled={loadingCreateGame || !address}
										onClick={handleCreateGameClick}
									>
										{loadingCreateGame ? <LoadingIcon /> : "New Game"}
									</Button>
								</SheetClose>
							</SheetFooter>
						</div>
					</div>
				</SheetContent>
			</Sheet>
		</div>
	);
}
