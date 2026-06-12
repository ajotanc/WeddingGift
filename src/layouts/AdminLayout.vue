<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useTenant } from '@/composables/useTenant'
import { Gift, Users, Settings, LayoutDashboard } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const { tenant, loading, error } = useTenant()

const navItems = [
  { name: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
  { name: 'Presentes & Cotas', path: 'products', icon: Gift },
  { name: 'Convidados & Recados', path: 'guests', icon: Users },
  { name: 'Configurações', path: 'config', icon: Settings },
]

const isActive = (path: string) => route.path.includes(`/${path}`)
</script>

<template>
  <div class="min-h-screen bg-zinc-50 font-sans text-slate-600 flex flex-col">
    <!-- Navbar -->
    <header class="bg-white border-b border-slate-200/60 sticky top-0 z-40 shadow-sm">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-serif text-slate-900 tracking-tight">Painel do Casal</h1>
          <span v-if="tenant" :style="{ backgroundColor: tenant.theme?.primaryColor + '20', color: tenant.theme?.primaryColor }" class="hidden md:inline text-sm px-3 py-1 rounded-full font-medium">{{ tenant.coupleName }}</span>
        </div>
        
        <nav class="hidden md:flex gap-1">
          <router-link 
            v-for="item in navItems" 
            :key="item.path" 
            :to="`/${route.params.slug}/admin/${item.path}`"
            class="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            :class="isActive(item.path) ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'"
          >
            <component :is="item.icon" class="w-4 h-4" />
            {{ item.name }}
          </router-link>
        </nav>
      </div>

      <!-- Mobile Nav -->
      <nav class="md:hidden flex overflow-x-auto border-t border-slate-100 hide-scrollbar">
        <router-link 
          v-for="item in navItems" 
          :key="item.path" 
          :to="`/${route.params.slug}/admin/${item.path}`"
          class="flex-none min-w-[100px] py-3 px-2 text-center text-xs font-medium transition-colors border-b-2 flex flex-col items-center gap-1.5"
          :class="isActive(item.path) ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-500 hover:bg-slate-50'"
        >
          <component :is="item.icon" class="w-4 h-4" />
          {{ item.name }}
        </router-link>
      </nav>
    </header>

    <!-- Main Content Area -->
    <main class="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10">
      <div v-if="loading" class="flex justify-center p-20 text-slate-400 font-light tracking-wide animate-pulse">Carregando painel...</div>
      <div v-else-if="error" class="text-center p-20 text-red-500 font-medium">{{ error }}</div>
      <router-view v-else-if="tenant" />
    </main>
  </div>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
