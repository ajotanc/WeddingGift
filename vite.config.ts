import { URL, fileURLToPath } from "node:url";

import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
	plugins: [
		vue(),
		nodePolyfills(),
		VitePWA({
			registerType: "autoUpdate",
			manifest: {
				name: "Wedding Gift SaaS",
				short_name: "WeddingGift",
				theme_color: "#ffffff",
				icons: [
					{
						src: "/pwa-192x192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "/pwa-512x512.png",
						sizes: "512x512",
						type: "image/png",
					},
				],
			},
		}),
	],
	build: {
		target: "esnext",
		chunkSizeWarningLimit: 4000,
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes("node_modules")) {
						if (id.includes("appwrite")) {
							return "appwrite";
						}
						if (id.includes("leaflet")) {
							return "leaflet";
						}
						if (id.includes("xlsx")) {
							return "xlsx";
						}
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
				rewrite: (path) => path.replace(/^\/api-serp/, "/search"),
			},
		},
		host: true,
		allowedHosts: [
			".ngrok-free.app",
			".ngrok.io",
			".ngrok-free.dev",
			".trycloudflare.com",
		],
	},
});
