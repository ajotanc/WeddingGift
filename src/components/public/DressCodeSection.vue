<script setup lang="ts">
import { Shirt } from "lucide-vue-next";

defineProps<{
	dressCodeText: string;
}>();
</script>

<template>
	<section id="dresscode" class="text-center mx-auto scroll-mt-10 animate-in fade-in duration-500">
		<div class="mb-8">
			<div class="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
				<Shirt class="w-6 h-6" />
			</div>
			<h2 class="text-3xl font-serif text-slate-900 mb-4">Guia de Trajes</h2>
			<p class="text-slate-500 font-light max-w-xl mx-auto text-base">
				Preparamos algumas orientações sobre o traje recomendado para que você aproveite o nosso dia da melhor forma.
			</p>
		</div>

		<div class="bg-white/80 backdrop-blur p-8 rounded-3xl border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-shadow duration-300 hover:shadow-md">
			<div class="text-slate-600 font-light text-base md:text-lg leading-relaxed text-left quill-content whitespace-pre-line"
				v-html="dressCodeText"></div>
		</div>
	</section>
</template>
