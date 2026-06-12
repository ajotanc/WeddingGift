<script setup lang="ts">
import { ref, watch } from 'vue'
import { Search, MapPin } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

// Props – optional placeholder
const props = defineProps<{ placeholder?: string }>()
const emit = defineEmits<{ (e: 'select', payload: { address: string; latitude: number; longitude: number }): void }>()

const query = ref('')
const results = ref<Array<{ display_name: string; lat: string; lon: string }>>([])
const loading = ref(false)
const showList = ref(false)
let debounceTimer: NodeJS.Timeout | null = null

const fetchSuggestions = async (search: string) => {
  if (!search) {
    results.value = []
    return
  }
  loading.value = true
  try {
    const params = new URLSearchParams({
      format: 'json',
      addressdetails: '1',
      countrycodes: 'br',
      q: search,
      limit: '10',
    })
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`)
    const data = await response.json()
    results.value = data
    showList.value = true
  } catch (e) {
    console.error('Nominatim fetch error', e)
    results.value = []
  } finally {
    loading.value = false
  }
}

const onInput = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchSuggestions(query.value)
  }, 500)
}

const selectSuggestion = (item: { display_name: string; lat: string; lon: string }) => {
  const payload = {
    address: item.display_name,
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
  }
  emit('select', payload)
  query.value = item.display_name
  showList.value = false
}

// Close dropdown when clicking outside
const onBlur = () => {
  setTimeout(() => (showList.value = false), 200)
}
</script>

<template>
  <div class="relative w-full" @blur="onBlur">
    <div class="relative">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
      <input
        v-model="query"
        :placeholder="props.placeholder ?? 'Encontrar endereço…'"
        class="w-full pl-10 px-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-slate-700"
        @input="onInput"
        autocomplete="off"
      />
    </div>
    <ul
      v-if="showList && results.length"
      class="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg max-h-60 overflow-auto"
    >
      <li
        v-for="item in results"
        :key="item.lat + '-' + item.lon"
        class="flex items-center px-4 py-2 cursor-pointer hover:bg-slate-100"
        @click="selectSuggestion(item)"
      >
        <MapPin class="w-4 h-4 mr-2 text-primary" />
        <span class="text-sm text-slate-700" v-html="item.display_name"></span>
      </li>
    </ul>
    <div v-if="loading" class="absolute inset-y-0 right-3 flex items-center">
      <svg class="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
      </svg>
    </div>
  </div>
</template>

<style scoped>
/* No extra CSS needed – Tailwind utilities handle styling */
</style>
