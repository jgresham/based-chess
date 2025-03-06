// default open-next.config.ts file created by @opennextjs/cloudflare
// import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";
// import kvIncrementalCache from "@opennextjs/cloudflare/kv-cache";

// export default defineCloudflareConfig({
//   incrementalCache: kvIncrementalCache,
// });

// created from opennextjs/cloudflare create-app
// something about nextjs perf is better on edge runtime
import cache from "@opennextjs/cloudflare/kvCache";

const config = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      incrementalCache: async () => cache,
      tagCache: "dummy",
      queue: "dummy",
    },
  },

  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
    },
  },

  dangerous: {
    enableCacheInterception: false,
  },
};

export default config;
