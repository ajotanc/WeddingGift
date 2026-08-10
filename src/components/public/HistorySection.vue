<script setup lang="ts">
import DOMPurify from "dompurify";
import { computed } from "vue";
import { Heart } from "lucide-vue-next";

const props = defineProps<{
	historyText: string;
	primaryColor?: string;
}>();

const sanitizedHistoryText = computed(() =>
	DOMPurify.sanitize(props.historyText),
);

</script>

<template>
	<section id="history" class="max-w-3xl mx-auto scroll-mt-16 text-center py-8">
		<!-- Section Header Ornament -->
		<div class="flex flex-col items-center mb-10 gap-3">
			<span class="text-[10px] font-bold tracking-[0.25em] uppercase text-primary">Memorabilia</span>
			<h2 class="text-3xl md:text-4xl font-serif text-slate-900 font-semibold">Nossa História</h2>
			<div class="flex items-center gap-3 w-32 justify-center mt-2">
				<div class="h-[1px] flex-1 bg-primary/40"></div>
				<Heart class="w-3.5 h-3.5 fill-current opacity-80 text-primary" />
				<div class="h-[1px] flex-1 bg-primary/40"></div>
			</div>
		</div>

		<!-- Editorial Text Container -->
		<div class="relative px-6 md:px-10">
			<div
				class="text-slate-600 font-light text-base md:text-lg leading-relaxed text-left quill-content pb-4 tracking-wide max-w-2xl mx-auto font-sans"
				v-html="sanitizedHistoryText"></div>
		</div>
	</section>
</template>
