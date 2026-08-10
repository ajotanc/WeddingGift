<script setup lang="ts">
import FormGroup from "@/components/reusable/FormGroup.vue";
import { Button } from "@/components/ui/button";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
} from "@/components/ui/carousel";
import { useConfirm } from "@/components/ui/confirm/useConfirm";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useThankYouGenerator } from "@/composables/useThankYouGenerator";
import { ConsentService } from "@/services/consent.service";
import type { IGuest } from "@/services/guest.service";
import { type IMessage, MessageService } from "@/services/message.service";
import { type IRsvp, RsvpService } from "@/services/rsvp.service";
import type { ITenant } from "@/services/tenant.service";
import { type IUser, useAuthStore } from "@/stores/auth";
import { toTypedSchema } from "@vee-validate/zod";
import dayjs from "dayjs";
import Autoplay from "embla-carousel-autoplay";
import { useForm } from "vee-validate";
import { computed, ref, watch } from "vue";
import { toast } from "vue-sonner";
import * as z from "zod";

const props = defineProps<{
	tenant: ITenant | null;
	rsvps: IRsvp[];
	messages: IMessage[];
	currentUser: IUser;
}>();

const authStore = useAuthStore();
const { confirm } = useConfirm();
const { message: aiThanks, generateThankYou } = useThankYouGenerator();

const carouselPlugins = [
	Autoplay({
		delay: 4000,
		stopOnInteraction: false,
		stopOnMouseEnter: true,
	}),
];

// RSVP logic
const existingRsvp = computed(() => {
	if (!authStore.guest) return null;
	return props.rsvps.find((r) => {
		const guestId = typeof r.guest === "string" ? r.guest : r.guest?.$id;
		return guestId === authStore.guest?.$id;
	});
});

const rsvpLoading = ref(false);
const isEditingRsvp = ref(false);

const rsvpSchema = toTypedSchema(
	z.object({
		totalAdults: z
			.union([
				z.number(),
				z.string().transform((val) => (val === "" ? 0 : Number(val))),
			])
			.pipe(z.number().min(1, "No mínimo 1 adulto")),
		totalChildren: z
			.union([
				z.number(),
				z.string().transform((val) => (val === "" ? 0 : Number(val))),
			])
			.pipe(z.number().min(0, "No mínimo 0 crianças")),
		status: z.enum(["confirmed", "declined"]),
		acceptedTerms: z
			.boolean()
			.refine((val) => val === true, "Você deve aceitar os termos"),
		dietaryRestrictions: z.string().optional(),
	}),
);

const { handleSubmit, errors, defineField, resetForm } = useForm({
	validationSchema: rsvpSchema,
	initialValues: {
		totalAdults: 1,
		totalChildren: 0,
		status: "confirmed",
		acceptedTerms: false,
		dietaryRestrictions: "",
	},
});

const [totalAdults] = defineField("totalAdults");
const [totalChildren] = defineField("totalChildren");
const [status] = defineField("status");
const [acceptedTerms] = defineField("acceptedTerms");
const [dietaryRestrictions] = defineField("dietaryRestrictions");

const companionsList = ref<string[]>([]);

watch(totalAdults, (newAdults) => {
	const needed = Math.max(0, Number(newAdults || 0) - 1);
	if (companionsList.value.length < needed) {
		while (companionsList.value.length < needed) {
			companionsList.value.push("");
		}
	} else if (companionsList.value.length > needed) {
		companionsList.value = companionsList.value.slice(0, needed);
	}
});

// Whenever existingRsvp changes or editing starts, populate form
watch(
	[existingRsvp, isEditingRsvp],
	([rsvp]) => {
		if (rsvp) {
			resetForm({
				values: {
					totalAdults: rsvp.total_adults || 1,
					totalChildren: rsvp.total_children || 0,
					status: (rsvp.status as "confirmed" | "declined") || "confirmed",
					acceptedTerms: true,
					dietaryRestrictions: rsvp.dietary_restrictions || "",
				},
			});
			companionsList.value = rsvp.companions_names
				? [...rsvp.companions_names]
				: [];
		} else {
			resetForm({
				values: {
					totalAdults: 1,
					totalChildren: 0,
					status: "confirmed",
					acceptedTerms: false,
					dietaryRestrictions: "",
				},
			});
			companionsList.value = [];
		}
	},
	{ immediate: true },
);

