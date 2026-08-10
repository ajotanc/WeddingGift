<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Cookie } from "lucide-vue-next";
import { onMounted, ref } from "vue";

const isVisible = ref(false);

onMounted(() => {
	const consent = localStorage.getItem("cookie-consent-accepted");
	if (!consent) {
		setTimeout(() => {
			isVisible.value = true;
		}, 1500);
	}
});

const acceptCookies = () => {
	localStorage.setItem("cookie-consent-accepted", "true");
	isVisible.value = false;
};

const declineCookies = () => {
	localStorage.setItem("cookie-consent-accepted", "false");
	isVisible.value = false;
};
</script>

<template>
	<Transition
		enter-active-class="transition duration-500 ease-out"
		enter-from-class="transform translate-y-8 opacity-0 scale-95"
		enter-to-class="transform translate-y-0 opacity-100 scale-100"
		leave-active-class="transition duration-300 ease-in"
		leave-from-class="transform translate-y-0 opacity-100 scale-100"
		leave-to-class="transform translate-y-8 opacity-0 scale-95"
	>
		<div v-if="isVisible" class="fixed bottom-6 left-6 z-[999] max-w-md w-[calc(100%-3rem)] p-7 bg-[#FAF8F6]/95 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-[#E8E2DD] flex flex-col gap-5">
			<div class="flex items-start gap-4">
				<div class="p-3 bg-[#C5A880]/10 text-[#8C6D45] rounded-2xl shrink-0">
					<Cookie class="w-6 h-6 animate-pulse" />
				</div>
				<div class="space-y-2">
					<h4 class="font-serif text-lg font-semibold text-[#1E1A17] leading-tight">Valorizamos sua privacidade 🍪</h4>
					<p class="text-sm font-light text-[#5A4F4A] leading-relaxed">
						Utilizamos cookies essenciais para assegurar o funcionamento correto e seguro da plataforma. Ao clicar em "Aceitar", você concorda com nossos 
						<a href="/terms" target="_blank" class="underline text-[#C5A880] hover:text-[#8C6D45] font-medium transition-colors">Termos de Uso</a> 
						e nossa 
						<a href="/privacy" target="_blank" class="underline text-[#C5A880] hover:text-[#8C6D45] font-medium transition-colors">Política de Privacidade</a>.
					</p>
				</div>
			</div>
			
			<div class="flex items-center justify-end gap-3 pt-3 border-t border-[#E8E2DD]">
				<button @click="declineCookies" class="text-xs font-semibold text-slate-400 hover:text-[#1E1A17] transition-colors px-2 py-2 cursor-pointer border-0 bg-transparent outline-none">
					Recusar
				</button>
				<Button size="sm" @click="acceptCookies" class="bg-[#1E1A17] hover:bg-[#2C2421] text-white rounded-full px-5 py-2.5 text-xs font-semibold shadow-md transition-all duration-200 cursor-pointer border-0">
					Aceitar e Continuar
				</Button>
			</div>
		</div>
	</Transition>
</template>
