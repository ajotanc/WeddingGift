<script setup lang="ts">
import { cn } from "@/lib/utils";
import { reactiveOmit } from "@vueuse/core";
import { ToastDescription as RekaToastDescription, type ToastDescriptionProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

const props = defineProps<
	ToastDescriptionProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = reactiveOmit(props, "class");
</script>

<template>
  <RekaToastDescription :class="cn('text-sm opacity-90', props.class)" v-bind="delegatedProps">
    <slot />
  </RekaToastDescription>
</template>
