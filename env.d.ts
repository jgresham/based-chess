// Generated by Wrangler
// by running `wrangler types --env-interface CloudflareEnv env.d.ts`

interface CloudflareEnv {
    CHESS_GAME: DurableObjectNamespace<
      import("../chess-worker/src/index").ChessGame
    >;
    RPC_SERVICE: Service<import("../chess-worker/src/index").SessionsRPC>;
    ASSETS: Fetcher;
  }