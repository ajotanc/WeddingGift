import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useMusicStore = defineStore("music", () => {
	const musicUrl = ref<string | null>(null);
	const isPlaying = ref(false);
	const isPremium = ref(false);

	const getYouTubeVideoId = (url?: string | null) => {
		if (!url) return null;
		const match = url.match(
			/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/,
		);
		return match && match[2].length === 11 ? match[2] : null;
	};

	const videoId = computed(() => {
		return getYouTubeVideoId(musicUrl.value);
	});

	const toggle = () => {
		isPlaying.value = !isPlaying.value;
	};
	const stop = () => {
		isPlaying.value = false;
	};

	// Pause music when tab is hidden
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
		videoId,
		toggle,
		stop,
		getYouTubeVideoId,
	};
});
