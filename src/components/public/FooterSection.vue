<script setup lang="ts">
import { useFeedback } from "@/composables/useFeedback";
import type { ITenant } from "@/services/tenant.service";
import dayjs from "dayjs";
import { Heart, MessageSquarePlus } from "lucide-vue-next";

defineProps<{
	tenant: ITenant;
}>();

const { openFeedback } = useFeedback();
</script>

<template>
	<!-- Editorial, Modern & Elegant Wedding Footer -->
	<footer class="border-t border-slate-200/60 bg-gradient-to-b from-slate-50/40 to-slate-100/50 p-6">
		<div class="max-w-3xl mx-auto space-y-10 text-center">

			<!-- Top Editorial Centerpiece -->
			<div class="space-y-2">
				<!-- Brand / Logo if available -->
				<div v-if="tenant?.logo_url" class="mb-3">
					<img :src="tenant.logo_url" :alt="tenant?.couple_name" class="h-28 w-auto object-contain mx-auto">
				</div>

				<!-- Subtle Overline Tag -->
				<div class="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-primary/80">
					<span>Celebrando o Amor</span>
				</div>

				<!-- Couple Name -->
				<h3 class="font-serif text-3xl sm:text-4xl text-slate-900 font-normal tracking-tight">
					{{ tenant?.couple_name }}
				</h3>

				<!-- Event Date -->
				<p v-if="tenant?.event_date" class="text-xs uppercase tracking-[0.25em] text-slate-400 font-medium">
					{{ dayjs(tenant?.event_date).format('DD [de] MMMM [de] YYYY') }}
				</p>

				<!-- Heartfelt Quote -->
				<p class="font-serif italic text-slate-600 text-sm sm:text-base max-w-md mx-auto leading-relaxed pt-1">
					&ldquo;Com carinho e profunda gratidão, obrigado por celebrar este capítulo tão especial ao nosso lado.&rdquo;
				</p>

				<!-- Feedback Button -->
				<div class="pt-3">
					<button type="button" @click="openFeedback"
						class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.03)] text-xs font-semibold text-slate-700 hover:text-primary hover:border-primary/40 hover:shadow-md transition-all duration-200 cursor-pointer">
						<MessageSquarePlus class="w-4 h-4 text-primary" />
						<span>Feedback</span>
					</button>
				</div>
			</div>

			<!-- Delicate Divider with Heart Center -->
			<div class="relative flex items-center justify-center">
				<div class="border-t border-slate-200/80 w-full max-w-sm"></div>
				<div class="absolute bg-slate-50 px-3 text-slate-300">
					<Heart class="w-3.5 h-3.5 text-primary/40 fill-primary/20" />
				</div>
			</div>

			<!-- Bottom Copyright & Credits -->
			<div
				class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-light text-center">
				<p>
					&copy; {{ dayjs().format("YYYY") }} {{ tenant?.couple_name }}. Todos os direitos reservados.
				</p>

				<div class="flex items-center justify-center sm:justify-end gap-1.5 text-slate-400">
					<span>Desenvolvido com</span>
					<Heart class="w-3.5 h-3.5 fill-rose-400 text-rose-400 inline" />
					<span>por <a class="font-bold text-slate-600 hover:text-primary transition-colors"
							href="https://instagram.com/ajotanc" target="_blank" rel="noopener noreferrer">AJOTA</a></span>
				</div>
			</div>

		</div>
	</footer>
</template>
