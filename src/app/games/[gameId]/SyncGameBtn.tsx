import type { Chess } from "chess.js";
import { useChainId, useSimulateContract, useWriteContract } from "wagmi";
import { contracts, type SupportedChainId } from "../../../lib/contracts";

export function SyncGameBtn({ game, contractGameId, message, signer, signature }: { game?: Chess, contractGameId?: number, message?: string, signer?: `0x${string}`, signature?: `0x${string}` }) {
  const { writeContract, isPending, error, data: txHash } = useWriteContract();
  const chainId = useChainId();
  console.log("SyncGameBtn", contractGameId, message, signature, signer, chainId);
  const { data: simulation, error: simulationError } = useSimulateContract({
    address: contracts.gamesContract[chainId as SupportedChainId].address as `0x${string}`,
    abi: contracts.gamesContract[chainId as SupportedChainId].abi,
    functionName: "syncGame",
    args: [contractGameId, message, signature, signer], // gameId, message, signature, address signer
  });


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
      console.error(chainId, contractGameId, message, signature, signer)
      return;
    }
    const tx = await writeContract({ ...simulation.request });
    console.log("tx: ", tx);
  }

  return (<>
    <button type="button" onClick={onClickSyncGame}>Sync Game on Base</button>
    {txHash && <p>txHash: {txHash}</p>}
    {isPending && <p>isPending: {isPending}</p>}
    {error && <p>error: {error.toString()}</p>}

  </>)
}
