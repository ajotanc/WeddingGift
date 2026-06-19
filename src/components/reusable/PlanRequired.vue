<script setup lang="ts">
import { Lock } from "lucide-vue-next";

defineProps<{
	text?: string;
}>();
</script>

<template>
  <span class="text-[10px] text-slate-500 flex items-center gap-1 font-light mt-1 select-none">
    <Lock class="w-3 h-3 text-rose-500 shrink-0" />
    <slot>{{ text || 'Função disponível apenas no plano Premium' }}</slot>
  </span>
</template>
