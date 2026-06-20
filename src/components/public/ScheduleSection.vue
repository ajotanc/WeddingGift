<script setup lang="ts">
import type { IScheduleItem } from "@/services/schedule.service";
import {
	Cake,
	Camera,
	Clock,
	Gift,
	GlassWater,
	Heart,
	MapPin,
	Music,
	Sparkles,
	Utensils,
} from "lucide-vue-next";
import type { Component } from "vue";

defineProps<{
	primaryColor: string;
	schedules: IScheduleItem[];
}>();

const ICON_MAP: Record<string, Component> = {
	clock: Clock,
	cheers: GlassWater,
	utensils: Utensils,
	music: Music,
	cake: Cake,
	camera: Camera,
	sparkles: Sparkles,
	"map-pin": MapPin,
	gift: Gift,
};

const getIcon = (iconName: string) => {
	return ICON_MAP[iconName] || Heart;
};
</script>

<template>
	<section id="schedule" class="space-y-12 max-w-3xl mx-auto scroll-mt-10">
		<div class="text-center mb-12">
			<h2 class="text-3xl font-serif text-slate-900 mb-4">Cronograma do Evento</h2>
			<p class="text-slate-500 font-light max-w-xl mx-auto text-base">
				Acompanhe a programação completa do nosso grande dia para não perder nenhum momento especial.
			</p>
		</div>

		<div class="relative border-l-2 ml-4 md:ml-0 space-y-12 py-4" :style="{ borderColor: primaryColor + '33' }">
			<div v-for="item in schedules" :key="item.title" class="relative pl-6 md:pl-10">
				<!-- Icon Marker -->
				<div
					class="absolute -left-[17px] top-1.5 bg-white border-2 border-primary w-8 h-8 rounded-full flex items-center justify-center text-primary shadow-sm">
					<component :is="getIcon(item.icon)" class="w-4 h-4" />
				</div>

				<!-- Content block -->
				<div class="flex flex-col md:flex-row md:items-start md:gap-3">
					<!-- Time Badge -->
					<span class="inline-block shrink-0 py-1 bg-primary/10 text-primary font-semibold text-sm rounded-full w-fit">
						{{ item.hour }}
					</span>
					<div class="space-y-1.5 text-left">
						<h3 class="font-serif text-lg text-slate-800 font-medium">{{ item.title }}</h3>
						<p class="text-sm text-slate-500 font-light leading-relaxed max-w-xl">
							{{ item.description }}
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>
