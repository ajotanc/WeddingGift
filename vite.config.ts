import { URL, fileURLToPath } from "node:url";

import vue from "@vitejs/plugin-vue";
import { defineConfig, loadEnv } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd());

	return {
		plugins: [
			vue(),
			nodePolyfills(),
			VitePWA({
				registerType: "autoUpdate",
				injectRegister: "auto",
				includeAssets: ["favicon.ico", "images/es.webp", "images/pwa/*.png"],
				devOptions: {
					enabled: true,
					type: "module",
				},
				workbox: {
					maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
					globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff,woff2}"],
					navigateFallback: "/index.html",
					navigateFallbackDenylist: [/^\/v1/, /^\/api/],
				},
				manifest: {
					id: "/",
					name: env.VITE_PROJECT_NAME,
					short_name: env.VITE_PROJECT_NAME,
					start_url: ".",
					scope: "/",
					theme_color: "#c5a880",
					display: "standalone",
					orientation: "portrait",
					description: env.VITE_PROJECT_DESCRIPTION,
					background_color: "#FAF8F6",
					lang: "pt-BR",
					prefer_related_applications: false,
					icons: [
						{
							src: "/images/pwa-64x64.png",
							sizes: "64x64",
							type: "image/png",
							purpose: "any",
						},
						{
							src: "/images/pwa-192x192.png",
							sizes: "192x192",
							type: "image/png",
							purpose: "any",
						},
						{
							src: "/images/pwa-512x512.png",
							sizes: "512x512",
							type: "image/png",
							purpose: "any",
						},
						{
							src: "/images/maskable-icon-512x512.png",
							sizes: "512x512",
							type: "image/png",
							purpose: "maskable",
						},
					],
				},
			}),
		],
		build: {
			target: "esnext",
			chunkSizeWarningLimit: 3000,
			rollupOptions: {
				output: {
					manualChunks(id) {
						if (id.includes("node_modules")) {
							if (id.includes("appwrite")) return "vendor-appwrite";
							if (id.includes("leaflet")) return "vendor-leaflet";
							if (id.includes("xlsx")) return "vendor-xlsx";
							if (id.includes("lucide-vue-next")) return "vendor-icons";
							if (id.includes("@vue-email") || id.includes("vue-email")) return "vendor-email";
							if (id.includes("dayjs")) return "vendor-dayjs";
							return "vendor";
						}
					},
				},
			},
		},
		resolve: {
			alias: {
				"@": fileURLToPath(new URL("./src", import.meta.url)),
			},
		},
		server: {
			proxy: {
				"/api-serp": {
					target: "https://google.serper.dev",
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/api-serp/, ""),
				},
			},
		},
	};
});
