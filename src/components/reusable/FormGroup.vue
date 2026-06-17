<script setup lang="ts">
import { Label } from "@/components/ui/label";

defineProps<{
	label?: string;
	error?: string;
}>();
</script>

<template>
	<div class="flex flex-col gap-2">
		<Label v-if="label" class="block text-sm font-bold font-sans text-slate-700">{{ label }}</Label>
		<slot />
		<span v-if="error" class="text-xs text-red-500 font-medium">{{ error }}</span>
	</div>
</template>
