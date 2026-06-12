import { createInjectionState } from '@vueuse/core'
import emblaCarouselVue from 'embla-carousel-vue'
import { onMounted, ref } from 'vue'
import type { UnwrapRef } from 'vue'
import type { CarouselEmits, CarouselProps } from './interface'

const [useProvideCarousel, useInjectCarousel] = createInjectionState(
  ({
    opts,
    orientation,
    plugins,
  }: CarouselProps, emits: CarouselEmits) => {
    const [carouselRef, emblaApi] = emblaCarouselVue(
      {
        ...opts,
        axis: orientation === 'horizontal' ? 'x' : 'y',
      },
      plugins,
    )

    const canScrollNext = ref(false)
    const canScrollPrev = ref(false)

    function scrollPrev() {
      emblaApi.value?.scrollPrev()
    }
    function scrollNext() {
      emblaApi.value?.scrollNext()
    }
    function scrollTo(index: number) {
      emblaApi.value?.scrollTo(index)
    }

    const onSelect = (api: NonNullable<UnwrapRef<typeof emblaApi>>) => {
      canScrollNext.value = api.canScrollNext()
      canScrollPrev.value = api.canScrollPrev()
    }

    onMounted(() => {
      if (!emblaApi.value)
        return

      emblaApi.value?.on('init', onSelect)
      emblaApi.value?.on('reInit', onSelect)
      emblaApi.value?.on('select', onSelect)

      emits('init-api', emblaApi.value)
    })

    return { carouselRef, carouselApi: emblaApi, canScrollPrev, canScrollNext, scrollPrev, scrollNext, scrollTo, orientation }
  },
)

export { useInjectCarousel, useProvideCarousel }
