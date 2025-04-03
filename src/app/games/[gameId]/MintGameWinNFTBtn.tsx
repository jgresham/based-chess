"use client";

import { useState, useCallback, useEffect } from "react";
import type { Chess } from "chess.js";
import { useChainId, useSimulateContract, useWriteContract } from "wagmi";
import { waitForTransactionReceipt, writeContract } from "@wagmi/core";

import { contracts, type SupportedChainId } from "../../../lib/contracts";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { frameWagmiConfig } from "../../../lib/wagmiconfig";
import LoadingIcon from "../../../components/loadingIcon";

export type MintStep = -1 | 0 | 1 | 2; // -1: not a game winner yet, 0: sync game, 1: NFT ready to mint, 2: NFT minted

export function MintGameWinNFTBtn({
	mintStep,
	game,
	contractGameId,
	message,
	signer,
	signature,
}: {
	mintStep: MintStep;
	game?: Chess;
	contractGameId?: number;
	message?: string;
	signer?: `0x${string}`;
	signature?: `0x${string}`;
}) {
	const {
		writeContract: writeContractGame,
		isPending: isPendingGame,
		error: errorGame,
		data: txHashGame,
	} = useWriteContract();
	// const { writeContract: writeContractNFT, isPending: isPendingNFT, error: errorNFT, data: txHashNFT } = useWriteContract();
	const chainId = useChainId();
	const [isSyncingGame, setIsSyncingGame] = useState(false);
	const [isMintingNFT, setIsMintingNFT] = useState(false);
	// console.log("SyncGameBtn", contractGameId, message, signature, signer, chainId);
	const { data: simulation, error: simulationError } = useSimulateContract({
		address: contracts.gamesContract[chainId as SupportedChainId].address as `0x${string}`,
		abi: contracts.gamesContract[chainId as SupportedChainId].abi,
		functionName: "syncGame",
		args: [contractGameId, message, signature, signer], // gameId, message, signature, address signer
	});

	useEffect(() => {
		if (mintStep !== 0) {
			setIsSyncingGame(false);
		}
	}, [mintStep]);

	console.log("MintGameWinNFTBtn message, signer: ", message, signature);

	const onClickSyncGame = async () => {
		console.log("onClickSyncGame");
		if (!game) {
			console.error("game not found");
			return;
		}
		if (contractGameId === undefined) {
			console.error("contractGameId not found");
			return;
		}
		if (!signer) {
			console.error("signer not found");
			return;
		}
		if (!(chainId as SupportedChainId)) {
			console.error(`chainId not supported: ${chainId}`);
			return;
		}

		if (!contracts.gamesContract[chainId as SupportedChainId]) {
			console.error(`Contract address and abi not found for chainId: ${chainId}`);
			return;
		}

		console.log("simulateResult: ", simulation);

		if (!simulation) {
			console.error("simulation not found");
			console.error(simulationError);
			console.error(chainId, contractGameId, message, signature, signer);
			return;
		}
		setIsSyncingGame(true);
		const tx = await writeContractGame({
			...simulation.request,
		});
		console.log("tx: ", tx);
	};

	const promptUserToMintNFT = useCallback(async () => {
		// todo simulate contract
		try {
			const txHash = await writeContract(frameWagmiConfig, {
				address: contracts.nftContract[chainId as SupportedChainId].address as `0x${string}`,
				abi: contracts.nftContract[chainId as SupportedChainId].abi,
				functionName: "mintWinNFT",
				args: [contracts.gamesContract[chainId as SupportedChainId].address, contractGameId], // gameId, message, signature, address signer
			});
			console.log("promptUserToMintNFT txHash: ", txHash);

			const tx = await waitForTransactionReceipt(frameWagmiConfig, {
				hash: txHash,
			});
			console.log("promptUserToMintNFT tx: ", tx);
			window.location.reload();
		} catch (error) {
			console.error("promptUserToMintNFT error: ", error);
		}
	}, [chainId, contractGameId]);

	const onClickMintNFT = async () => {
		console.log("onClickMintNFT");
		if (mintStep === 0) {
			await onClickSyncGame();
		} else if (mintStep === 1) {
			setIsMintingNFT(true);
			await promptUserToMintNFT();
			setIsMintingNFT(false);
		}
	};

	const buttonText =
		mintStep === 0 ? "Mint Game Win NFT (step 1/2)" : "Mint Game Win NFT (step 2/2)";
	// if (isSyncingGame || isMintingNFT) {
	// 	buttonText += " ...";
	// }
	// {/* {txHash && <p>txHash: {txHash}</p>}
	//   {isPending && <p>isPending: {isPending}</p>}
	//   {error && <p>error: {error.toString()}</p>} */}

	console.log(" MintGameWinNFTBtnmintStep: ", mintStep, isMintingNFT);
	return (
		<div className={`${mintStep === -1 || mintStep === 2 ? "hidden" : ""}`}>
			<Button
				variant="outline"
				disabled={isSyncingGame || isMintingNFT}
				onClick={onClickMintNFT}
				className="w-fit relative overflow-hidden bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 text-white font-bold hover:from-yellow-500 hover:via-pink-500 hover:to-purple-500 transition-all duration-300 shadow-lg border-0"
			>
				<span className="absolute inset-0 w-1/3 h-full bg-white opacity-20 transform -skew-x-12 animate-shine" />
				<Download className="mr-1" size={16} />
				{buttonText}
				{isSyncingGame || isMintingNFT ? <LoadingIcon /> : null}
			</Button>
		</div>
	);
}
