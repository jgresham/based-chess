import type { Abi } from "viem";

const gamesContractAbi =
  [{ "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" }], "name": "GameCreated", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" }, { "indexed": false, "internalType": "uint8", "name": "result", "type": "uint8" }, { "indexed": false, "internalType": "address", "name": "winner", "type": "address" }], "name": "GameOver", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" }, { "indexed": false, "internalType": "string", "name": "message", "type": "string" }, { "indexed": false, "internalType": "bytes", "name": "signature", "type": "bytes" }, { "indexed": false, "internalType": "address", "name": "signer", "type": "address" }, { "indexed": false, "internalType": "uint8", "name": "updateIndex", "type": "uint8" }], "name": "GameUpdateSynced", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "player1", "type": "address" }, { "internalType": "address", "name": "player2", "type": "address" }], "name": "createGame", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "id", "type": "uint256" }], "name": "getGame", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "address", "name": "", "type": "address" }, { "internalType": "address", "name": "", "type": "address" }, { "internalType": "address", "name": "", "type": "address" }, { "internalType": "uint8", "name": "", "type": "uint8" }, { "internalType": "address", "name": "", "type": "address" }, { "components": [{ "internalType": "bytes", "name": "signature", "type": "bytes" }, { "internalType": "address", "name": "signer", "type": "address" }], "internalType": "struct GameUpdate[]", "name": "", "type": "tuple[]" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "address", "name": "verifier", "type": "address" }], "name": "getGameUpdateVerificationsByVerifier", "outputs": [{ "internalType": "uint8[]", "name": "", "type": "uint8[]" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "address", "name": "player", "type": "address" }], "name": "isWinner", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "string", "name": "message", "type": "string" }, { "internalType": "bytes", "name": "signature", "type": "bytes" }, { "internalType": "address", "name": "signer", "type": "address" }], "name": "syncGame", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "uint8", "name": "updateVerified", "type": "uint8" }, { "internalType": "uint8", "name": "result", "type": "uint8" }, { "internalType": "address", "name": "winner", "type": "address" }], "name": "verifyGameUpdate", "outputs": [], "stateMutability": "nonpayable", "type": "function" }]

export type SupportedChainId = 8453 | 84532;

export const contracts: Record<string, {
  [key in SupportedChainId]: {
    address: `0x${string}`;
    abi: Abi;
  }
}> = {
  gamesContract: {
    // base
    [8453]: {
      address: "0xa10b8A70bf736E29a69e7E8a45123b5170183076",
      abi: gamesContractAbi as Abi
    },
    // base sepolia
    [84532]: {
      address: "0xcdE23279388854b857524319284DB2d9df1533aF",
      abi: gamesContractAbi as Abi
    }
  }
}
