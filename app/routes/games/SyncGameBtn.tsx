import type { Chess } from "chess.js";
import { useChainId, useWriteContract } from "wagmi";
import { contracts, type SupportedChainId } from "../../util/contracts";

export function SyncGameBtn({ game, message, signer, signature }: { game?: Chess, message?: string, signer?: `0x${string}`, signature?: `0x${string}` }) {
  const { writeContract, isPending, error, data: txHash } = useWriteContract();
  const { writeContract: writeContract2, isPending: isPending2, error: error2, data: txHash2 } = useWriteContract();
  const chainId = useChainId();

  const onClickSyncGame = async () => {
    console.log("onClickSyncGame");
    if (!game) {
      console.error("game not found");
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
    // const tx2 = await writeContract2({
    //   address: contracts.gamesContract[chainId as SupportedChainId].address as `0x${string}`,
    //   abi: contracts.gamesContract[chainId as SupportedChainId].abi,
    //   functionName: "createGame",
    //   args: [], // game string, gameId
    // });
    // console.log("tx2: ", tx2);

    // const verifyMessage = await signMessage({
    //   message: game.pgn(),
    //   signature: "0x123",
    //   address: "0x123",
    // });
    // console.log("verifyMessage: ", verifyMessage);

    const tx = await writeContract({
      address: contracts.gamesContract[chainId as SupportedChainId].address as `0x${string}`,
      abi: contracts.gamesContract[chainId as SupportedChainId].abi,
      functionName: "syncGame",
      args: [0, message, signature, signer], // gameId, message, signature, address signer
    });
    console.log("tx: ", tx);
  }

  return (<>
    <button type="button" onClick={onClickSyncGame}>Sync Game</button>
    {txHash && <p>txHash: {txHash}</p>}
    {isPending && <p>isPending: {isPending}</p>}
    {error && <p>error: {error.toString()}</p>}

  </>)
}