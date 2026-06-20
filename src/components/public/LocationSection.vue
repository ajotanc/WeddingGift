<script setup lang="ts">
import LeafletMap from "@/components/ui/LeafletMap.vue";
import type { IWeatherData } from "@/services/weather.service";
import {
	Cloud,
	CloudDrizzle,
	CloudLightning,
	CloudRain,
	CloudSun,
	Snowflake,
	Sun,
} from "lucide-vue-next";
import type { Component } from "vue";

defineProps<{
	eventLocation: string;
	eventLatitude?: string | number | null;
	eventLongitude?: string | number | null;
	eventDate?: string | null;
	weatherData?: IWeatherData | null;
	weatherLoading: boolean;
	weatherError: boolean;
	isWeatherExpanded: boolean;
}>();

const emit =
	defineEmits<(e: "update:isWeatherExpanded", val: boolean) => void>();

const getWeatherIcon = (iconName: string): Component => {
	const icons: Record<string, Component> = {
		sun: Sun,
		"cloud-sun": CloudSun,
		cloud: Cloud,
		"cloud-rain": CloudRain,
		"cloud-drizzle": CloudDrizzle,
		"cloud-lightning": CloudLightning,
		snowflake: Snowflake,
	};
	return icons[iconName] || Cloud;
};
</script>

<template>
	<section id="location" class="text-center scroll-mt-10">
		<h2 class="text-3xl font-serif text-slate-900 mb-6">Local do Evento</h2>

		<div
			class="relative bg-white p-2 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80 overflow-hidden">

			<LeafletMap :address="eventLocation" class="z-0" />

			<div v-if="eventLatitude && eventLongitude && eventDate"
				class="absolute bottom-5 left-5 right-5 md:left-5 md:right-auto w-95 md:w-full max-w-xs z-10 flex flex-col items-start">

				<div v-if="isWeatherExpanded"
					class="bg-white/95 backdrop-blur border border-slate-100/80 p-4 md:p-5 rounded-2xl shadow-xl flex items-center justify-between gap-4 w-full cursor-pointer"
					@click="emit('update:isWeatherExpanded', false)">

					<div class="flex items-center gap-4 w-full">
						<div v-if="weatherLoading" class="text-sm text-slate-500 w-full text-center">Carregando...</div>

						<div v-else-if="weatherData" class="flex justify-between items-center w-full">
							<div class="flex items-center gap-3">
								<component :is="getWeatherIcon(weatherData.icon)" class="w-7 h-7 text-primary" />
								<div class="space-y-0.5">
									<h4 class="font-serif text-slate-800 text-sm text-left font-bold uppercase leading-none">
										Previsão de Amor</h4>
									<p class="text-xs text-left text-slate-500 font-light capitalize">{{ weatherData.description }}
									</p>
								</div>
							</div>

							<div class="text-right shrink-0 tabular-nums">
								<div class="text-lg font-bold text-primary">{{ Math.round(weatherData.maxTemp) }}°C</div>
								<div class="text-xs text-slate-400">Mín: {{ Math.round(weatherData.minTemp) }}°C</div>
							</div>
						</div>

						<div v-else-if="!weatherError" class="text-xs text-slate-500 font-light text-left">
							A previsão do tempo ficará disponível cerca de 14 dias antes do casamento.
						</div>
					</div>
				</div>

				<button v-else @click="emit('update:isWeatherExpanded', true)"
					class="bg-white/90 backdrop-blur border border-slate-100 p-3 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center">
					<CloudSun class="w-6 h-6 text-primary" />
				</button>
			</div>
		</div>

		<p class="text-slate-500 font-medium mt-4">{{ eventLocation }}</p>
	</section>
</template>
