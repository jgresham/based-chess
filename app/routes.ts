import {
	type RouteConfig,
	index,
	layout,
	route,
} from "@react-router/dev/routes";
// import WalletHeaderAndFooter from "./layouts/wallet-header-footer";

export default [
	layout("layouts/wallet-header-footer.tsx", [
		index("routes/home.tsx"),
		route("games/:gameId", "routes/games/game.tsx"),
	]),
] satisfies RouteConfig;
