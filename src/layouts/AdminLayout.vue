<script setup lang="ts">
import { useTenant } from "@/composables/useTenant";
import { useAuthStore } from "@/stores/auth";
import {
	Box,
	Gift,
	LayoutDashboard,
	LogOut,
	Settings,
	Users,
} from "lucide-vue-next";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const { tenant, loading, error } = useTenant();
const authStore = useAuthStore();

const handleLogout = async () => {
	await authStore.logout();
	router.push({ name: "login" });
};

const navItems = [
	{ name: "Dashboard", path: "dashboard", icon: LayoutDashboard },
	{ name: "Presentes", path: "products", icon: Box },
	{ name: "Recebidos", path: "purchases", icon: Gift },
	{ name: "Convidados", path: "guests", icon: Users },
	{ name: "Configurações", path: "config", icon: Settings },
];

const isActive = (path: string) => route.path.includes(`/${path}`);
</script>

<template>
  <div class="min-h-screen bg-zinc-50 font-sans text-slate-600 flex flex-col">
    <header class="bg-white border-b border-zinc-200 sticky top-0 z-40 w-full">
      <div class="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">

        <div class="flex items-center gap-3">
          <h1 class="text-lg font-bold text-slate-900 tracking-tight whitespace-nowrap">Casamento</h1>
          <span v-if="tenant" :style="{ backgroundColor: tenant.primary_color + '20', color: tenant.primary_color }"
            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold">
            {{ tenant.couple_name }}
          </span>
        </div>

        <nav class="hidden md:flex items-center gap-1">
          <router-link v-for="item in navItems" :key="item.path" :to="`/${route.params.slug}/admin/${item.path}`"
            class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2.5"
            :class="isActive(item.path) ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-zinc-100 hover:text-slate-900'">
            <component :is="item.icon" class="w-4 h-4" />
            {{ item.name }}
          </router-link>

          <div class="w-px h-6 bg-zinc-200 mx-2"></div>

          <button @click="handleLogout"
            class="p-3 rounded-full text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 flex items-center gap-2">
            <LogOut class="w-4 h-4" />
          </button>
        </nav>
      </div>

      <nav class="md:hidden flex overflow-x-auto border-t border-zinc-100 bg-white w-full hide-scrollbar">
        <router-link v-for="item in navItems" :key="item.path" :to="`/${route.params.slug}/admin/${item.path}`"
          class="flex-none min-w-[80px] flex flex-col items-center justify-center gap-1 py-3 px-3 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2"
          :class="isActive(item.path) ? 'border-primary text-primary' : 'border-transparent text-slate-400'">
          <component :is="item.icon" class="w-5 h-5" />
          {{ item.name }}
        </router-link>

        <button @click="handleLogout"
          class="flex-none min-w-[80px] flex flex-col items-center justify-center gap-1 py-3 px-3 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 border-transparent text-red-500 hover:text-red-600 hover:bg-red-50">
          <LogOut class="w-5 h-5" />
          Sair
        </button>
      </nav>
    </header>

    <main class="flex-1 max-w-6xl w-full mx-auto p-4 md:p-10 overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center min-h-[50vh] w-full text-slate-400 font-light tracking-wide animate-pulse">
        Carregando painel...
      </div>
      <div v-else-if="error" class="text-center p-20 text-red-500 font-medium">{{ error }}</div>
      <router-view v-else-if="tenant" />
    </main>
  </div>
</template>

<style scoped>
/* Garante que o menu mobile não force o scroll da página */
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>