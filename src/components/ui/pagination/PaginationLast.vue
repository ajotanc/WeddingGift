<script setup lang="ts">
import type { ButtonVariants } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { reactiveOmit } from "@vueuse/core";
import { ChevronsRight } from "lucide-vue-next";
import type { PaginationLastProps } from "reka-ui";
import { PaginationLast, useForwardProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

const props = withDefaults(
	defineProps<
		PaginationLastProps & {
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
  <PaginationLast data-slot="pagination-last"
    :class="cn(buttonVariants({ variant: 'ghost', size }), props.class)" v-bind="forwarded">
    <slot>
      <ChevronsRight class="w-4 h-4" />
    </slot>
  </PaginationLast>
</template>
