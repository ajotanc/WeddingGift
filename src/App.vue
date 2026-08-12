<script setup lang="ts">
import { RouterView, useRoute } from "vue-router";

import Modal from "@/components/reusable/Modal.vue";
import { Button } from "@/components/ui/button";
import Confirm from "@/components/ui/confirm/Confirm.vue";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { useTenant } from "@/composables/useTenant";
import { EmailService } from "@/services/email.service";
import { useAuthStore } from "@/stores/auth";
import { toTypedSchema } from "@vee-validate/zod";
import { MessageSquarePlus, Pause, Play } from "lucide-vue-next";
import { useForm } from "vee-validate";
import { computed, ref, watch } from "vue";
import { toast } from "vue-sonner";
import * as z from "zod";
import CookieConsent from "./components/reusable/CookieConsent.vue";
import FormGroup from "./components/reusable/FormGroup.vue";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./components/ui/select";
import { useMusicStore } from "./stores/music";
import { PROJECT_NAME } from "./lib/defaults";

const authStore = useAuthStore();
const route = useRoute();
const music = useMusicStore();
const { tenant: currentTenant } = useTenant();

const isPageLoadingTheme = computed(() => {
	if (route.params.slug) {
		const activeTenant = currentTenant.value || authStore.tenant;
		return !activeTenant || activeTenant.slug !== route.params.slug;
	}
	return false;
});
const showFeedbackModal = ref(false);
const sending = ref(false);

const feedbackSchema = toTypedSchema(
	z.object({
		name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
		email: z.email("E-mail inválido"),
		type: z.enum(["Sugestão", "Dúvida", "Crítica"]),
		message: z.string().min(10, "Mensagem deve ter pelo menos 10 caracteres"),
	}),
);

const { handleSubmit, errors, setValues, defineField, resetForm } = useForm({
	validationSchema: feedbackSchema,
	initialValues: {
		name: "",
		email: "",
		type: "Sugestão",
		message: "",
	},
});

const [name] = defineField("name");
const [email] = defineField("email");
const [type] = defineField("type");
const [message] = defineField("message");

watch(
	() => authStore.user,
	(user) => {
		if (user) {
			setValues({
				name: user.name || "",
				email: user.email || "",
			});
		}
	},
	{ immediate: true },
);

watch(
	() => authStore.guest,
	(guest) => {
		if (guest) {
			setValues({
				name: guest.name || name.value || "",
				email: guest.email || email.value || "",
			});
		}
	},
	{ immediate: true },
);

const openFeedback = () => {
	resetForm({
		values: {
			name: authStore.user?.name || authStore.guest?.name || "",
			email: authStore.user?.email || authStore.guest?.email || "",
			type: "Sugestão",
			message: "",
		},
	});
	showFeedbackModal.value = true;
};

const onSubmitFeedback = handleSubmit(async (values) => {
	sending.value = true;
	try {
		await EmailService.sendFeedback({
			name: values.name,
			email: values.email,
			type: values.type,
			message: values.message,
		});
		toast.success("Feedback enviado com sucesso! Muito obrigado.");
		showFeedbackModal.value = false;
	} catch (error) {
		console.error(error);
		toast.error("Erro ao enviar o feedback. Tente novamente mais tarde.");
	} finally {
		sending.value = false;
	}
});
// Reativamente e de forma centralizada atualiza o título do documento
watch(
	[currentTenant, () => authStore.tenant, () => route.path],
	([t, authTenant, path]) => {
		// 1. Títulos estáticos definidos na rota
		if (route.meta?.title) {
			document.title = route.meta.title as string;
			return;
		}

		// 2. Títulos dinâmicos baseados nos dados do casamento (tenant)
		const activeTenant = t || authTenant;
		if (activeTenant) {
			if (path.includes("/gallery")) {
				document.title = `${PROJECT_NAME} • ${activeTenant.couple_name} • Galeria`;
			} else if (path.includes("/admin")) {
				document.title = `${PROJECT_NAME} • ${activeTenant.couple_name} • Painel`;
			} else {
				document.title = `${PROJECT_NAME} • ${activeTenant.couple_name}`;
			}
		} else {
			// Título fallback padrão
			document.title = PROJECT_NAME;
		}
	},
	{ immediate: true },
);
</script>

