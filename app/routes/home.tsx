import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { WagmiProvider } from 'wagmi'
import { config } from '../wagmiconfig'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export function meta() {
  return [
    { title: "Based Chess" },
    { name: "description", content: "Welcome to Based Chess" },
  ];
}

export default function Home() {

  return (
    <>
      <p>Home</p>
    </>
  )
}
