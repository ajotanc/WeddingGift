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
import { computed } from "vue";
import type { Component } from "vue";

const props = defineProps<{
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

const themeColor = computed(() => props.primaryColor || '#ec4899');
</script>

<template>
	<section id="schedule" class="space-y-12 max-w-3xl mx-auto scroll-mt-16 py-8">
		<!-- Section Header -->
		<div class="text-left border-b border-[#E8E2DD]/60 pb-6">
			<span class="text-[10px] font-bold tracking-[0.25em] uppercase" :style="{ color: themeColor }">Celebração</span>
			<h2 class="text-3xl md:text-4xl font-serif text-[#1E1A17] mt-2 font-semibold">Cronograma do Dia</h2>
		</div>

		<!-- Left-aligned Linear Timeline (Clean and sequential) -->
		<div class="relative space-y-10">
			<!-- Timeline Vertical Line -->
			<div class="absolute left-4 md:left-5 top-2 bottom-2 w-[1px]" :style="{ backgroundColor: themeColor + '40' }"></div>

			<!-- Timeline Items -->
			<div v-for="item in schedules" :key="item.title" class="relative group pl-12 md:pl-16 text-left">
				<!-- Bullet Indicator with Icon directly on the timeline line -->
				<div class="absolute left-4 md:left-5 -translate-x-1/2 top-1.5 w-8 h-8 rounded-full bg-white border flex items-center justify-center transition-all duration-300 group-hover:scale-110 z-10 shadow-xs"
					:style="{ borderColor: themeColor, color: themeColor }">
					<component :is="getIcon(item.icon)" class="w-3.5 h-3.5" />
				</div>

				<div class="space-y-1">
					<!-- Hour label -->
					<span class="text-xs font-bold tracking-widest uppercase font-sans block" :style="{ color: themeColor }">
						{{ item.hour }}
					</span>

					<!-- Content block -->
					<div>
						<h3 class="font-serif text-lg font-bold text-[#1E1A17] group-hover:text-primary transition-colors">
							{{ item.title }}
						</h3>
						<p class="text-sm text-[#5A4F4A] leading-relaxed font-light mt-1">
							{{ item.description }}
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>
