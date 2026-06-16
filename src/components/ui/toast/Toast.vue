<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import type { ToastRootEmits } from "reka-ui";
import { useForwardPropsEmits } from "reka-ui";
import { toastVariants, type ToastProps } from ".";
import { cn } from "@/lib/utils";

const props = defineProps<ToastProps>();

const emits = defineEmits<ToastRootEmits>();

const delegatedProps = reactiveOmit(props, "class");

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
  <ToastRoot
    v-bind="forwarded"
    :class="cn(toastVariants({ variant }), props.class)"
    @update:open="onOpenChange"
  >
    <slot />
  </ToastRoot>
</template>
