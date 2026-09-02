<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
	Check,
	ChevronDown,
	ChevronUp,
	Edit3,
	HelpCircle,
	Loader2,
	MapPin,
	MousePointerClick,
	Search,
} from "lucide-vue-next";
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { toast } from "vue-sonner";

interface INominatimAddress {
	road?: string;
	suburb?: string;
	city?: string;
	town?: string;
	village?: string;
	municipality?: string;
	state?: string;
	postcode?: string;
	country?: string;
}

interface INominatimItem {
	place_id: number;
	licence: string;
	osm_type: string;
	osm_id: number;
	lat: string;
	lon: string;
	display_name: string;
	address?: INominatimAddress;
}

interface ICepData {
	cep: string;
	street?: string;
	neighborhood?: string;
	city?: string;
	state?: string;
	lat?: number | null;
	lon?: number | null;
}

export interface ILocationSelection {
	address: string;
	latitude: number | null;
	longitude: number | null;
}

const props = defineProps<{
	placeholder?: string;
	initialAddress?: string | null;
	initialLatitude?: number | string | null;
	initialLongitude?: number | string | null;
}>();

const emit = defineEmits<(e: "select", payload: ILocationSelection) => void>();

const query = ref(props.initialAddress || "");
const currentLat = ref<number | null>(
	props.initialLatitude !== undefined && props.initialLatitude !== null
		? Number(props.initialLatitude)
		: null,
);
const currentLon = ref<number | null>(
	props.initialLongitude !== undefined && props.initialLongitude !== null
		? Number(props.initialLongitude)
		: null,
);

const results = ref<INominatimItem[]>([]);
const loading = ref(false);
const showList = ref(false);
const isMapOpen = ref(false);
const showManualCoords = ref(false);

const manualLat = ref<string>(currentLat.value?.toString() || "");
const manualLon = ref<string>(currentLon.value?.toString() || "");

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const miniMapContainer = ref<HTMLElement | null>(null);
let miniMap: L.Map | null = null;
let miniMarker: L.Marker | null = null;

// Função para extrair coordenadas de URLs do Google Maps ou de texto puro de coordenadas
const extractCoordinatesFromText = (
	text: string,
): { lat: number; lon: number } | null => {
	const trimmed = text.trim();

	// 1. Google Maps URL pattern: /@(-?\d+\.\d+),(-?\d+\.\d+)/
	const urlMatch = trimmed.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/);
	if (urlMatch) {
		const lat = Number.parseFloat(urlMatch[1]);
		const lon = Number.parseFloat(urlMatch[2]);
		if (!Number.isNaN(lat) && !Number.isNaN(lon)) return { lat, lon };
	}

	// 2. Query param pattern: ?q=(-?\d+\.\d+),(-?\d+\.\d+) ou ll=(-?\d+\.\d+),(-?\d+\.\d+)
	const queryMatch = trimmed.match(
		/[?&](?:q|ll)=(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/,
	);
	if (queryMatch) {
		const lat = Number.parseFloat(queryMatch[1]);
		const lon = Number.parseFloat(queryMatch[2]);
		if (!Number.isNaN(lat) && !Number.isNaN(lon)) return { lat, lon };
	}

	// 3. Texto direto de coordenadas: "-12.9184512, -38.3601245" ou "-12.9184512 -38.3601245"
	const directMatch = trimmed.match(/^(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)$/);
	if (directMatch) {
		const lat = Number.parseFloat(directMatch[1]);
		const lon = Number.parseFloat(directMatch[2]);
		if (!Number.isNaN(lat) && !Number.isNaN(lon)) return { lat, lon };
	}

	return null;
};

