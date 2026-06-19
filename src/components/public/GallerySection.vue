<script setup lang="ts">
import { Button } from "@/components/ui/button";
import ImageGallery from "@/components/ui/ImageGallery.vue";
import type { IGalleryImage } from "@/services/gallery.service";
import { Camera } from "lucide-vue-next";

defineProps<{
	images: IGalleryImage[];
	isWithin7DaysOfEvent: boolean;
	slug: string;
	currentGuestId: string;
}>();

defineEmits<{
	(e: "like", img: IGalleryImage): void;
}>();
</script>

<template>
	<section id="gallery" class="space-y-12 scroll-mt-10">
		<div class="text-center mb-12">
			<h2 class="text-3xl font-serif text-slate-900 mb-4">Galeria de Fotos</h2>
			<p class="text-slate-500 font-light max-w-xl mx-auto text-base">
				Momentos especiais compartilhados por nós. Deixe o seu carinho curtindo suas fotos favoritas!
			</p>
		</div>

		<div v-if="images.length > 0">
			<ImageGallery :images="images" :carousel="true" :autoplay="true"
				:currentGuestId="currentGuestId" @like="$emit('like', $event)" />
		</div>
		<div v-else
			class="text-center text-slate-400 py-12 bg-white/40 border border-dashed rounded-3xl text-sm font-light">
			Nenhuma foto em exibição na página inicial.
		</div>

		<!-- Guest Gallery Redirect Banner -->
		<div v-if="isWithin7DaysOfEvent"
			class="p-8 rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] text-center flex flex-col items-center justify-center gap-4 mx-auto">
			<Camera class="w-8 h-8 text-primary animate-pulse" />
			<h3 class="text-xl font-serif text-slate-900 font-medium">Galeria dos Convidados</h3>
			<p class="text-slate-500 font-light text-sm max-w-md">
				Queremos muito ver o dia sob os seus olhos! Clique abaixo para ver as fotos do evento e compartilhar os
				cliques que você tirou do nosso grande dia.
			</p>
			<router-link :to="`/${slug}/gallery`">
				<Button class="rounded-xl flex items-center gap-2">
					<Camera class="w-4 h-4" />
					Ver & Compartilhar Fotos
				</Button>
			</router-link>
		</div>
	</section>
</template>
