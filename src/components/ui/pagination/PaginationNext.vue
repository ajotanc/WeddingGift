<script setup lang="ts">
import type { ButtonVariants } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { reactiveOmit } from "@vueuse/core";
import { ChevronRight } from "lucide-vue-next";
import type { PaginationNextProps } from "reka-ui";
import { PaginationNext, useForwardProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

const props = withDefaults(
	defineProps<
		PaginationNextProps & {
			size?: ButtonVariants["size"];
			class?: HTMLAttributes["class"];
		}
	>(),
	{
		size: "icon",
	},
);

const delegatedProps = reactiveOmit(props, "class", "size");
const forwarded = useForwardProps(delegatedProps);
</script>

<template>
  <PaginationNext data-slot="pagination-next"
    :class="cn(buttonVariants({ variant: 'ghost', size }), props.class)" v-bind="forwarded">
    <slot>
      <ChevronRight class="w-4 h-4" />
    </slot>
  </PaginationNext>
</template>