// Resolução de CEP brasileiro com múltiplos provedores em cascata (BrasilAPI -> AwesomeAPI -> ViaCEP)
const resolveBrazilianCep = async (
	rawCep: string,
): Promise<ICepData | null> => {
	const cleanCep = rawCep.replace(/\D/g, "");
	if (cleanCep.length !== 8) return null;

	// 1. BrasilAPI (v2)
	try {
		const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cleanCep}`);
		if (res.ok) {
			const data = await res.json();
			if (data && (data.street || data.city)) {
				const lat = data.location?.coordinates?.latitude
					? Number.parseFloat(data.location.coordinates.latitude)
					: null;
				const lon = data.location?.coordinates?.longitude
					? Number.parseFloat(data.location.coordinates.longitude)
					: null;
				return {
					cep: cleanCep,
					street: data.street,
					neighborhood: data.neighborhood,
					city: data.city,
					state: data.state,
					lat,
					lon,
				};
			}
		}
	} catch {
		// fallback
	}

	// 2. AwesomeAPI
	try {
		const res = await fetch(`https://cep.awesomeapi.com.br/json/${cleanCep}`);
		if (res.ok) {
			const data = await res.json();
			if (data && (data.address || data.city)) {
				const lat = data.lat ? Number.parseFloat(data.lat) : null;
				const lon = data.lng ? Number.parseFloat(data.lng) : null;
				return {
					cep: cleanCep,
					street: data.address,
					neighborhood: data.district,
					city: data.city,
					state: data.state,
					lat,
					lon,
				};
			}
		}
	} catch {
		// fallback
	}

	// 3. ViaCEP
	try {
		const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
		if (res.ok) {
			const data = await res.json();
			if (data && !data.erro && (data.logradouro || data.localidade)) {
				return {
					cep: cleanCep,
					street: data.logradouro,
					neighborhood: data.bairro,
					city: data.localidade,
					state: data.uf,
					lat: null,
					lon: null,
				};
			}
		}
	} catch {
		// ignora
	}

	return null;
};

// Expandir abreviações e limpar ruídos que atrapalham o Nominatim
const normalizeSearchQuery = (text: string): string => {
	return text
		.replace(/\b\d{5}-?\d{3}\b/g, "")
		.replace(/\bR\.\s*/gi, "Rua ")
		.replace(/\bAv\.\s*/gi, "Avenida ")
		.replace(/\bDes\.\s*/gi, "Desembargador ")
		.replace(/\bProf\.\s*|\bProfa\.\s*/gi, "Professor ")
		.replace(/\bDr\.\s*|\bDra\.\s*/gi, "Doutor ")
		.replace(/\bTv\.\s*|\bTrav\.\s*/gi, "Travessa ")
		.replace(/\bRod\.\s*/gi, "Rodovia ")
		.replace(/\bAl\.\s*/gi, "Alameda ")
		.replace(/\bPç\.\s*|\bPc\.\s*/gi, "Praça ")
		.replace(/-\s*([A-Z]{2})\b/g, ", $1")
		.replace(/\s*-\s*/g, ", ")
		.replace(/\s+,/g, ",")
		.replace(/,+/g, ",")
		.replace(/^[\s,]+|[\s,]+$/g, "")
		.trim();
};

const fetchNominatim = async (queryStr: string): Promise<INominatimItem[]> => {
	const params = new URLSearchParams({
		format: "json",
		addressdetails: "1",
		countrycodes: "br",
		q: queryStr,
		limit: "8",
	});
	const response = await fetch(
		`https://nominatim.openstreetmap.org/search?${params.toString()}`,
		{
			headers: {
				"Accept-Language": "pt-BR,pt;q=0.9",
			},
		},
	);
	if (!response.ok) return [];
	return await response.json();
};

const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
	try {
		const params = new URLSearchParams({
			format: "json",
			lat: lat.toString(),
			lon: lon.toString(),
		});
		const response = await fetch(
			`https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
			{
				headers: { "Accept-Language": "pt-BR,pt;q=0.9" },
			},
		);
		if (response.ok) {
			const data = await response.json();
			return data.display_name || `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
		}
	} catch (e) {
		console.error("Erro na geocodificação reversa:", e);
	}
	return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
};

