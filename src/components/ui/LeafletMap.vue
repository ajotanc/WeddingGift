<script setup lang="ts">
import L from "leaflet";
import { onMounted, onUnmounted, ref, watch } from "vue";
import "leaflet/dist/leaflet.css";

const props = withDefaults(
	defineProps<{
		address?: string | null;
		latitude?: number | string | null;
		longitude?: number | string | null;
		zoom?: number;
	}>(),
	{
		zoom: 18,
	},
);

const mapContainer = ref<HTMLElement | null>(null);
const markerTemplate = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let currentMarker: L.Marker | null = null;
const loading = ref(true);

const initMap = async () => {
	if (!mapContainer.value) return;

	try {
		loading.value = true;
		let lat: number | null = null;
		let lon: number | null = null;

		// 1. Usa latitude e longitude explícitas se existirem
		if (
			props.latitude !== undefined &&
			props.latitude !== null &&
			props.longitude !== undefined &&
			props.longitude !== null &&
			!Number.isNaN(Number(props.latitude)) &&
			!Number.isNaN(Number(props.longitude))
		) {
			lat = Number(props.latitude);
			lon = Number(props.longitude);
		} else if (props.address) {
			// 2. Caso contrário, faz geocodificação do endereço
			const res = await fetch(
				`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(props.address)}&limit=1`,
			);
			const data = await res.json();
			if (data && data.length > 0) {
				lat = Number.parseFloat(data[0].lat);
				lon = Number.parseFloat(data[0].lon);
			}
		}

		if (lat === null || lon === null) {
			console.error("Coordenadas não encontradas para o mapa.");
			return;
		}

		const customIcon = L.divIcon({
			className: "bg-transparent border-0",
			html: markerTemplate.value?.innerHTML || "",
			iconSize: [36, 36],
			iconAnchor: [18, 36],
			popupAnchor: [0, -36],
		});

		if (!map) {
			map = L.map(mapContainer.value, {
				scrollWheelZoom: false,
			}).setView([lat, lon], props.zoom);
			L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
				attribution: "&copy; Esri",
				maxZoom: 19,
			}).addTo(map);
		} else {
			map.setView([lat, lon], props.zoom);
		}

		if (currentMarker) {
			map.removeLayer(currentMarker);
		}

		currentMarker = L.marker([lat, lon], { icon: customIcon }).addTo(map);
	} catch (err) {
		console.error("Erro ao carregar mapa:", err);
	} finally {
		loading.value = false;
	}
};

onMounted(() => {
	initMap();
});

onUnmounted(() => {
	if (map) {
		map.remove();
		map = null;
		currentMarker = null;
	}
});

watch(
	() => [props.address, props.latitude, props.longitude, props.zoom],
	() => {
		initMap();
	},
);
</script>

<template>
	<div class="relative w-full h-[400px] rounded-2xl overflow-hidden z-0 border border-slate-100">
		<div v-if="loading" class="absolute inset-0 bg-slate-50 flex items-center justify-center z-10">
			<span class="text-slate-400 font-medium">Carregando mapa...</span>
		</div>
		<div ref="mapContainer" class="w-full h-full"></div>

		<div ref="markerTemplate" class="hidden">
			<div
				class="flex align-center justify-center border-2 border-white bg-primary -rotate-45 w-8 h-8 cursor-pointer rounded-[50%_50%_50%_0px] shadow-[2px_2px_6px_rgba(0,0,0,0.2)]">
				<div class="flex items-center justify-center rotate-45 ml-[1px] mb-[1px]">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white"
						stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart">
						<path
							d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
					</svg>
				</div>
			</div>
		</div>
	</div>
</template>
