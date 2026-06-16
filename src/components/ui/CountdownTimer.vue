<script setup lang="ts">
import dayjs from "dayjs";
import { computed, onMounted, onUnmounted, ref } from "vue";

interface Props {
	eventDate: string; // ISO date string
}

const props = defineProps<Props>();

const now = ref(dayjs());
let timer: ReturnType<typeof setInterval>;

onMounted(() => {
	timer = setInterval(() => {
		now.value = dayjs();
	}, 1000);
});

onUnmounted(() => {
	clearInterval(timer);
});

const remaining = computed(() => {
	const target = dayjs(props.eventDate);
	const diff = target.diff(now.value, "millisecond");
	if (diff <= 0) return null;
	const totalSec = Math.floor(diff / 1000);
	const days = String(Math.floor(totalSec / (3600 * 24))).padStart(2, "0");
	const hours = String(Math.floor((totalSec % (3600 * 24)) / 3600)).padStart(
		2,
		"0",
	);
	const minutes = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
	const seconds = String(totalSec % 60).padStart(2, "0");
	return { days, hours, minutes, seconds };
});
</script>

<template>
  <div v-if="remaining" class="flex gap-4 text-slate-900 font-serif text-xl md:text-2xl justify-center">
    <div class="text-center">
      <div class="text-4xl md:text-5xl font-bold">{{ remaining.days }}</div>
      <div class="text-sm">Dias</div>
    </div>
    <div class="text-center">
      <div class="text-4xl md:text-5xl font-bold">{{ remaining.hours }}</div>
      <div class="text-sm">Horas</div>
    </div>
    <div class="text-center">
      <div class="text-4xl md:text-5xl font-bold">{{ remaining.minutes }}</div>
      <div class="text-sm">Min</div>
    </div>
    <div class="text-center">
      <div class="text-4xl md:text-5xl font-bold">{{ remaining.seconds }}</div>
      <div class="text-sm">Seg</div>
    </div>
  </div>
  <div v-else class="text-primary font-medium text-lg text-center">O evento já começou!</div>
</template>

<style scoped>
/* No extra CSS needed – Tailwind utilities handle styling */
</style>
