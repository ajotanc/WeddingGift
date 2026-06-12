<script setup lang="ts">
import { useProvideCarousel } from './useCarousel'
import type { CarouselEmits, CarouselProps } from './interface'

const props = withDefaults(defineProps<CarouselProps>(), {
  orientation: 'horizontal',
})

const emits = defineEmits<CarouselEmits>()

const { carouselRef, orientation } = useProvideCarousel(props, emits)
</script>

<template>
  <div
    class="relative"
    role="region"
    aria-roledescription="carousel"
    :dir="orientation === 'horizontal' ? 'ltr' : undefined"
  >
    <slot />
  </div>
</template>
