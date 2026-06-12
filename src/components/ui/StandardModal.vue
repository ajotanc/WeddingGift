<script setup lang="ts">
import Dialog from '@/components/ui/Dialog.vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  open: boolean
  title?: string
  description?: string
}>()

const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>()

function close() {
  emit('update:open', false)
}
</script>

<template>
  <Dialog v-model:open="props.open" :title="props.title" :description="props.description" @close="close">
    <div class="p-6">
      <slot />
    </div>
  </Dialog>
</template>