const emitLocation = (
	address: string,
	lat?: number | null,
	lon?: number | null,
) => {
	const finalLat = lat !== undefined ? lat : currentLat.value;
	const finalLon = lon !== undefined ? lon : currentLon.value;
	emit("select", {
		address: address.trim(),
		latitude: finalLat,
		longitude: finalLon,
	});
};

const fetchSuggestions = async (search: string) => {
	const trimmed = search.trim();
	if (!trimmed || trimmed.length < 3) {
		results.value = [];
		showList.value = false;
		return;
	}

	// 1. Verifica se foram coladas coordenadas ou link do Google Maps
	const parsedCoords = extractCoordinatesFromText(trimmed);
	if (parsedCoords) {
		loading.value = true;
		const address = await reverseGeocode(parsedCoords.lat, parsedCoords.lon);
		loading.value = false;
		applyCoordinateSelection(parsedCoords.lat, parsedCoords.lon, address);
		showList.value = false;
		return;
	}

	loading.value = true;
	showList.value = true;

	try {
		const cepMatch =
			trimmed.match(/\b\d{5}-?\d{3}\b/) ||
			(trimmed.replace(/\D/g, "").length === 8 ? [trimmed] : null);
		let cepData: ICepData | null = null;

		if (cepMatch) {
			cepData = await resolveBrazilianCep(cepMatch[0]);
		}

		let list: INominatimItem[] = [];

		if (cepData) {
			const cepAddressQuery = [
				cepData.street,
				cepData.neighborhood,
				cepData.city,
				cepData.state,
				"Brasil",
			]
				.filter(Boolean)
				.join(", ");

			list = await fetchNominatim(cepAddressQuery);

			const fallbackLat =
				cepData.lat || (list[0] ? Number.parseFloat(list[0].lat) : -12.9714);
			const fallbackLon =
				cepData.lon || (list[0] ? Number.parseFloat(list[0].lon) : -38.5014);

			const synthesizedItem: INominatimItem = {
				place_id: Date.now(),
				licence: "CEP Oficial",
				osm_type: "node",
				osm_id: 0,
				lat: fallbackLat.toString(),
				lon: fallbackLon.toString(),
				display_name: [
					cepData.street,
					cepData.neighborhood,
					cepData.city,
					`${cepData.state} - CEP ${cepData.cep}`,
				]
					.filter(Boolean)
					.join(", "),
				address: {
					road: cepData.street,
					suburb: cepData.neighborhood,
					city: cepData.city,
					state: cepData.state,
					postcode: cepData.cep,
					country: "Brasil",
				},
			};

			list = [
				synthesizedItem,
				...list.filter((x) => x.lat !== synthesizedItem.lat),
			];
		} else {
			const normalized = normalizeSearchQuery(trimmed);
			list = await fetchNominatim(normalized || trimmed);

			if (list.length === 0 && normalized !== trimmed) {
				list = await fetchNominatim(trimmed);
			}
		}

		results.value = list;
	} catch (e) {
		console.error("Erro ao buscar sugestões:", e);
		results.value = [];
	} finally {
		loading.value = false;
	}
};

const onInput = () => {
	// Sempre salva e emite o texto digitado em tempo real
	emitLocation(query.value);

	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => {
		fetchSuggestions(query.value);
	}, 400);
};

const getPrimaryAddress = (item: INominatimItem): string => {
	if (item.address?.road) {
		const parts = [item.address.road];
		if (item.address.suburb) parts.push(item.address.suburb);
		return parts.join(" - ");
	}
	const parts = item.display_name.split(",");
	return parts.slice(0, 2).join(", ").trim();
};

