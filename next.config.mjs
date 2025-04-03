/** @type {import('next').NextConfig} */
const nextConfig = {
	// use only for quick build testing before optimizing eslint & type fixes
	eslint: {
		ignoreDuringBuilds: true,
		dirs: ["src"],
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	images: {
		loader: "custom",
		loaderFile: "./image-loader.ts",
		remotePatterns: [
			{
				hostname: "ipfs.io",
				protocol: "https",
			},
			{
				hostname: "basedchess.xyz",
				protocol: "https",
			},
			{
				hostname: "based-chess-worker-nextjs-prod.johnsgresham.workers.dev",
				protocol: "https",
			},
		],
	},
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
