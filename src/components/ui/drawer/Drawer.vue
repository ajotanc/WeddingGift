<script lang="ts" setup>
import type { DrawerRootEmits, DrawerRootProps } from "vaul-vue";
import { DrawerRoot } from "vaul-vue";

const props = withDefaults(defineProps<DrawerRootProps>(), {
	shouldScaleBackground: true,
}) as Record<string, unknown>;

const emits = defineEmits<DrawerRootEmits>();
</script>

<template>
  <DrawerRoot
    v-slot="slotProps"
    data-slot="drawer"
    v-bind="props"
  >
    <slot v-bind="slotProps" />
  </DrawerRoot>
</template>
