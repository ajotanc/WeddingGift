import { URL, fileURLToPath } from "node:url";

import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

// Config separada do vite.config.ts para não carregar PWA/polyfills nos testes.
export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		environment: "jsdom",
		include: [
			"src/**/*.test.ts",
			"functions/__tests__/**/*.test.js",
			"scripts/**/*.test.mjs",
		],
		restoreMocks: true,
		env: {
			VITE_APPWRITE_ENDPOINT: "http://localhost/v1",
			VITE_APPWRITE_PROJECT_ID: "test-project",
			VITE_APPWRITE_DATABASE_ID: "test-db",
			VITE_APPWRITE_BUCKET_ID: "test-bucket",
			VITE_PROJECT_NAME: "Teste",
		},
	},
});
