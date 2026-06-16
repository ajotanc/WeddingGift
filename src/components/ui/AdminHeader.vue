<script setup lang="ts">
defineProps<{
	title: string;
	description?: string;
}>();
</script>

<template>
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
      <h2 class="text-2xl font-serif text-slate-900 tracking-tight">{{ title }}</h2>
      <p v-if="description" class="text-sm text-slate-500 mt-1">{{ description }}</p>
    </div>
    <div v-if="$slots.default" class="flex gap-3 items-center">
      <slot />
    </div>
  </div>
</template>
