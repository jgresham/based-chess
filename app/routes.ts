import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";
import { lazy } from "react";

// const Game = lazy(() => import('routes/games/game.tsx'));

export default [
  layout("layouts/wallet-header-footer.tsx", [
    index("routes/home.tsx"),
    route("games/:gameId", "routes/games/game.tsx"),
  ]),
] satisfies RouteConfig;