const submitRsvp = handleSubmit(async (values) => {
	if (!props.tenant || !authStore.guest) return;
	rsvpLoading.value = true;
	try {
		let thankYouMessage = "";
		if (values.status === "confirmed") {
			await generateThankYou({
				guestName: authStore.guest.name || "Convidado",
				coupleName: props.tenant.couple_name,
			});
			thankYouMessage = aiThanks.value;
		}

		const payload = {
			tenant: props.tenant.$id,
			total_adults: values.status === "confirmed" ? values.totalAdults : 0,
			total_children: values.status === "confirmed" ? values.totalChildren : 0,
			status: values.status,
			guest: authStore.guest as IGuest,
			message: thankYouMessage,
			dietary_restrictions:
				values.status === "confirmed" ? values.dietaryRestrictions || "" : "",
			companions_names:
				values.status === "confirmed"
					? companionsList.value.filter((name) => name && name.trim() !== "")
					: [],
		};

		if (existingRsvp.value) {
			await RsvpService.update(existingRsvp.value.$id, payload);
			Object.assign(existingRsvp.value, payload);
		} else {
			const created = await RsvpService.create(payload);
			props.rsvps.push(created);
		}

		// Log RSVP consent in immutable collection
		if (authStore.guest) {
			await ConsentService.log({
				user_id: authStore.guest.$id,
				email: authStore.guest.email,
				accepted_terms: true,
				accepted_terms_at: dayjs().toISOString(),
			});
		}

		isEditingRsvp.value = false;
		toast.success("Sucesso", {
			description: "Sua resposta foi enviada com sucesso! Obrigado.",
		});
	} catch (err) {
		toast.error("Erro", {
			description: "Houve um erro ao enviar sua resposta. Tente novamente.",
		});
	} finally {
		rsvpLoading.value = false;
	}
});

// Messages wall logic
const messageContent = ref("");

const submitMessage = async () => {
	if (!props.tenant || !messageContent.value.trim() || !props.currentUser)
		return;

	try {
		const newMsg = await MessageService.create({
			tenant: props.tenant.$id,
			content: messageContent.value,
			guest: authStore.guest as IGuest,
		});

		props.messages.unshift(newMsg);
		messageContent.value = "";
		toast.success("Sua mensagem foi enviada!");
	} catch (err) {
		toast.error("Erro ao enviar mensagem.");
	}
};

const deleteMessage = (msgId: string) => {
	confirm({
		title: "Apagar Mensagem",
		description: "Tem certeza de que deseja apagar esta mensagem do mural?",
		confirmText: "Sim, apagar",
		cancelText: "Não",
		confirm: async () => {
			try {
				await MessageService.delete(msgId);
				const index = props.messages.findIndex((m) => m.$id === msgId);
				if (index !== -1) {
					props.messages.splice(index, 1);
				}
				toast.success("Mensagem apagada com sucesso.");
			} catch (err) {
				toast.error("Erro ao apagar mensagem.");
			}
		},
	});
};

const toggleLike = async (msg: IMessage) => {
	const guestId = authStore.guest?.$id;
	if (!guestId) return;

	const originalLikes = [...(msg.likes || [])];
	const isLiked = msg.likes?.includes(guestId);

	if (isLiked) {
		msg.likes = msg.likes?.filter((id) => id !== guestId);
	} else {
		msg.likes = [...(msg.likes || []), guestId];
	}

	try {
		msg.likes?.length && (await MessageService.likes(msg.$id, msg.likes));
	} catch (err) {
		msg.likes = originalLikes;
		toast.error("Falha ao curtir.");
	}
};
</script>

