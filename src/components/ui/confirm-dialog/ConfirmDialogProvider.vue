<script setup lang="ts">
import { useConfirm } from "@/components/ui/confirm-dialog/useConfirm";
import { onMounted, onUnmounted, Teleport } from "vue";
import { Button } from "@/components/ui/button";

const { state, onConfirm, onCancel } = useConfirm();

// Fechar com a tecla ESC
const handleKeyDown = (e: KeyboardEvent) => {
	if (e.key === "Escape" && state.isOpen) {
		onCancel();
	}
};

onMounted(() => {
	window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
	window.removeEventListener("keydown", handleKeyDown);
});
</script>

<template>
  <Teleport to="body">
    <div v-if="state.isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all p-4"
      @mousedown.self="onCancel">
      <div
        class="relative w-full max-w-[400px] rounded-3xl border border-slate-100/80 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
        <h2 class="text-xl font-serif text-slate-900 tracking-tight">{{ state.options?.title }}</h2>
        <p class="mt-2 text-sm text-slate-500 font-light" v-if="state.options?.description">
          {{ state.options.description }}
        </p>
        <div class="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button variant="outline" class="mt-2 sm:mt-0 w-full sm:w-auto" @click="onCancel">
            {{ state.options?.cancelText || 'Cancelar' }}
          </Button>
          <Button class="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto" @click="onConfirm">
            {{ state.options?.confirmText || 'Confirmar' }}
          </Button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
