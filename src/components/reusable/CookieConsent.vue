<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-vue-next";
import { onMounted, ref } from "vue";

const isVisible = ref(false);

onMounted(() => {
	const consent = localStorage.getItem("cookie-consent-accepted");
	if (!consent) {
		setTimeout(() => {
			isVisible.value = true;
		}, 1200);
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
		enter-from-class="transform translate-y-20 opacity-0"
		enter-to-class="transform translate-y-0 opacity-100"
		leave-active-class="transition duration-300 ease-in"
		leave-from-class="transform translate-y-0 opacity-100"
		leave-to-class="transform translate-y-20 opacity-0"
	>
		<div v-if="isVisible" class="fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100%-3rem)] p-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-slate-100 dark:border-slate-800 flex flex-col gap-3">
			<div class="flex items-start gap-3">
				<div class="p-2.5 bg-primary/10 rounded-2xl text-primary shrink-0">
					<ShieldCheck class="w-5 h-5" />
				</div>
				<div class="space-y-1">
					<h4 class="font-serif text-sm font-semibold text-slate-900 dark:text-white">Privacidade e Cookies 🔒</h4>
					<p class="text-xs font-light text-slate-500 leading-relaxed">
						Utilizamos cookies para assegurar o funcionamento da plataforma. Ao continuar navegando, você concorda com nossos 
						<a href="/termos" class="underline text-primary hover:text-primary/80 font-medium">Termos de Uso</a>.
					</p>
				</div>
			</div>
			
			<div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-50 dark:border-slate-800/50">
				<button @click="declineCookies" class="text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1.5 cursor-pointer border-0 bg-transparent outline-none">
					Recusar
				</button>
				<Button size="sm" @click="acceptCookies" class="rounded-xl px-3.5 py-1.5 text-xs font-medium border-0 outline-none">
					Aceitar
				</Button>
			</div>
		</div>
	</Transition>
</template>
