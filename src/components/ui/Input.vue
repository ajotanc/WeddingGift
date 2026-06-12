<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  modelValue?: string | number
  class?: string
  type?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
})

const emit = defineEmits<(e: 'update:modelValue', value: string | number) => void>()

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <input
    :type="type"
    :value="modelValue"
    @input="onInput"
    :placeholder="placeholder"
    :disabled="disabled"
    :required="required"
    :class="cn(
      'flex h-12 w-full rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-2 text-base font-sans ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50',
      props.class
    )"
  />
</template>
