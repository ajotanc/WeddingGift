<script setup lang="ts">
import DOMPurify from "dompurify";
import { computed } from "vue";

const props = defineProps<{
	historyText: string;
}>();

const sanitizedHistoryText = computed(() =>
	DOMPurify.sanitize(props.historyText),
);
</script>

<template>
	<section id="history" class="text-center max-w-3xl mx-auto scroll-mt-10">
		<h2 class="text-3xl font-serif text-slate-900 mb-8">Nossa História</h2>
		<div class="text-slate-600 font-light text-lg leading-relaxed text-left quill-content"
			v-html="sanitizedHistoryText"></div>
	</section>
</template>

