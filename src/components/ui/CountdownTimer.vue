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
  <div v-if="remaining" class="flex text-slate-900 font-serif text-xl md:text-2xl justify-center items-center">
    <div class="flex flex-col items-center justify-center min-w-[4rem] sm:min-w-[5rem] text-center">
      <div class="text-5xl md:text-6xl font-bold tabular-nums tracking-tight">{{ remaining.days }}</div>
      <div class="text-[10px] font-sans tracking-wide uppercase font-bold">Dias</div>
    </div>
    <div class="flex flex-col items-center justify-center min-w-[4rem] sm:min-w-[5rem] text-center">
      <div class="text-5xl md:text-6xl font-bold tabular-nums tracking-tight">{{ remaining.hours }}</div>
      <div class="text-[10px] font-sans tracking-wide uppercase font-bold">Horas</div>
    </div>
    <div class="flex flex-col items-center justify-center min-w-[4rem] sm:min-w-[5rem] text-center">
      <div class="text-5xl md:text-6xl font-bold tabular-nums tracking-tight">{{ remaining.minutes }}</div>
      <div class="text-[10px] font-sans tracking-wide uppercase font-bold">Min</div>
    </div>
    <div class="flex flex-col items-center justify-center min-w-[4rem] sm:min-w-[5rem] text-center">
      <div class="text-5xl md:text-6xl font-bold tabular-nums tracking-tight">{{ remaining.seconds }}</div>
      <div class="text-[10px] font-sans tracking-wide uppercase font-bold">Seg</div>
    </div>
  </div>
  <div v-else class="text-primary font-bold text-lg text-center">O evento já começou!</div>
</template>

<style scoped>
/* No extra CSS needed – Tailwind utilities handle styling */
</style>
