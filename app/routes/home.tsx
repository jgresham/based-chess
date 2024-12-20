import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Based Chess" },
    { name: "description", content: "Welcome to Based Chess" },
  ];
}

export default function Home() {
  return <Welcome />;
}
