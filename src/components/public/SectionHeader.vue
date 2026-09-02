<script setup lang="ts">
withDefaults(
	defineProps<{
		tag?: string;
		title: string;
		description?: string;
		observation?: string;
		responsive?: boolean;
		border?: boolean;
		center?: boolean;
	}>(),
	{
		border: false,
	},
);
</script>

<template>
	<div class="mb-6" :class="[
		center
			? 'text-center'
			: 'text-left md:text-center',
		{ 'border-b border-slate-200/60 pb-6': border },
	]">
		<span v-if="tag" class="text-[10px] font-bold tracking-[0.25em] uppercase text-primary">
			{{ tag }}
		</span>
		<h2 class="text-3xl font-serif text-slate-900 mt-1 font-semibold">
			{{ title }}
		</h2>
		<p v-if="description" class="text-slate-600 font-light leading-relaxed mt-2 text-sm max-w-md"
			:class="{ 'mx-auto': center || responsive }">
			{{ description }}
		</p>
		<p v-if="observation" class="bg-yellow-100 text-yellow-700 border-yellow-500 border rounded-xl font-medium p-2 mt-4 text-xs max-w-md"
			:class="{ 'mx-auto': center || responsive }">
			{{ observation }}
		</p>
		<slot />
	</div>
</template>
