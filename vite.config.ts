// import { vitePluginViteNodeMiniflare } from "@hiogawa/vite-node-miniflare";
import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
import { reactRouter } from "@react-router/dev/vite";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ isSsrBuild }) => ({
  build: {
    // rollupOptions: isSsrBuild
    //   ? {
    //     input: "./workers/app.ts",
    //   }
    //   : undefined,
    rollupOptions: undefined,
    sourcemap: true,
  },
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  plugins: [
    cloudflareDevProxy(),
    reactRouter(),
    tsconfigPaths(),
  ],
  resolve: {
    // Farcaster frame sdk doesn't have .js file extension on imports, which isn't esm compatible
    // by default. Next.js seems to handle this correctly, but vite does not.
    alias: {
      // '@farcaster/frame-sdk': '../frames/packages/frame-sdk/dist/index.js'
      '@farcaster/frame-sdk': 'node_modules/@farcaster/frame-sdk/dist/index.js'
    }
  },
  // optimizeDeps: {
  //   include: ['@farcaster/frame-sdk']
  // }
}));