const getSecondaryAddress = (item: INominatimItem): string => {
	if (item.address) {
		const city =
			item.address.city ||
			item.address.town ||
			item.address.village ||
			item.address.municipality;
		const state = item.address.state;
		const country = item.address.country;
		const postcode = item.address.postcode
			? ` - CEP ${item.address.postcode}`
			: "";
		return [city, state, country].filter(Boolean).join(", ") + postcode;
	}
	const parts = item.display_name.split(",");
	return parts.slice(2).join(", ").trim();
};

const applyCoordinateSelection = (
	lat: number,
	lon: number,
	addressName?: string,
) => {
	currentLat.value = lat;
	currentLon.value = lon;
	manualLat.value = String(lat);
	manualLon.value = String(lon);

	if (addressName) {
		query.value = addressName;
	}

	emitLocation(query.value, lat, lon);
	updateMiniMap();
};

const selectSuggestion = (item: INominatimItem) => {
	const lat = Number.parseFloat(item.lat);
	const lon = Number.parseFloat(item.lon);
	applyCoordinateSelection(lat, lon, item.display_name);
	showList.value = false;
};

// Usa explicitamente o texto customizado digitado pelo usuário
const selectCustomText = () => {
	emitLocation(query.value);
	showList.value = false;
};

// --- Mini Mapa Interativo para Ajuste do Pino ---
const initMiniMap = async () => {
	await nextTick();
	if (!miniMapContainer.value) return;

	const lat = currentLat.value || -12.9714;
	const lon = currentLon.value || -38.5014;

	if (!miniMap) {
		miniMap = L.map(miniMapContainer.value, {
			scrollWheelZoom: true,
			zoomControl: true,
		}).setView([lat, lon], 17);

		L.tileLayer(
			"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
			{
				attribution: "&copy; Esri",
				maxZoom: 19,
			},
		).addTo(miniMap);

		miniMap.on("click", (e: L.LeafletMouseEvent) => {
			const { lat: clickLat, lng: clickLon } = e.latlng;
			applyCoordinateSelection(clickLat, clickLon);
		});
	} else {
		miniMap.setView([lat, lon], 17);
		miniMap.invalidateSize();
	}

	updateMiniMarker(lat, lon);
};

const updateMiniMarker = (lat: number, lon: number) => {
	if (!miniMap) return;

	if (miniMarker) {
		miniMarker.setLatLng([lat, lon]);
	} else {
		const customIcon = L.divIcon({
			className: "bg-transparent border-0",
			html: `
				<div class="flex items-center justify-center border-2 border-white bg-primary -rotate-45 w-7 h-7 cursor-grab active:cursor-grabbing rounded-[50%_50%_50%_0px] shadow-[2px_2px_6px_rgba(0,0,0,0.3)]">
					<div class="flex items-center justify-center rotate-45 ml-[1px] mb-[1px]">
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" class="lucide lucide-heart">
							<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
						</svg>
					</div>
				</div>
			`,
			iconSize: [28, 28],
			iconAnchor: [14, 28],
		});

		miniMarker = L.marker([lat, lon], {
			draggable: true,
			icon: customIcon,
		}).addTo(miniMap);

		miniMarker.on("dragend", () => {
			if (miniMarker) {
				const pos = miniMarker.getLatLng();
				applyCoordinateSelection(pos.lat, pos.lng);
			}
		});
	}
};

const updateMiniMap = () => {
	if (miniMap && currentLat.value !== null && currentLon.value !== null) {
		miniMap.setView([currentLat.value, currentLon.value], 17);
		updateMiniMarker(currentLat.value, currentLon.value);
	}
};

const toggleMapAdjust = async () => {
	isMapOpen.value = !isMapOpen.value;
	if (isMapOpen.value) {
		await nextTick();
		if (!miniMap) {
			initMiniMap();
		} else {
			setTimeout(() => {
				if (miniMap) {
					miniMap.invalidateSize();
					if (currentLat.value !== null && currentLon.value !== null) {
						miniMap.setView([currentLat.value, currentLon.value], 17);
					}
				}
			}, 50);
		}
	}
};

