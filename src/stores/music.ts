import { defineStore } from "pinia";
import { computed, ref } from "vue";

export type MusicProvider = "youtube" | "spotify" | null;

export interface ISpotifyData {
	type: "playlist" | "track" | "album" | "artist";
	id: string;
	uri: string;
}

export const useMusicStore = defineStore("music", () => {
	const musicUrl = ref<string | null>(null);
	const isPlaying = ref(false);
	const isPremium = ref(false);
	const isSpotifyOpen = ref(false);

	const getYouTubeVideoId = (url?: string | null): string | null => {
		if (!url) return null;
		const match = url.match(
			/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/,
		);
		return match && match[2].length === 11 ? match[2] : null;
	};

	const getSpotifyData = (url?: string | null): ISpotifyData | null => {
		if (!url) return null;
		const trimmed = url.trim();

		// Formato URI: spotify:playlist:12345
		const uriMatch = trimmed.match(
			/^spotify:(playlist|track|album|artist):([a-zA-Z0-9]+)/i,
		);
		if (uriMatch) {
			const type = uriMatch[1].toLowerCase() as ISpotifyData["type"];
			const id = uriMatch[2];
			return { type, id, uri: `spotify:${type}:${id}` };
		}

		// Formato Web: https://open.spotify.com/.../playlist/12345
		const webMatch = trimmed.match(
			/open\.spotify\.com\/(?:[a-zA-Z0-9-]+\/)?(playlist|track|album|artist)\/([a-zA-Z0-9]+)/i,
		);
		if (webMatch) {
			const type = webMatch[1].toLowerCase() as ISpotifyData["type"];
			const id = webMatch[2];
			return { type, id, uri: `spotify:${type}:${id}` };
		}

		return null;
	};

	const videoId = computed(() => getYouTubeVideoId(musicUrl.value));
	const spotifyData = computed(() => getSpotifyData(musicUrl.value));

	const provider = computed<MusicProvider>(() => {
		if (spotifyData.value) return "spotify";
		if (videoId.value) return "youtube";
		return null;
	});

	const spotifyEmbedUrl = computed(() => {
		if (!spotifyData.value) return null;
		return `https://open.spotify.com/embed/${spotifyData.value.type}/${spotifyData.value.id}?utm_source=generator&theme=0`;
	});

	const toggle = () => {
		isPlaying.value = !isPlaying.value;
	};

	const stop = () => {
		isPlaying.value = false;
	};

	const toggleSpotify = () => {
		isSpotifyOpen.value = !isSpotifyOpen.value;
	};

	// Pausar música do YouTube quando a aba ficar oculta
	if (typeof document !== "undefined") {
		document.addEventListener("visibilitychange", () => {
			if (document.hidden && isPlaying.value) {
				isPlaying.value = false;
			}
		});
	}

	return {
		musicUrl,
		isPlaying,
		isPremium,
		isSpotifyOpen,
		videoId,
		spotifyData,
		provider,
		spotifyEmbedUrl,
		toggle,
		stop,
		toggleSpotify,
		getYouTubeVideoId,
		getSpotifyData,
	};
});
