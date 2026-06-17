<script setup lang="ts">
import { ToastProvider as RekaToastProvider, type ToastProviderProps } from "reka-ui";

const props = defineProps<ToastProviderProps>();
</script>

<template>
  <RekaToastProvider v-bind="props">
    <slot />
  </RekaToastProvider>
</template>
