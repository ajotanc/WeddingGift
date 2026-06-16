import type emblaCarouselVue from "embla-carousel-vue";
import type { HTMLAttributes, UnwrapRef } from "vue";

export interface CarouselProps {
	opts?: Parameters<typeof emblaCarouselVue>[0];
	plugins?: Parameters<typeof emblaCarouselVue>[1];
	orientation?: "horizontal" | "vertical";
}

export type CarouselEmits = (
	e: "init-api",
	payload: UnwrapRef<ReturnType<typeof emblaCarouselVue>>[1],
) => void;

export interface WithClassAsProps {
	class?: HTMLAttributes["class"];
}
