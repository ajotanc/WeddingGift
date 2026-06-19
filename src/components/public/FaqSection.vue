<script setup lang="ts">
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import type { IFaq } from "@/services/faq.service";

defineProps<{
	faqs: IFaq[];
}>();
</script>

<template>
	<section id="faq" class="space-y-12 scroll-mt-10">
		<div class="text-center mb-12">
			<h2 class="text-3xl font-serif text-slate-900 mb-4">Dúvidas Frequentes</h2>
			<p class="text-slate-500 font-light max-w-xl mx-auto text-base">
				Caso tenha alguma dúvida sobre o evento, confira as perguntas mais comuns dos nossos convidados abaixo.
			</p>
		</div>

		<div class="max-w-3xl mx-auto">
			<Accordion type="single" collapsible class="w-full space-y-4">
				<AccordionItem v-for="faq in faqs" :key="faq.$id" :value="faq.$id"
					class="bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] rounded-2xl px-6 py-2 transition-shadow hover:shadow-md">
					<AccordionTrigger
						class="hover:no-underline font-serif text-base text-slate-800 font-medium py-4 text-left">
						{{ faq.question }}
					</AccordionTrigger>
					<AccordionContent class="text-slate-500 font-light leading-relaxed pb-4 text-left">
						{{ faq.answer }}
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	</section>
</template>
