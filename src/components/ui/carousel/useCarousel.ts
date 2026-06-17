import { createInjectionState } from "@vueuse/core";
// 1. IMPORTAR O TIPO NATIVO DA API DO EMBLA CAROUSEL
import type { EmblaCarouselType } from "embla-carousel";
import emblaCarouselVue from "embla-carousel-vue";
import { onMounted, ref } from "vue";
import type { CarouselEmits, CarouselProps } from "./interface";

const [useProvideCarousel, useInjectCarousel] = createInjectionState(
	({ opts, orientation, plugins }: CarouselProps, emits: CarouselEmits) => {
		const [carouselRef, emblaApi] = emblaCarouselVue(
			{
				...opts,
				axis: orientation === "horizontal" ? "x" : "y",
			},
			plugins,
		);

		const canScrollNext = ref(false);
		const canScrollPrev = ref(false);

		function scrollPrev() {
			emblaApi.value?.scrollPrev();
		}
		function scrollNext() {
			emblaApi.value?.scrollNext();
		}
		function scrollTo(index: number) {
			emblaApi.value?.scrollTo(index);
		}

		// 2. CORREÇÃO DA ASSINATURA: Tipagem direta com a API nativa do Embla
		const onSelect = (api: EmblaCarouselType) => {
			canScrollNext.value = api.canScrollNext();
			canScrollPrev.value = api.canScrollPrev();
		};

		onMounted(() => {
			if (!emblaApi.value) return;

			// Agora os listeners aceitam o callback perfeitamente sem erros de atribuição
			emblaApi.value.on("init", onSelect);
			emblaApi.value.on("reInit", onSelect);
			emblaApi.value.on("select", onSelect);

			emits("init-api", emblaApi);
		});

		return {
			carouselRef,
			carouselApi: emblaApi,
			canScrollPrev,
			canScrollNext,
			scrollPrev,
			scrollNext,
			scrollTo,
			orientation,
		};
	},
);

export { useInjectCarousel, useProvideCarousel };
