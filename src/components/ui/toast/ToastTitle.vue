<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import type { ToastTitleProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

const props = defineProps<
	ToastTitleProps & { class?: HTMLAttributes["class"] }
>();

const delegatedProps = reactiveOmit(props, "class");
</script>

<template>
  <ToastTitle v-bind="delegatedProps" :class="cn('text-sm font-semibold', props.class)">
    <slot />
  </ToastTitle>
</template>
