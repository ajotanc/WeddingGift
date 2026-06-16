<script setup lang="ts">
import L from "leaflet";
import { onMounted, ref, watch } from "vue";
import "leaflet/dist/leaflet.css";

const props = defineProps<{ address: string }>();
const mapContainer = ref<HTMLElement | null>(null);
const markerTemplate = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
const loading = ref(true);

const initMap = async () => {
	if (!props.address || !mapContainer.value) return;

	try {
		loading.value = true;
		// Geocode address
		const res = await fetch(
			`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(props.address)}&limit=1`,
		);
		const data = await res.json();

		if (!data || data.length === 0) {
			console.error("Location not found");
			return;
		}

		const lat = Number.parseFloat(data[0].lat);
		const lon = Number.parseFloat(data[0].lon);

		const customIcon = L.divIcon({
			className: "bg-transparent border-0",
			html: markerTemplate.value?.innerHTML || "",
			iconSize: [36, 36],
			iconAnchor: [18, 36],
			popupAnchor: [0, -36],
		});

		if (!map) {
			map = L.map(mapContainer.value).setView([lat, lon], 15);
			L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
				attribution: "&copy; OpenStreetMap contributors",
			}).addTo(map);
		} else {
			map.setView([lat, lon], 15);
		}

		L.marker([lat, lon], { icon: customIcon }).addTo(map);
	} catch (err) {
		console.error("Error fetching map location:", err);
	} finally {
		loading.value = false;
	}
};

onMounted(() => {
	initMap();
});

watch(
	() => props.address,
	() => {
		initMap();
	},
);
</script>

<template>
  <div class="relative w-full h-[400px] rounded-[1.5rem] overflow-hidden z-0 border border-slate-100">
    <div v-if="loading" class="absolute inset-0 bg-slate-50 flex items-center justify-center z-10">
      <span class="text-slate-400 font-medium">Carregando mapa...</span>
    </div>
    <div ref="mapContainer" class="w-full h-full"></div>

    <div ref="markerTemplate" class="hidden">
      <div style="background-color: var(--color-primary); width: 36px; height: 36px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 2px 2px 6px rgba(0,0,0,0.2); border: 2px solid white; cursor: pointer;">
        <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center; margin-left: 1px; margin-bottom: 1px;">
          <Heart class="w-4 h-4 text-white fill-white" />
        </div>
      </div>
    </div>
  </div>
</template>
