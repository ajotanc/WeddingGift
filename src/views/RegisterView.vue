<script setup lang="ts">
import FormGroup from "@/components/reusable/FormGroup.vue";
import GoogleAuthButton from "@/components/ui/GoogleAuthButton.vue";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { DEFAULT_PRIMARY_COLOR } from "@/lib/defaults";
import { useAuthStore } from "@/stores/auth";
import dayjs from "dayjs";
import { onMounted, ref } from "vue";
import { toast } from "vue-sonner";

const authStore = useAuthStore();
const loading = ref(false);

const hostName = ref<string | null>(null);

const form = ref({
	groom_name: "",
	bride_name: "",
	slug: "",
	pix_key: "",
	primary_color: DEFAULT_PRIMARY_COLOR,
	acceptedTerms: false,
	confirmedAge: false,
});

onMounted(() => {
	hostName.value = window.location.host; // Correto
});

const generateSlug = () => {
	if (form.value.groom_name && form.value.bride_name && !form.value.slug) {
		form.value.slug = `${form.value.groom_name}-${form.value.bride_name}`
			.toLowerCase()
			.normalize("NFD")
			// biome-ignore lint/suspicious/noMisleadingCharacterClass: standard diacritics stripping after NFD normalization
			.replace(/[\u0300-\u036f]/g, "")
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/(^-|-$)+/g, "");
	}
};

const registerTenant = async () => {
	if (!form.value.acceptedTerms || !form.value.confirmedAge) {
		toast.error("Erro", {
			description:
				"Você deve aceitar os termos e confirmar ter 18 anos ou mais para continuar.",
		});
		return;
	}
	loading.value = true;
	try {
		const coupleName = `${form.value.bride_name} & ${form.value.groom_name}`;

		localStorage.setItem(
			"pending_tenant",
			JSON.stringify({
				slug: form.value.slug,
				couple_name: coupleName,
				groom_name: form.value.groom_name,
				bride_name: form.value.bride_name,
				pix_key: form.value.pix_key,
				plan: "free",
				show_countdown: true,
				primary_color: form.value.primary_color,
				background_color: "#ffffff",
				background_image: null,
				accepted_terms: true,
				accepted_terms_at: dayjs().toISOString(),
				confirmed_age: true,
				confirmed_age_at: dayjs().toISOString(),
			}),
		);

		// Redirect to OAuth
		await authStore.loginWithGoogle(
			`${window.location.origin}/`,
			`${window.location.origin}/register?error=1`,
		);
	} catch (error) {
		console.error("Registration error", error);
		toast.error("Erro", {
			description: "Erro ao iniciar registro.",
		});
		loading.value = false;
	}
};
</script>

<template>
	<main class="min-h-screen bg-slate-50 py-20 px-4 font-sans text-slate-600">
		<div class="max-w-md mx-auto">
			<div class="text-center mb-8">
				<h1 class="text-3xl font-bold text-slate-900 font-serif">Crie sua Lista de Casamento</h1>
				<p class="text-slate-500 mt-2 text-sm">Tudo em um só lugar. Rápido, lindo e seguro.</p>
			</div>

			<Card class="p-8 border border-slate-100 shadow-xl shadow-slate-200/50 rounded-2xl bg-white">
				<form @submit.prevent="registerTenant" class="space-y-5">
					<div class="grid grid-cols-2 gap-4">
						<FormGroup label="Nome do Noivo">
							<Input v-model="form.groom_name" required placeholder="Ex: João" @blur="generateSlug"
								class="bg-slate-50/50" />
						</FormGroup>
						<FormGroup label="Nome da Noiva">
							<Input v-model="form.bride_name" required placeholder="Ex: Maria" @blur="generateSlug"
								class="bg-slate-50/50" />
						</FormGroup>
					</div>

					<FormGroup label="Link Personalizado">
						<InputGroup class="border-slate-200">
							<InputGroupAddon align="inline-start">
								<span class="text-slate-500 font-medium text-sm">https://{{ hostName }}/</span>
							</InputGroupAddon>
							<InputGroupInput v-model="form.slug" required placeholder="joao-e-maria"
								class="bg-transparent focus:outline-none text-slate-700" />
						</InputGroup>
					</FormGroup>

					<FormGroup label="Sua Chave PIX">
						<Input v-model="form.pix_key" required placeholder="Para receber as cotas direto na conta"
							class="bg-slate-50/50" />
						<div class="mt-2 p-2.5 bg-amber-50/30 border border-amber-100/50 rounded-xl">
							<p class="text-[10px] text-amber-700 font-light leading-relaxed">
								🔒 <strong>Segurança e LGPD:</strong> Para sua privacidade, recomendamos utilizar uma <strong>chave aleatória (EVP)</strong>. Evite usar dados pessoais como CPF, e-mail ou telefone, pois esta chave ficará visível publicamente na sua lista de presentes.
							</p>
						</div>
						<p class="text-[10px] text-slate-400 mt-1 font-light">Nós não cobramos taxas sobre os presentes em dinheiro.
						</p>
					</FormGroup>

					<FormGroup label="Cor do Casamento">
						<div class="flex items-center gap-3">
							<div class="relative w-9 h-9 rounded-xl border border-slate-200 overflow-hidden cursor-pointer shadow-sm">
								<input type="color" v-model="form.primary_color"
									class="absolute inset-0 w-full h-full scale-150 cursor-pointer p-0 border-0 bg-transparent" />
							</div>
							<span class="text-sm font-mono text-slate-600">{{ form.primary_color }}</span>
						</div>
					</FormGroup>

					<div class="space-y-3 py-2">
						<div class="flex items-start gap-2.5">
							<input type="checkbox" id="accept-terms" v-model="form.acceptedTerms"
								class="w-4 h-4 mt-0.5 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
								required />
							<label for="accept-terms"
								class="text-xs text-slate-500 font-light leading-relaxed cursor-pointer select-none">
								Li e concordo com os <a href="/terms" target="_blank" class="underline text-primary font-medium">Termos
									de Uso</a> e a <a href="/privacy" target="_blank"
									class="underline text-primary font-medium">Política de Privacidade</a>, e autorizo o tratamento de meus
								dados em conformidade com a LGPD.
							</label>
						</div>

						<div class="flex items-start gap-2.5">
							<input type="checkbox" id="confirm-age" v-model="form.confirmedAge"
								class="w-4 h-4 mt-0.5 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer"
								required />
							<label for="confirm-age"
								class="text-xs text-slate-500 font-light leading-relaxed cursor-pointer select-none">
								Declaro e confirmo que tenho <strong>18 anos ou mais</strong> de idade.
							</label>
						</div>
					</div>

					<GoogleAuthButton type="submit" :label="loading ? 'Criando Conta...' : 'Continuar com Google'"
						:disabled="loading"
						class="w-full flex items-center justify-center py-2.5 h-11 text-sm font-semibold rounded-xl cursor-pointer" />
				</form>
			</Card>
		</div>
	</main>
</template>
