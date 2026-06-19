/// <reference types="vite/client" />
/// <reference types="vite-plugin-vue-layouts-next/client" />

declare module "*.vue" {
	import type { DefineComponent } from "vue";

	const component: DefineComponent<
		Record<string, unknown>,
		Record<string, unknown>,
		unknown
	>;
	export default component;
}

// ADICIONE ESTA LINHA NO FINAL DO ARQUIVO:
declare module "qrcode-vue";

export {};

declare global {
	interface Window {
		YT: {
			Player: new (
				elementId: string,
				options: Record<string, unknown>,
			) => {
				playVideo(): void;
				pauseVideo(): void;
				destroy(): void;
			};
			PlayerState: {
				PLAYING: number;
				PAUSED: number;
				ENDED: number;
			};
		};
	}
}
