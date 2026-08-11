import { URL, fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig, loadEnv } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd());
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
                    globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff,woff2}"],
                    navigateFallback: "/index.html",
                    navigateFallbackDenylist: [/^\/v1/, /^\/api/],
                },
                manifest: {
                    id: "/",
                    name: env.VITE_PROJECT_NAME,
                    short_name: env.VITE_PROJECT_NAME,
                    start_url: "/",
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
            chunkSizeWarningLimit: 4000,
            rollupOptions: {
                output: {
                    manualChunks: function (id) {
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
                    rewrite: function (path) { return path.replace(/^\/api-serp/, "/search"); },
                },
            },
            host: true,
            allowedHosts: [
                ".ajotanc.com.br",
                ".ngrok-free.app",
                ".ngrok.io",
                ".ngrok-free.dev",
                ".trycloudflare.com",
            ],
        },
    };
});
