<script setup lang="ts">
import { cn } from "@/lib/utils";

const props = defineProps<{
	class?: string;
}>();
</script>

<template>
  <div :class="cn('rounded-xl border border-slate-200 bg-white text-slate-950 shadow', props.class)">
    <slot />
  </div>
</template>
