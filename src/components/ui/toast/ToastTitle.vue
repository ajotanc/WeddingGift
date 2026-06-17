<script setup lang="ts">
import { cn } from "@/lib/utils";
import { reactiveOmit } from "@vueuse/core";
import { ToastTitle as RekaToastTitle, type ToastTitleProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

const props = defineProps<
	ToastTitleProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = reactiveOmit(props, "class");
</script>

<template>
  <RekaToastTitle v-bind="delegatedProps" :class="cn('text-sm font-semibold', props.class)">
    <slot />
  </RekaToastTitle>
</template>