const applyManualCoordinates = async () => {
	const latStr = manualLat.value.trim().replace(",", ".");
	const lonStr = manualLon.value.trim().replace(",", ".");
	const lat = Number.parseFloat(latStr);
	const lon = Number.parseFloat(lonStr);

	if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
		let address = query.value.trim();
		if (!address) {
			loading.value = true;
			address = await reverseGeocode(lat, lon);
			loading.value = false;
		}
		applyCoordinateSelection(lat, lon, address);
		toast.success(`Coordenadas aplicadas: ${lat}, ${lon}`);
	} else {
		toast.error("Por favor, insira valores válidos de latitude e longitude.");
	}
};

const onBlur = (event: FocusEvent) => {
	const currentTarget = event.currentTarget as HTMLElement | null;
	const relatedTarget = event.relatedTarget as HTMLElement | null;
	if (currentTarget && relatedTarget && currentTarget.contains(relatedTarget)) {
		return;
	}
	emitLocation(query.value);
	setTimeout(() => {
		showList.value = false;
	}, 250);
};

watch(
	() => [props.initialAddress, props.initialLatitude, props.initialLongitude],
	([newAddr, newLat, newLon]) => {
		if (newAddr) query.value = String(newAddr);
		if (newLat) {
			currentLat.value = Number(newLat);
			manualLat.value = String(newLat);
		}
		if (newLon) {
			currentLon.value = Number(newLon);
			manualLon.value = String(newLon);
		}
	},
);

onMounted(() => {
	if (props.initialLatitude && props.initialLongitude) {
		currentLat.value = Number(props.initialLatitude);
		currentLon.value = Number(props.initialLongitude);
	}
});

onUnmounted(() => {
	if (miniMap) {
		miniMap.remove();
		miniMap = null;
		miniMarker = null;
	}
});
</script>

