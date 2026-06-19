import { defineStore } from 'pinia';
import { computed, onMounted, onUnmounted, ref } from 'vue';

export const useMusicStore = defineStore('music', () => {
  const musicUrl = ref<string | null>(null);
  const isPlaying = ref(false);
  const isPremium = ref(false);

  const getYouTubeVideoId = (url?: string | null) => {
    if (!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const embedUrl = computed(() => {
    const id = getYouTubeVideoId(musicUrl.value);
    if (!id) return null;
    return `https://www.youtube.com/embed/${id}?autoplay=1&loop=1&playlist=${id}&controls=0`;
  });

  const toggle = () => { isPlaying.value = !isPlaying.value; };
  const stop = () => { isPlaying.value = false; };

  const handleVisibilityChange = () => {
    if (document.hidden && isPlaying.value) {
      isPlaying.value = false;
    }
  };

  onMounted(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  });

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  });

  return { musicUrl, isPlaying, isPremium, embedUrl, toggle, stop };
});