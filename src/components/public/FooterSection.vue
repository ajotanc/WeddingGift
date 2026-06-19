<script setup lang="ts">
import { Heart } from "lucide-vue-next";
import dayjs from "dayjs";
import type { ITenant } from "@/services/tenant.service";

defineProps<{
	tenant: ITenant;
}>();
</script>

<template>
	<!-- Footer -->
	<footer class="border-t border-slate-100 bg-white py-12 px-6">
		<div
			class="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
			<div class="space-y-2">
				<img v-if="tenant?.logo_url" :src="tenant.logo_url" alt="tenant?.couple_name" class="h-16 mx-auto">
				<h3 class="font-serif text-2xl text-slate-900 tracking-tight">{{ tenant?.couple_name }}</h3>
				<p v-if="tenant?.event_date" class="text-sm text-slate-400 font-light">
					{{ dayjs(tenant?.event_date).format('DD [de] MMMM [de] YYYY') }}
				</p>
			</div>

			<div class="flex flex-col md:items-end gap-3">
				<p class="italic text-slate-500 font-serif text-sm max-w-xs text-center md:text-right">
					"Com carinho, obrigado por fazer parte da nossa história!"
				</p>
				<div class="flex items-center justify-center md:justify-end gap-1.5 text-xs text-slate-400 font-light mt-1">
					<span>{{ dayjs().format("YYYY") }} &copy;</span>
					<span>Desenvolvido com</span>
					<Heart class="w-3.5 h-3.5 fill-red-400 text-red-400 inline" />
					<span>por <a class="font-bold" href="https://instagram.com/ajotanc" target="_blank">AJOTA</a></span>
				</div>
			</div>
		</div>
	</footer>
</template>
