import {
	defineConfig,
	minimal2023Preset,
} from "@vite-pwa/assets-generator/config";

export default defineConfig({
	preset: {
		...minimal2023Preset,
		maskable: {
			sizes: [512],
			padding: 0.3,
			resizeOptions: { background: "#FAF8F6" },
		},
		apple: {
			sizes: [180],
			padding: 0.3,
			resizeOptions: { background: "#FAF8F6" },
		},
	},
	images: ["public/images/es.svg"],
});
