<script setup lang="ts">
import { cn } from "@/lib/utils";
import { computed } from "vue";

const props = defineProps<{
	class?: string;
	modelValue?: number;
}>();

const progressStyle = computed(() => ({
	transform: `translateX(-${100 - (props.modelValue || 0)}%)`,
}));
</script>

<template>
  <div
    :class="cn('relative h-2 w-full overflow-hidden rounded-full bg-slate-200', props.class)"
  >
    <div
      class="h-full w-full flex-1 bg-primary transition-all duration-500 ease-in-out"
      :style="progressStyle"
    ></div>
  </div>
</template>
