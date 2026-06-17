<script setup lang="ts">
import { SelectRoot, type SelectRootEmits, type SelectRootProps, useForwardPropsEmits } from 'radix-vue'

const props = defineProps<SelectRootProps>()
const emit = defineEmits<SelectRootEmits>()

const forwarded = useForwardPropsEmits(props, emit)
</script>

<template>
  <SelectRoot v-forward-props-emits="forwarded">
    <slot />
  </SelectRoot>
</template>