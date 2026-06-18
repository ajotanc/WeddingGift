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
				rewrite: function (path) {
					return path.replace(/^\/api-serp/, "/search");
				},
			},
		},
	},
});
