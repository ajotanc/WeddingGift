import { createInjectionState } from "@vueuse/core";
import emblaCarouselVue from "embla-carousel-vue";
import { type ComponentPublicInstance, onMounted, ref, unref } from "vue";
import type {
	UnwrapRefCarouselApi as CarouselApi,
	CarouselEmits,
	CarouselProps,
} from "./interface";

const [useProvideCarousel, useInjectCarousel] = createInjectionState(
	({ opts, orientation, plugins }: CarouselProps, emits: CarouselEmits) => {
		const [emblaNode, emblaApi] = emblaCarouselVue(
			{
				...opts,
				axis: orientation === "horizontal" ? "x" : "y",
			},
			plugins,
		);

		function scrollPrev() {
			emblaApi.value?.scrollPrev();
		}
		function scrollNext() {
			emblaApi.value?.scrollNext();
		}

		const isLoop = Boolean(unref(opts)?.loop);
		const canScrollNext = ref(isLoop);
		const canScrollPrev = ref(isLoop);

		function onSelect(api: CarouselApi) {
			const loopActive = Boolean(unref(opts)?.loop);
			if (loopActive) {
				canScrollNext.value = true;
				canScrollPrev.value = true;
			} else {
				canScrollNext.value = api?.canScrollNext() || false;
				canScrollPrev.value = api?.canScrollPrev() || false;
			}
		}

		onMounted(() => {
			if (!emblaApi.value) return;

			emblaApi.value?.on("init", onSelect);
			emblaApi.value?.on("reInit", onSelect);
			emblaApi.value?.on("select", onSelect);

			emits("init-api", emblaApi.value);
		});

		const setCarouselRef = (el: Element | ComponentPublicInstance | null) => {
			if (el instanceof HTMLElement) {
				emblaNode.value = el;
			}
		};

		return {
			carouselRef: emblaNode,
			setCarouselRef,
			carouselApi: emblaApi,
			canScrollPrev,
			canScrollNext,
			scrollPrev,
			scrollNext,
			orientation,
		};
	},
);

function useCarousel() {
	const carouselState = useInjectCarousel();

	if (!carouselState)
		throw new Error("useCarousel must be used within a <Carousel />");

	return carouselState;
}

export { useCarousel, useProvideCarousel };
