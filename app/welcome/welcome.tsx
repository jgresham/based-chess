import { useAccount, useEnsName } from 'wagmi'
import { WalletOptions } from './wallet-options'
import { Account } from './account'
import { useState } from "react";
import { useEffect } from "react";
import { use } from "react";
import type { Route } from '../+types/root';
import { ChessSocket } from './chess-socket';


function ConnectWallet() {
  const { isConnected } = useAccount()
  if (isConnected) return <Account />
  return <WalletOptions />
}

// export async function loader({ params, context }: Route.LoaderArgs) {
//   console.log("context:", context);
//   const ctxCf = context.cloudflare;
//   const id = ctxCf.env.CURSOR_SESSIONS.idFromName("globalRoom");
//   console.log("id:", id);
//   const stub = ctxCf.env.CURSOR_SESSIONS.get(id);
//   console.log("stub:", stub.sessions);
//   // const product = await fakeDb.getProduct(params.pid);
//   console.log("params:", params);
//   return true;
// }

export function Welcome() {
  // console.log("loaderData:", loaderData);

  const { address } = useAccount()
  const { data: ensName } = useEnsName({ address })
  // const [game, setGame] = useState(new Chess("r1k4r/p2nb1p1/2b4p/1p1n1p2/2PP4/3Q1NB1/1P3PPP/R5K1 b - c3 0 19"));

  
  // useEffect(() => {
  //   console.log("game:", game);
  // }, [game]);



  return (
    <main className="flex flex-col items-center justify-center h-full w-full">
      <div>Based Chess </div>
      <div><ConnectWallet /></div>
      <div></div>

          <ChessSocket />


      <div>Code at <a href="https://github.com/jgresham/based-chess">github.com/jgresham/based-chess</a></div>
      {/* </div> */}
      {/* <div className="flex-1 flex flex-col items-center gap-16 min-h-0"> */}
        {/* <header className="flex flex-col items-center gap-9">
          <div className="w-[500px] max-w-[100vw] p-4">
            <img
              src={logoLight}
              alt="React Router"
              className="block w-full dark:hidden"
            />
            <img
              src={logoDark}
              alt="React Router"
              className="hidden w-full dark:block"
            />
          </div>
        </header> */}
        {/* <div className="max-w-[300px] w-full space-y-6 px-4">

          <nav className="rounded-3xl border border-gray-200 p-6 dark:border-gray-700 space-y-4">
            <p className="leading-6 text-gray-700 dark:text-gray-200 text-center">
              What&apos;s next?
            </p>
            <ul>
              {resources.map(({ href, text, icon }) => (
                <li key={href}>
                  <a
                    className="group flex items-center gap-3 self-stretch p-3 leading-normal text-blue-700 hover:underline dark:text-blue-500"
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {icon}
                    {text}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div> */}
      {/* </div> */}
    </main>
  );
}
