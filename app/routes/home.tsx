import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { WagmiProvider } from 'wagmi'
import { config } from './wagmiconfig'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

// async function closeSessions() {
//   "use server";
//   const cf = await getCloudflareContext();

//   // Use in dev env and comment below 3 lines
//   // await cf.env.RPC_SERVICE.closeSessions();

//   // Note: Not supported in `wrangler dev`
//   const id = cf.env.CURSOR_SESSIONS.idFromName("globalRoom");
//   const stub = cf.env.CURSOR_SESSIONS.get(id);
//   await stub.closeSessions();
// }

export async function loader({ params, context }: Route.LoaderArgs) {
  console.log("context:", context);
  const ctxCf = context.cloudflare;
  // const id = ctxCf.env.RPC_SERVICE.functionSuppInDev()

  // not supported in wrangler dev
  const id = ctxCf.env.CHESS_GAME.idFromName("globalRoom");
  console.log("id:", id);
  // not supported in wrangler dev
  const stub = ctxCf.env.CHESS_GAME.get(id);
  console.log("stub:", stub);
  // only supported in wrangler dev env
  const game = await ctxCf.env.RPC_SERVICE.getGameFEN()
  console.log("game:", game);

  // const product = await fakeDb.getProduct(params.pid);
  console.log("params:", params);
  return true;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Based Chess" },
    { name: "description", content: "Welcome to Based Chess" },
  ];
}

export default function Home({
  loaderData,
}: Route.ComponentProps) {
  console.log("loaderData:", loaderData);
  return <>
      <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Welcome />
        </QueryClientProvider>
        </WagmiProvider>
        </>
}