<template>
	<!-- RSVP & Message Wall (Perfectly aligned columns) -->
	<section class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

		<!-- RSVP Column -->
		<div id="rsvp" class="lg:col-span-7 space-y-8 scroll-mt-16">
			<!-- Column Header -->
			<div class="border-b border-slate-200/60 pb-6 text-left">
				<span class="text-[10px] font-bold tracking-[0.25em] uppercase text-primary">Confirmação</span>
				<h2 class="text-3xl font-serif text-slate-900 mt-1 font-semibold">Presença no Evento</h2>
				<p class="text-slate-600 font-light leading-relaxed mt-2 text-sm">
					Ficaremos imensamente felizes em celebrar esse momento único com você. Por favor, confirme suas informações
					abaixo.
				</p>
			</div>

			<!-- Form Container -->
			<div class="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.015)]">
				<!-- Already Submitted State -->
				<div v-if="existingRsvp && !isEditingRsvp" class="text-center py-4">
					<div
						class="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h3 class="text-2xl font-serif text-slate-900 mb-2 font-semibold">
						{{ existingRsvp.status === 'confirmed' ? 'Presença Confirmada!' : 'Não Poderá Ir' }}
					</h3>
					<p class="text-slate-600 font-light text-sm mb-6 max-w-md mx-auto">
						{{ existingRsvp.status === 'confirmed'
							? `Obrigado por confirmar! Contamos com ${existingRsvp.total_adults} adulto(s)${existingRsvp.total_children
								>
								0 ? ` e ${existingRsvp.total_children} criança(s)` : ''}.`
							: 'Sentiremos sua falta!' }}
					</p>
					<div
						v-if="existingRsvp.status === 'confirmed' && (existingRsvp.companions_names?.length || existingRsvp.dietary_restrictions)"
						class="text-xs text-slate-600 mb-6 space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left">
						<p v-if="existingRsvp.companions_names && existingRsvp.companions_names.length > 0" class="flex gap-2">
							<strong class="text-slate-900">Acompanhantes:</strong>
							<span>{{ existingRsvp.companions_names.join(', ') }}</span>
						</p>
						<p v-if="existingRsvp.dietary_restrictions" class="flex gap-2">
							<strong class="text-slate-900">Restrições Alimentares:</strong>
							<span>{{ existingRsvp.dietary_restrictions }}</span>
						</p>
					</div>
					<div v-if="existingRsvp.message"
						class="relative max-w-md mx-auto my-6 p-5 bg-slate-50/80 rounded-2xl border border-slate-200 italic font-serif text-slate-600 text-sm">
						"{{ existingRsvp.message }}"
						<span class="block text-[8px] font-sans font-bold uppercase tracking-widest text-slate-400 mt-3 not-italic">
							✨ Agradecimento Especial da IA
						</span>
					</div>

					<Button variant="outline" class="rounded-full px-8 border-primary text-primary hover:bg-primary/10"
						@click="isEditingRsvp = true">
						Alterar Resposta
					</Button>
				</div>

				<!-- Free Plan Limit State -->
				<div v-else-if="!tenant?.is_premium && rsvps.length >= 20 && !existingRsvp" class="text-center py-6">
					<div
						class="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 text-primary">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
								d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
					</div>
					<h3 class="text-lg font-serif text-amber-900 mb-2">Confirmações Suspensas</h3>
					<p class="text-sm text-amber-700 font-light leading-relaxed mb-4">
						Este casamento atingiu o limite de confirmações de presença permitidos no plano gratuito.
					</p>
					<p class="text-xs font-semibold text-primary">
						Se você é o proprietário, faça o upgrade para o plano Premium no painel de controle.
					</p>
				</div>

				<!-- Active Form -->
				<form v-else @submit.prevent="submitRsvp" class="space-y-6 text-left">
					<div class="space-y-5">
						<!-- Adults/Children Grid -->
						<div v-if="status === 'confirmed'" class="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
							<FormGroup label="Adultos" :error="errors.totalAdults">
								<Input v-model.number="totalAdults" type="number" min="1"
									class="rounded-xl border-slate-200 shadow-sm focus-visible:ring-0 focus-visible:border-slate-400 bg-slate-50/50 h-11 text-sm text-slate-900 font-medium" />
							</FormGroup>
							<FormGroup label="Crianças" :error="errors.totalChildren">
								<Input v-model.number="totalChildren" type="number" min="0"
									class="rounded-xl border-slate-200 shadow-sm focus-visible:ring-0 focus-visible:border-slate-400 bg-slate-50/50 h-11 text-sm text-slate-900 font-medium" />
							</FormGroup>
						</div>

						<!-- Attendance select -->
						<FormGroup label="Você irá ao evento?">
							<Select v-model="status">
								<SelectTrigger
									class="w-full h-11 px-4 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-light text-slate-600 focus:ring-0 focus:border-slate-400 text-left">
									<SelectValue placeholder="Você irá ao evento?" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="confirmed" class="text-sm">Sim, estarei lá!</SelectItem>
									<SelectItem value="declined" class="text-sm">Não poderei ir</SelectItem>
								</SelectContent>
							</Select>
						</FormGroup>

						<!-- Companions list -->
						<div v-if="status === 'confirmed' && Number(totalAdults || 0) > 1" class="space-y-3">
							<FormGroup label="Nomes dos Acompanhantes">
								<div class="space-y-2">
									<div v-for="(_companion, idx) in companionsList" :key="idx" class="flex items-center gap-2">
										<Input v-model="companionsList[idx]" :placeholder="`Nome do acompanhante ${idx + 1}`"
											class="rounded-xl border-slate-200 shadow-sm focus-visible:ring-0 focus-visible:border-slate-400 bg-slate-50/50 h-11 text-sm text-slate-900" />
									</div>
								</div>
							</FormGroup>
						</div>

						<!-- Dietary restrictions -->
						<FormGroup v-if="status === 'confirmed'" label="Restrições Alimentares" :error="errors.dietaryRestrictions">
							<Input v-model="dietaryRestrictions" placeholder="Ex: Vegano, intolerante a glúten, alergias..."
								class="rounded-xl border-slate-200 shadow-sm focus-visible:ring-0 focus-visible:border-slate-400 bg-slate-50/50 h-11 text-sm text-slate-900" />
						</FormGroup>
					</div>

					<!-- LGPD check -->
					<div class="space-y-1 pt-2">
						<div class="flex items-start gap-3 py-1">
							<input type="checkbox" id="accept-rsvp-terms" v-model="acceptedTerms"
								class="w-4 h-4 mt-0.5 rounded border-slate-300 cursor-pointer accent-primary" required />
							<label for="accept-rsvp-terms"
								class="text-[10px] text-slate-500 font-light leading-relaxed cursor-pointer select-none">
								Autorizo o tratamento de meus dados em conformidade com os <a href="/terms" target="_blank"
									class="underline font-semibold text-primary">Termos de
									Uso</a> e <a href="/privacy" target="_blank" class="underline font-semibold text-primary">Política de
									Privacidade</a> (LGPD).
							</label>
						</div>
						<p v-if="errors.acceptedTerms" class="text-xs text-red-500 mt-1 font-medium">{{ errors.acceptedTerms }}</p>
					</div>

					<!-- Form actions -->
					<div class="flex flex-col gap-2 pt-2">
						<Button type="submit"
							class="w-full h-11 text-white hover:brightness-105 active:scale-[0.98] transition-all rounded-xl font-semibold uppercase tracking-wider text-xs shadow-sm bg-primary border-primary"
							:disabled="rsvpLoading">
							{{ rsvpLoading ? 'Enviando...' : 'Confirmar Resposta' }}
						</Button>
						<Button v-if="isEditingRsvp" type="button" variant="ghost" @click="isEditingRsvp = false"
							class="w-full h-11 text-slate-400 hover:text-slate-600 rounded-xl text-xs font-semibold uppercase tracking-wider">
							Cancelar Edição
						</Button>
					</div>
				</form>
			</div>
		</div>

		<!-- Message Wall Column -->
		<div id="messages" class="lg:col-span-5 space-y-8 scroll-mt-16">
			<!-- Column Header -->
			<div class="border-b border-slate-200/60 pb-6 text-left">
				<span class="text-[10px] font-bold tracking-[0.25em] uppercase text-primary">Afeto</span>
				<h2 class="text-3xl font-serif text-slate-900 mt-1 font-semibold">Mural de Recados</h2>
				<p class="text-slate-600 font-light leading-relaxed mt-2 text-sm">
					Escreva e compartilhe votos sinceros de felicidade, carinho e amor eterno para os noivos.
				</p>
			</div>

			<!-- Submitting message card -->
			<div
				class="bg-white border border-slate-200 p-6 rounded-[2rem] shadow-[0_12px_40px_rgba(0,0,0,0.015)] flex flex-col gap-4">

				<!-- Sender header info -->
				<div class="flex items-center gap-3">
					<img v-if="authStore.guest?.photo_url || authStore.user?.prefs?.photo_url"
						:src="authStore.guest?.photo_url || authStore.user?.prefs?.photo_url" alt="Foto"
						referrerpolicy="no-referrer"
						class="w-10 h-10 rounded-full border border-slate-200 shadow-sm object-cover" />
					<div v-else
						class="w-10 h-10 rounded-full flex items-center justify-center font-serif text-sm font-semibold select-none bg-primary/10 border border-primary/20 text-primary">
						{{ (authStore.guest?.name || authStore.user?.name || 'C').charAt(0).toUpperCase() }}
					</div>
					<div class="flex flex-col text-left">
						<span class="text-[9px] uppercase tracking-widest font-bold text-slate-400">Escrevendo como</span>
						<strong class="text-sm font-serif font-bold text-slate-900 mt-0.5">{{ authStore.guest?.name ||
							authStore.user?.name }}</strong>
					</div>
				</div>

				<!-- Content input -->
				<Textarea v-model="messageContent"
					class="w-full h-28 rounded-2xl bg-slate-50/50 border border-slate-200 focus-visible:ring-0 focus-visible:border-slate-400 placeholder:text-slate-400 text-sm font-light p-4 resize-none leading-relaxed text-slate-900"
					placeholder="Escreva uma mensagem de carinho para os noivos..." />

				<!-- Submit button (styled with wedding primary_color) -->
				<Button @click="submitMessage" :disabled="!messageContent.trim()"
					class="w-full h-11 rounded-xl text-xs font-semibold uppercase tracking-wider text-white transition-all duration-300 shadow-sm hover:brightness-105 active:scale-[0.98] bg-primary border-primary disabled:opacity-60 disabled:cursor-not-allowed">
					Publicar Recado
				</Button>
			</div>

			<!-- Sent Messages Carousel -->
			<Carousel v-if="messages.length > 0" class="w-full relative cursor-grab active:cursor-grabbing"
				:opts="{ align: 'center', dragFree: true, loop: true }" :plugins="carouselPlugins">
				<CarouselContent>
					<CarouselItem v-for="(msg, index) in messages" :key="msg.$id" class="basis-full select-none">
						<div
							class="w-full p-6 rounded-[1.5rem] relative overflow-hidden group transition-all duration-300 flex flex-col gap-4 border"
							:class="index % 2 === 0 ? 'bg-white border-slate-200' : 'bg-primary border-transparent text-white'">

							<!-- Quote Icon & Likes Header -->
							<div class="flex items-center justify-between z-10">
								<svg class="w-6 h-6 fill-current shrink-0" viewBox="0 0 24 24"
									:class="index % 2 === 0 ? 'text-primary/30' : 'text-white/40'">
									<path
										d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
								</svg>

								<div class="flex items-center gap-1">
									<Button variant="ghost" @click="toggleLike(msg)"
										class="!p-1 h-auto transition-all duration-300 hover:scale-110 active:scale-95"
										:class="index % 2 === 0 ? 'text-primary' : 'text-white'">
										<svg class="w-4 h-4 transition-all duration-300"
											:fill="msg.likes?.includes(authStore.guest?.$id || '') ? 'currentColor' : 'none'"
											stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
												d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
										</svg>
									</Button>
									<span class="text-xs font-semibold font-sans tabular-nums"
										:class="index % 2 === 0 ? 'text-slate-400' : 'text-white/80'">
										{{ msg.likes?.length || 0 }}
									</span>
								</div>
							</div>

							<!-- Message Content -->
							<p class="font-serif italic leading-relaxed text-sm whitespace-pre-wrap break-words z-10"
								:class="index % 2 === 0 ? 'text-slate-600' : 'text-white/90'">
								"{{ msg.content }}"
							</p>

							<!-- Sender Info footer -->
							<div class="flex items-center gap-3 pt-3 border-t mt-1 z-10"
								:class="index % 2 === 0 ? 'border-slate-200/50' : 'border-white/20'">
								<img
									v-if="msg.guest?.photo_url || (authStore.guest?.$id === msg.guest?.$id && authStore.user?.prefs?.photo_url)"
									:src="msg.guest?.photo_url || authStore.user?.prefs?.photo_url" referrerpolicy="no-referrer"
									class="w-8 h-8 shrink-0 rounded-full border shadow-xs object-cover"
									:class="index % 2 === 0 ? 'border-slate-200' : 'border-white/20'" />
								<div v-else
									class="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-serif font-bold"
									:class="index % 2 === 0 ? 'bg-primary/15 border border-primary/20 text-primary' : 'bg-white/15 border border-white/25 text-white'">
									{{ msg.guest.name?.charAt(0).toUpperCase() }}
								</div>
								<div class="flex flex-col text-left min-w-0">
									<p class="text-xs font-serif font-bold truncate leading-none"
										:class="index % 2 === 0 ? 'text-slate-900' : 'text-white'">{{ msg.guest.name }}</p>
									<p class="text-[9px] font-sans font-light mt-1 truncate"
										:class="index % 2 === 0 ? 'text-slate-400' : 'text-white/70'">{{
											dayjs(msg.$createdAt).format('DD/MM/YYYY') }}</p>
								</div>

								<!-- Delete button (admin / author) -->
								<Button variant="ghost" v-if="currentUser && (currentUser.$id === msg.guest.$id)"
									@click="deleteMessage(msg.$id)" class="!p-1 h-auto ml-auto"
									:class="index % 2 === 0 ? 'text-slate-300 hover:text-red-500' : 'text-white/40 hover:text-white'">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
									</svg>
								</Button>
							</div>
						</div>
					</CarouselItem>
				</CarouselContent>
			</Carousel>
		</div>
	</section>
</template>