<template>
	<div class="space-y-2.5 w-full">
		<div class="relative w-full" @focusout="onBlur">
			<div class="relative">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
				<Input v-model="query" :placeholder="props.placeholder ?? 'Digite o endereço, CEP ou coordenadas...'"
					class="w-full pl-9 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-700 text-sm"
					@input="onInput" @change="emitLocation(query)" @keydown.enter.prevent="selectCustomText"
					@focus="query.length >= 3 && results.length > 0 ? showList = true : null" autocomplete="off" />
				<div v-if="loading" class="absolute inset-y-0 right-3 flex items-center pointer-events-none">
					<Loader2 class="animate-spin h-4 w-4 text-primary" />
				</div>
			</div>

			<!-- Dropdown de Resultados e Opção Manual -->
			<div v-if="showList"
				class="absolute z-50 w-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-100 max-h-72 overflow-auto divide-y divide-slate-100">
				<template v-if="results.length > 0">
					<button v-for="item in results" :key="item.place_id || (item.lat + '-' + item.lon)" type="button"
						class="w-full flex items-start text-left px-4 py-2.5 cursor-pointer hover:bg-primary/5 transition-colors group"
						@mousedown.prevent="selectSuggestion(item)">
						<MapPin class="w-4 h-4 mr-2.5 mt-0.5 text-primary shrink-0 transition-transform group-hover:scale-110" />
						<div class="flex flex-col min-w-0 flex-1">
							<span class="text-xs font-semibold text-slate-800 line-clamp-1">
								{{ getPrimaryAddress(item) }}
							</span>
							<span class="text-[11px] text-slate-500 line-clamp-1">
								{{ getSecondaryAddress(item) }}
							</span>
						</div>
					</button>
				</template>

				<!-- Opção de usar exatamente o texto digitado caso não encontre ou queira personalizado -->
				<button v-if="query.trim().length > 0" type="button" @mousedown.prevent="selectCustomText"
					class="w-full p-3 text-left hover:bg-primary/5 transition-colors flex items-center gap-2.5 cursor-pointer group bg-slate-50/50">
					<Edit3 class="w-4 h-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
					<div class="flex flex-col min-w-0 flex-1">
						<span class="text-xs font-medium text-slate-700">
							Salvar texto personalizado: <strong class="text-slate-900 font-semibold">"{{ query }}"</strong>
						</span>
						<span class="text-[10px] text-slate-400">
							Manter este endereço exatamente como você escreveu
						</span>
					</div>
					<Check class="w-4 h-4 text-primary shrink-0 opacity-70 group-hover:opacity-100" />
				</button>
			</div>
		</div>

		<!-- Barra de Ações Rápidas: Ajustar Pino e Coordenadas -->
		<div class="flex items-center justify-between gap-2 flex-wrap text-xs">
			<div class="flex items-center gap-2">
				<button type="button" @click="toggleMapAdjust"
					class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-medium transition-colors cursor-pointer">
					<MousePointerClick class="w-3.5 h-3.5" />
					<span>{{ isMapOpen ? 'Ocultar ajuste no mapa' : 'Ajustar pino exato no mapa' }}</span>
					<component :is="isMapOpen ? ChevronUp : ChevronDown" class="w-3 h-3 ml-0.5" />
				</button>

				<button type="button" @click="showManualCoords = !showManualCoords"
					class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer">
					<span>Coordenadas</span>
					<component :is="showManualCoords ? ChevronUp : ChevronDown" class="w-3 h-3" />
				</button>
			</div>

		</div>

		<!-- Painel de Coordenadas Manuais -->
		<div v-if="showManualCoords"
			class="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5 text-xs animate-in fade-in duration-200">
			<div class="flex items-center justify-between text-slate-600 font-medium">
				<span class="flex items-center gap-1.5">
					<MapPin class="w-3.5 h-3.5 text-primary" />
					Coordenadas Exatas (Latitude / Longitude)
				</span>
				<span class="text-[10px] text-slate-400">Pegue no Google Maps clicando com botão direito no local</span>
			</div>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
				<div class="space-y-1">
					<label class="text-[10px] uppercase font-bold text-slate-500">Latitude</label>
					<Input v-model="manualLat" placeholder="-12.918451" class="h-8 text-xs bg-white" />
				</div>
				<div class="space-y-1">
					<label class="text-[10px] uppercase font-bold text-slate-500">Longitude</label>
					<Input v-model="manualLon" placeholder="-38.360124" class="h-8 text-xs bg-white" />
				</div>
			</div>
			<Button type="button" size="sm" variant="outline"
				class="w-full h-8 text-xs font-semibold rounded-lg text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
				@click="applyManualCoordinates">
				<Check class="w-3.5 h-3.5 mr-1" /> Aplicar Coordenadas
			</Button>
		</div>

		<!-- Mini Mapa Interativo para Ajuste Fino -->
		<div v-show="isMapOpen"
			class="space-y-2 p-3 bg-slate-50/80 rounded-2xl border border-slate-200 animate-in fade-in duration-200">
			<div class="flex items-center justify-between text-xs text-slate-600">
				<span class="font-semibold flex items-center gap-1.5">
					<MapPin class="w-3.5 h-3.5 text-primary" />
					Arraste o marcador ou clique no local exato do evento
				</span>
				<span class="text-[10px] text-slate-500 font-mono" v-if="currentLat !== null && currentLon !== null">
					{{ currentLat }}, {{ currentLon }}
				</span>
			</div>
			<div class="relative w-full h-[260px] rounded-xl overflow-hidden border border-slate-200 bg-white">
				<div ref="miniMapContainer" class="w-full h-full z-0"></div>
			</div>
			<p class="text-[11px] text-slate-500 flex items-center gap-1">
				<HelpCircle class="w-3.5 h-3.5 shrink-0 text-slate-400" />
				Dica: Você pode dar zoom no mapa e clicar exatamente sobre o portão ou entrada do local para salvar as
				coordenadas
				perfeitas.
			</p>
		</div>
	</div>
</template>
