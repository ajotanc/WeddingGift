<script setup lang="ts">
import { Button } from "@/components/ui/button";
import type { Component } from "vue";

defineProps<{
	variant?: "danger" | "premium" | "success";
	title: string;
	description?: string;
	buttonLabel?: string;
	icon?: Component;
	iconEffect?: "pulse" | "float" | "spin";
}>();

const emit = defineEmits(["action"]);
</script>

<template>
  <div
    :class="[
      'relative overflow-hidden p-6 border flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_8px_30px_rgb(0,0,0,0.01)] transition-all duration-300 rounded-3xl',
      variant === 'danger' ? 'bg-gradient-to-br from-rose-50/50 via-white to-rose-50/20 border-rose-100/60 text-slate-900 hover:border-rose-200/75' :
      variant === 'success' ? 'bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/10 border-emerald-100/60 text-slate-800 hover:border-emerald-200/75' :
      'bg-gradient-to-br from-rose-50/60 via-white to-amber-50/30 border-rose-100/70 text-slate-900 hover:border-rose-200/60 shadow-[0_8px_30px_rgba(244,63,94,0.02)]'
    ]"
  >
    <!-- Background glowing ambient light effects for premium/standard variant -->
    <template v-if="variant !== 'success'">
      <div class="absolute -right-4 -top-4 w-32 h-32 bg-gradient-to-br from-amber-200/20 to-rose-300/20 rounded-full blur-2xl pointer-events-none"></div>
      <div class="absolute -left-10 -bottom-10 w-28 h-28 bg-gradient-to-tr from-rose-100/10 to-amber-200/10 rounded-full blur-xl pointer-events-none"></div>
    </template>

    <div class="flex items-start md:items-center gap-4 relative z-10">
      <!-- Icon Container -->
      <div v-if="icon" class="shrink-0 p-3 rounded-2xl flex items-center justify-center shadow-xs border"
        :class="[
          variant === 'danger' ? 'bg-rose-50 text-rose-500 border-rose-100/50' :
          variant === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' :
          'bg-gradient-to-br from-amber-100 to-rose-100/40 text-amber-500 border-amber-200/30',
          iconEffect === 'pulse' ? 'animate-pulse' :
          iconEffect === 'float' ? 'animate-float' :
          iconEffect === 'spin' ? 'animate-slow-spin' : ''
        ]"
      >
        <component :is="icon" class="w-5 h-5" />
      </div>

      <!-- Textual info -->
      <div class="space-y-1 text-left">
        <div class="flex flex-wrap items-center gap-2">
          <h4 class="font-bold text-slate-900 leading-tight font-serif text-sm md:text-base">
            {{ title }}
          </h4>
        </div>
        <p v-if="description" class="text-xs text-slate-600 font-light leading-relaxed max-w-xl">
          {{ description }}
        </p>
        <!-- Slot for custom description content, e.g. lists with details -->
        <slot name="description"></slot>
      </div>
    </div>

    <!-- Actions Area -->
    <div class="flex flex-col md:items-end gap-2.5 shrink-0 w-full md:w-auto mt-2 md:mt-0 relative z-10">
      <slot name="actions"></slot>
      <Button
        v-if="buttonLabel"
        type="button"
        @click="emit('action')"
        :class="[
          'rounded-xl text-xs font-semibold px-6 h-10 cursor-pointer w-full md:w-auto shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-300 ease-in-out',
          variant === 'danger' ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-100' :
          variant === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-100' :
          'bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white shadow-rose-200'
        ]"
      >
        {{ buttonLabel }}
      </Button>
    </div>
  </div>
</template>

<style scoped>
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}

@keyframes slow-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-slow-spin {
  animation: slow-spin 10s linear infinite;
}
</style>
