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

const themeColor = computed(() => props.primaryColor || '#ec4899');
</script>

<template>
	<section id="history" class="max-w-3xl mx-auto scroll-mt-16 text-center py-8">
		<!-- Section Header Ornament -->
		<div class="flex flex-col items-center mb-10 gap-3">
			<span class="text-[10px] font-bold tracking-[0.25em] uppercase" :style="{ color: themeColor }">Memorabilia</span>
			<h2 class="text-3xl md:text-4xl font-serif text-[#1E1A17] font-semibold">Nossa História</h2>
			<div class="flex items-center gap-3 w-32 justify-center mt-2">
				<div class="h-[1px] flex-1" :style="{ backgroundColor: themeColor + '40' }"></div>
				<Heart class="w-3.5 h-3.5 fill-current opacity-80" :style="{ color: themeColor }" />
				<div class="h-[1px] flex-1" :style="{ backgroundColor: themeColor + '40' }"></div>
			</div>
		</div>

		<!-- Editorial Text Container -->
		<div class="relative px-6 md:px-10">
			<!-- Corner decorations in the background -->
			<div class="absolute -top-6 -left-2 text-7xl font-serif select-none opacity-10" :style="{ color: themeColor }">“</div>
			<div class="absolute -bottom-12 -right-2 text-7xl font-serif select-none opacity-10" :style="{ color: themeColor }">”</div>

			<div class="text-[#5A4F4A] font-light text-base md:text-lg leading-relaxed text-left quill-content pb-4 tracking-wide max-w-2xl mx-auto font-sans"
				v-html="sanitizedHistoryText"></div>
		</div>
	</section>
</template>

<style scoped>
:deep(.quill-content > p:first-child::first-letter) {
	float: left;
	font-family: var(--font-title);
	font-size: 3.5rem;
	line-height: 0.85;
	padding-top: 4px;
	padding-right: 10px;
	font-weight: 600;
	color: v-bind(themeColor);
}
:deep(.quill-content p) {
	margin-bottom: 1.5rem;
}
</style>
