<script setup lang="ts">
import SectionHeader from "@/components/public/SectionHeader.vue";
import DOMPurify from "dompurify";
import { Heart } from "lucide-vue-next";
import { computed } from "vue";

const props = defineProps<{
	historyText: string;
	primaryColor?: string;
}>();

const sanitizedHistoryText = computed(() =>
	DOMPurify.sanitize(props.historyText),
);
</script>

<template>
	<section id="history" class="max-w-3xl mx-auto scroll-mt-16 text-left md:text-center py-8">
		<!-- Section Header -->
		<SectionHeader
			tag="Memorabilia"
			title="Nossa História"
			center
			responsive>
			<div class="flex items-center gap-3 w-32 justify-center mx-auto mt-3">
				<div class="h-[1px] flex-1 bg-primary/40"></div>
				<Heart class="w-3.5 h-3.5 fill-current opacity-80 text-primary" />
				<div class="h-[1px] flex-1 bg-primary/40"></div>
			</div>
		</SectionHeader>

		<!-- Editorial Text Container -->
		<div class="relative md:px-10">
			<div
				class="text-slate-600 font-light text-base md:text-lg leading-relaxed text-left quill-content pb-4 tracking-wide max-w-2xl mx-auto font-sans"
				v-html="sanitizedHistoryText"></div>
		</div>
	</section>
</template>
