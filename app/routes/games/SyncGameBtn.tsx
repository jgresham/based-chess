import type { Chess } from "chess.js";
import { useChainId, useWriteContract } from "wagmi";
import { contracts, type SupportedChainId } from "../../util/contracts";
import { toBytes } from "viem";

export function SyncGameBtn({ game, contractGameId, message, signer, signature }: { game?: Chess, contractGameId?: number, message?: string, signer?: `0x${string}`, signature?: `0x${string}` }) {
  const { writeContract, isPending, error, data: txHash } = useWriteContract();
  const chainId = useChainId();

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

    const tx = await writeContract({
      address: contracts.gamesContract[chainId as SupportedChainId].address as `0x${string}`,
      abi: contracts.gamesContract[chainId as SupportedChainId].abi,
      functionName: "syncGame",
      args: [contractGameId, message, signature, signer], // gameId, message, signature, address signer
    });
    console.log("tx: ", tx);
  }

  return (<>
    <button type="button" onClick={onClickSyncGame}>Sync Game on Base</button>
    {txHash && <p>txHash: {txHash}</p>}
    {isPending && <p>isPending: {isPending}</p>}
    {error && <p>error: {error.toString()}</p>}

  </>)
}
