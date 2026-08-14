<script setup lang="ts">
import { cn } from "@/lib/utils";
import type { ComponentPublicInstance } from "vue";
import type { WithClassAsProps } from "./interface";
import { useCarousel } from "./useCarousel";

defineOptions({
	inheritAttrs: false,
});

const props = defineProps<WithClassAsProps>();
const { carouselRef, orientation } = useCarousel();

function setCarouselRef(el: Element | ComponentPublicInstance | null) {
	if (el instanceof HTMLElement) {
		carouselRef.value = el;
	}
}
</script>

<template>
  <div :ref="setCarouselRef" data-slot="carousel-content" class="overflow-hidden">
    <div :class="cn(
      'flex',
      orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
      props.class,
    )" v-bind="$attrs">
      <slot />
    </div>
  </div>
</template>
