<script setup lang="ts">
import DOMPurify from "dompurify";
import { Shirt } from "lucide-vue-next";
import { computed } from "vue";

const props = defineProps<{
	dressCodeText: string;
	primaryColor?: string;
}>();

const sanitizedDressCodeText = computed(() =>
	DOMPurify.sanitize(props.dressCodeText),
);

const themeColor = computed(() => props.primaryColor || '#ec4899');
</script>

<template>
	<section id="dresscode" class="max-w-3xl mx-auto scroll-mt-16 animate-in fade-in duration-500">
		<div class="relative bg-white border border-[#E8E2DD]/80 p-8 md:p-12 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.015)] overflow-hidden">
			<!-- Subtle corner frames for high-end invitation feel -->
			<div class="absolute top-4 left-4 w-4 h-4 border-t border-l" :style="{ borderColor: themeColor + '40' }"></div>
			<div class="absolute top-4 right-4 w-4 h-4 border-t border-r" :style="{ borderColor: themeColor + '40' }"></div>
			<div class="absolute bottom-4 left-4 w-4 h-4 border-b border-l" :style="{ borderColor: themeColor + '40' }"></div>
			<div class="absolute bottom-4 right-4 w-4 h-4 border-b border-r" :style="{ borderColor: themeColor + '40' }"></div>

			<div class="text-center mb-8">
				<!-- Elegant diamond icon frame -->
				<div class="w-10 h-10 border flex items-center justify-center mx-auto mb-6 rounded-xl rotate-45" :style="{ borderColor: themeColor + '99' }">
					<Shirt class="w-4 h-4 -rotate-45" :style="{ color: themeColor }" />
				</div>
				<span class="text-[10px] font-bold tracking-[0.25em] uppercase" :style="{ color: themeColor }">Dress Code</span>
				<h2 class="text-3xl font-serif text-[#1E1A17] mt-2 mb-4 font-semibold">Guia de Trajes</h2>
				<p class="text-[#5A4F4A] font-light max-w-xl mx-auto text-sm leading-relaxed">
					Preparamos algumas sugestões sobre o traje recomendado para que todos os nossos convidados se sintam confortáveis e elegantes no nosso dia.
				</p>
			</div>

			<div class="border-t border-[#E8E2DD]/60 pt-8 mt-6">
				<div class="text-[#5A4F4A] font-light text-base md:text-lg leading-relaxed text-left md:text-center quill-content whitespace-pre-line tracking-wide max-w-xl mx-auto"
					v-html="sanitizedDressCodeText"></div>
			</div>
		</div>
	</section>
</template>
