import { URL, fileURLToPath } from "node:url";

import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { VitePWA } from "vite-plugin-pwa";
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'

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
		AutoImport({
			imports: [
				'vue',
				'vue-router',
			],
			dts: 'src/auto-imports.d.ts',
		}),
		Components({
			dirs: ['src/components', 'src/components/ui'],
			extensions: ['vue'],
			deep: true,
			dts: 'src/components.d.ts',
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
				rewrite: (path) => path.replace(/^\/api-serp/, "/search"),
			},
		},
	},
});
