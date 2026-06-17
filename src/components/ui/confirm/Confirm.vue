<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useConfirm } from "@/components/ui/confirm/useConfirm";

const { state, onConfirm, onCancel } = useConfirm();
</script>

<template>
  <Dialog :open="state.isOpen" @update:open="onCancel">
    <DialogContent class="sm:max-w-[400px] rounded-3xl p-6 border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
      <DialogHeader>
        <DialogTitle class="text-xl font-serif text-slate-900 tracking-tight">
          {{ state.options?.title }}
        </DialogTitle>
        <DialogDescription v-if="state.options?.description" class="mt-2 text-sm text-slate-500 font-light">
          {{ state.options.description }}
        </DialogDescription>
      </DialogHeader>

      <DialogFooter class="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <Button variant="outline" class="w-full sm:w-auto" @click="onCancel">
          {{ state.options?.cancelText || 'Cancelar' }}
        </Button>
        <Button class="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto" @click="onConfirm">
          {{ state.options?.confirmText || 'Confirmar' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>