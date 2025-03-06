/** @type {import('next').NextConfig} */
const nextConfig = {
	// use only for quick build testing before optimizing eslint & type fixes
	// eslint: {
	// 	ignoreDuringBuilds: true,
	// },
	// typescript: {
	// 	ignoreBuildErrors: true,
	// },
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
