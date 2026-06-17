<script setup lang="ts">
import { cn } from "@/lib/utils";
import { onMounted, onUnmounted } from "vue";

const props = defineProps<{
	open: boolean;
	title?: string;
	description?: string;
	class?: string;
}>();

const emit = defineEmits<(e: "update:open", value: boolean) => void>();

const close = () => {
	emit("update:open", false);
};

const handleKeydown = (e: KeyboardEvent) => {
	if (e.key === "Escape" && props.open) {
		close();
	}
};

onMounted(() => document.addEventListener("keydown", handleKeydown));
onUnmounted(() => document.removeEventListener("keydown", handleKeydown));
</script>

<template>
  <Teleport to="body">
    <div v-if="open" @mousedown.self="close" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all p-4">
      <div :class="cn('relative w-full max-w-lg rounded-3xl border border-slate-100/80 bg-white p-3 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)]', props.class)">
        <button @click="close" class="absolute right-6 top-6 rounded-full p-2 bg-slate-50 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all focus:outline-none">
          <X class="h-5 w-5" />
          <span class="sr-only">Fechar</span>
        </button>
        <div class="flex flex-col space-y-2 text-center sm:text-left mb-8">
          <h2 v-if="title" class="text-2xl font-serif text-slate-900 tracking-tight">{{ title }}</h2>
          <p v-if="description" class="text-sm text-slate-500 font-light">{{ description }}</p>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