<template>
	<RouterView />
	<Confirm />
	<Toaster position="top-right" richColors />
	<CookieConsent />

	<!-- Monta uma vez, nunca desmonta -->
	<template v-if="music.isPremium && music.videoId">
		<iframe v-if="music.isPlaying"
			:src="`https://www.youtube-nocookie.com/embed/${music.videoId}?autoplay=1&loop=1&playlist=${music.videoId}&controls=0`"
			class="fixed w-0 h-0 opacity-0 pointer-events-none"
			allow="autoplay"
			frameborder="0">
		</iframe>

		<div class="fixed bottom-6 left-6 z-50 flex items-center gap-3">
			<button @click="music.toggle()"
				class="text-primary bg-white/80 backdrop-blur-md border border-slate-200/60 p-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 outline-none">
				<Pause v-if="music.isPlaying" class="w-5 h-5" />
				<Play v-else class="w-5 h-5" />
			</button>

			<div v-if="!music.isPlaying"
				class="bg-white/80 backdrop-blur-md border border-slate-200/60 px-3.5 py-2 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-xs font-light text-slate-500">
				Tocar música de fundo? 🎵
			</div>
		</div>
	</template>

	<!-- Global Floating Feedback Button -->
	<button v-if="!isPageLoadingTheme" type="button" @click="openFeedback"
		class="fixed bottom-6 right-6 z-50 text-primary bg-white/80 backdrop-blur-md border border-slate-200/60 p-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2 outline-none">
		<MessageSquarePlus class="w-5 h-5" />
	</button>

	<!-- Feedback Modal -->
	<Modal v-model:open="showFeedbackModal" title="Sugestões / Dúvidas / Críticas"
		description="Ajude-nos a melhorar a plataforma enviando o seu feedback.">
		<form @submit="onSubmitFeedback" class="space-y-4 pt-4">
			<FormGroup label="Seu Nome" :error="errors.name">
				<Input v-model="name" placeholder="Ex: João" class="rounded-xl border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary bg-slate-50/50 h-11 text-sm font-medium text-slate-900" />
			</FormGroup>
			<FormGroup label="Seu E-mail" :error="errors.email">
				<Input v-model="email" type="email" placeholder="joao@example.com"
					class="rounded-xl border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary bg-slate-50/50 h-11 text-sm font-medium text-slate-900" />
			</FormGroup>
			<FormGroup label="Tipo" :error="errors.type">
				<Select v-model="type">
					<SelectTrigger
						class="w-full bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary h-11 px-3 shadow-xs transition-all">
						<SelectValue placeholder="Selecione o tipo de feedback" />
					</SelectTrigger>
					<SelectContent class="rounded-xl bg-white border border-slate-200 shadow-lg">
						<SelectItem value="Sugestão" class="text-sm font-medium rounded-lg cursor-pointer">Sugestão</SelectItem>
						<SelectItem value="Dúvida" class="text-sm font-medium rounded-lg cursor-pointer">Dúvida</SelectItem>
						<SelectItem value="Crítica" class="text-sm font-medium rounded-lg cursor-pointer">Crítica</SelectItem>
					</SelectContent>
				</Select>
			</FormGroup>

			<FormGroup label="Mensagem" :error="errors.message">
				<Textarea v-model="message" placeholder="O que você gostaria de nos dizer?"
					class="rounded-xl border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary bg-slate-50/50 text-sm font-medium text-slate-900 min-h-[100px] resize-none" />
			</FormGroup>

			<div class="pt-2 flex justify-end gap-3">
				<Button type="button" variant="ghost" @click="showFeedbackModal = false" class="text-slate-600 hover:bg-slate-50 h-11 px-4">
					Cancelar
				</Button>
				<Button type="submit" :disabled="sending" class="bg-primary hover:brightness-105 text-white rounded-xl px-6 h-11 font-semibold border border-primary/30 shadow-sm transition-all flex items-center justify-center">
					{{ sending ? 'Enviando...' : 'Enviar Feedback' }}
				</Button>
			</div>
		</form>
	</Modal>
</template>
