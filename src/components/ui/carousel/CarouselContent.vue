<script setup lang="ts">
import { cn } from '@/lib/utils'
import { useInjectCarousel } from './useCarousel'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps<{ class?: string }>()

const { carouselRef, orientation } = useInjectCarousel()
</script>

<template>
  <div ref="carouselRef" class="overflow-hidden">
    <div
      :class="
        cn(
          'flex',
          orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
          props.class,
        )
      "
      v-bind="$attrs"
    >
      <slot />
    </div>
  </div>
</template>
