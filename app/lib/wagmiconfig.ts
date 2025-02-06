import { http } from "wagmi";
import { createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { frameConnector } from "./frameConnector";

export const frameWagmiConfig = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [frameConnector()],
  ssr: false,
});