<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'



const props = defineProps<{ address: string }>()
const mapContainer = ref<HTMLElement | null>(null)
let map: L.Map | null = null
const loading = ref(true)

const initMap = async () => {
  if (!props.address || !mapContainer.value) return
  
  try {
    loading.value = true
    // Geocode address
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(props.address)}&limit=1`)
    const data = await res.json()
    
    if (!data || data.length === 0) {
      console.error('Location not found')
      return
    }
    
    const lat = parseFloat(data[0].lat)
    const lon = parseFloat(data[0].lon)
    
    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    
    if (!map) {
      map = L.map(mapContainer.value).setView([lat, lon], 15)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map)
    } else {
      map.setView([lat, lon], 15)
    }
    
    L.marker([lat, lon], { icon: customIcon }).addTo(map)
  } catch (err) {
    console.error('Error fetching map location:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  initMap()
})

watch(() => props.address, () => {
  initMap()
})
</script>

<template>
  <div class="relative w-full h-[400px] rounded-[1.5rem] overflow-hidden z-0 border border-slate-100">
    <div v-if="loading" class="absolute inset-0 bg-slate-50 flex items-center justify-center z-10">
      <span class="text-slate-400 font-medium">Carregando mapa...</span>
    </div>
    <div ref="mapContainer" class="w-full h-full"></div>
  </div>
</template>
