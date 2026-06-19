<script setup lang="ts">
import FormGroup from "@/components/reusable/FormGroup.vue";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Input } from "@/components/ui/input";
import { useConfirm } from "@/components/ui/confirm/useConfirm";
import { Textarea } from "@/components/ui/textarea";
import { generateThankYouMessage } from "@/lib/ai";
import { ConsentService } from "@/services/consent.service";
import type { IGuest } from "@/services/guest.service";
import { type IMessage, MessageService } from "@/services/message.service";
import { type IRsvp, RsvpService } from "@/services/rsvp.service";
import { useAuthStore, type IUser } from "@/stores/auth";
import { toTypedSchema } from "@vee-validate/zod";
import dayjs from "dayjs";
import Autoplay from "embla-carousel-autoplay";
import { useForm } from "vee-validate";
import { toast } from "vue-sonner";
import { computed, ref, watch } from "vue";
import * as z from "zod";
import type { ITenant } from "@/services/tenant.service";

const props = defineProps<{
	tenant: ITenant | null;
	rsvps: IRsvp[];
	messages: IMessage[];
	currentUser: IUser;
}>();

const authStore = useAuthStore();
const { confirm } = useConfirm();

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
		totalAdults: z.number().min(1, "No mínimo 1 adulto"),
		totalChildren: z.number().min(0),
		status: z.enum(["confirmed", "declined"]),
		acceptedTerms: z
			.boolean()
			.refine((val) => val === true, "Você deve aceitar os termos"),
	}),
);

const { handleSubmit, errors, defineField, resetForm } = useForm({
	validationSchema: rsvpSchema,
	initialValues: {
		totalAdults: 1,
		totalChildren: 0,
		status: "confirmed",
		acceptedTerms: false,
	},
});

const [totalAdults] = defineField("totalAdults");
const [totalChildren] = defineField("totalChildren");
const [status] = defineField("status");
const [acceptedTerms] = defineField("acceptedTerms");

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
				},
			});
		} else {
			resetForm({
				values: {
					totalAdults: 1,
					totalChildren: 0,
					status: "confirmed",
					acceptedTerms: false,
				},
			});
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
			thankYouMessage = await generateThankYouMessage(
				authStore.guest.name || "Convidado",
				props.tenant.couple_name,
			);
		}

		const payload = {
			tenant: props.tenant.$id,
			total_adults: values.totalAdults,
			total_children: values.totalChildren,
			status: values.status,
			guest: authStore.guest as IGuest,
			message: thankYouMessage,
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
	<!-- RSVP & Message Wall (2-column grid) -->
	<section class="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20">

		<!-- RSVP Column -->
		<div id="rsvp" class="lg:col-span-7 space-y-10 scroll-mt-10">
			<div class="mb-6">
				<h2 class="text-3xl font-serif text-slate-900 mb-4 tracking-tight">Confirme sua Presença</h2>
				<p class="text-slate-500 font-light leading-relaxed">Ficaremos imensamente felizes em celebrar esse
					momento único com você. Por favor, confirme abaixo.</p>
			</div>

			<!-- Formulário ou Confirmação -->
			<div v-if="existingRsvp && !isEditingRsvp"
				class="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80 text-center">
				<div
					class="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
					<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				</div>
				<h3 class="text-2xl font-serif text-slate-900 mb-2">
					{{ existingRsvp.status === 'confirmed' ? 'Presença Confirmada!' : 'Não Poderá Ir' }}
				</h3>
				<p class="text-slate-500 font-light mb-6">
					{{ existingRsvp.status === 'confirmed'
						? `Obrigado por confirmar! Contamos com ${existingRsvp.total_adults} adulto(s)${existingRsvp.total_children > 0 ? ` e ${existingRsvp.total_children} criança(s)` : ''}.`
						: 'Sentiremos sua falta!' }}
				</p>
				<p v-if="existingRsvp.message"
					class="italic text-slate-600 font-serif mb-8 p-4 bg-slate-50/50 rounded-xl">
					"{{ existingRsvp.message }}"
				</p>
				<Button variant="outline" @click="isEditingRsvp = true">
					Alterar Resposta
				</Button>
			</div>

			<div v-else-if="!authStore.isPremium && rsvps.length >= 20 && !existingRsvp"
				class="bg-amber-50/70 p-8 rounded-3xl border border-amber-100 text-center shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
				<div
					class="w-12 h-12 bg-amber-100/80 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
							d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
					</svg>
				</div>
				<h3 class="text-lg font-serif text-amber-900 mb-2">Confirmações Suspensas</h3>
				<p class="text-sm text-amber-700 font-light leading-relaxed mb-1">
					Este casamento atingiu o limite de confirmações de presença permitidos no plano gratuito.
				</p>
				<p class="text-xs text-amber-600 font-light">
					Se você é o proprietário, faça o upgrade para o plano Premium no painel de controle.
				</p>
			</div>

			<form v-else @submit.prevent="submitRsvp"
				class="space-y-6 bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80">
				<div class="space-y-5">
					<div class="grid grid-cols-2 gap-5">
						<FormGroup label="Adultos" :error="errors.totalAdults">
							<Input v-model.number="totalAdults" type="number" min="1"
								class="rounded-xl border-slate-200 shadow-sm focus-visible:ring-primary/20 bg-slate-50/50 h-12" />
						</FormGroup>
						<FormGroup label="Crianças" :error="errors.totalChildren">
							<Input v-model.number="totalChildren" type="number" min="0"
								class="rounded-xl border-slate-200 shadow-sm focus-visible:ring-primary/20 bg-slate-50/50 h-12" />
						</FormGroup>
					</div>
					<FormGroup label="Você irá ao evento?">
						<div class="relative w-full">
							<select v-model="status"
								class="w-full h-12 px-4 bg-slate-50/50 border border-slate-200 rounded-xl text-base font-light text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
								<option value="confirmed">Sim, estarei lá!</option>
								<option value="declined">Não poderei ir</option>
							</select>

							<div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
								</svg>
							</div>
						</div>
					</FormGroup>
				</div>
				
				<div class="space-y-1">
					<div class="flex items-start gap-2.5 py-1">
						<input type="checkbox" id="accept-rsvp-terms" v-model="acceptedTerms" class="w-4 h-4 mt-0.5 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer" required />
						<label for="accept-rsvp-terms" class="text-xs text-slate-500 font-light leading-relaxed cursor-pointer select-none">
							Autorizo o tratamento de meus dados em conformidade com os <a href="/termos" target="_blank" class="underline text-primary font-medium">Termos de Uso</a> e <a href="/privacidade" target="_blank" class="underline text-primary font-medium">Política de Privacidade</a> (LGPD).
						</label>
					</div>
					<p v-if="errors.acceptedTerms" class="text-xs text-red-500 mt-1">{{ errors.acceptedTerms }}</p>
				</div>

				<Button type="submit" class="w-full" :disabled="rsvpLoading">
					{{ rsvpLoading ? 'Enviando...' : 'Confirmar Presença' }}
				</Button>
				<Button v-if="isEditingRsvp" type="button" variant="ghost" @click="isEditingRsvp = false"
					class="w-full mt-2 text-slate-500">
					Cancelar Edição
				</Button>
			</form>
		</div>

		<!-- Message Wall Column -->
		<div id="messages" class="lg:col-span-5 space-y-10 scroll-mt-10">
			<div class="mb-6">
				<h2 class="text-3xl font-serif text-slate-900 mb-4 tracking-tight">Mural de Recados</h2>
				<p class="text-slate-500 font-light leading-relaxed">Deixe uma mensagem carinhosa para os noivos.</p>
			</div>

			<div
				class="bg-white p-6 rounded-3xl border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] mb-10 transition-shadow duration-300 hover:shadow-md flex flex-col gap-4">

				<!-- Convidado em cima -->
				<div class="flex items-center gap-3">
					<img v-if="authStore.guest?.photo_url" :src="authStore.guest.photo_url" alt="Foto"
						referrerpolicy="no-referrer" class="w-10 h-10 rounded-full border border-slate-100 shadow-sm" />
					<div v-else
						class="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center font-bold">
						{{ authStore.guest?.name?.charAt(0).toUpperCase() || 'C' }}
					</div>
					<div class="flex flex-col text-left">
						<span class="text-xs text-slate-400 font-light">Escrevendo como</span>
						<strong class="text-sm font-semibold text-slate-700 leading-none mt-1">{{ authStore.guest?.name }}</strong>
					</div>
				</div>

				<!-- Textarea embaixo -->
				<Textarea v-model="messageContent"
					class="w-full h-32 rounded-2xl bg-slate-50/50 border-slate-200 focus-visible:ring-primary/20 placeholder:text-slate-400 text-base font-light p-4 resize-none"
					placeholder="Escreva uma mensagem de carinho para os noivos..." />

				<!-- Botão embaixo -->
				<Button @click="submitMessage" :disabled="!messageContent.trim()" class="w-full h-12 rounded-xl">
					Publicar Recado
				</Button>
			</div>

			<!-- Messages Carousel -->
			<Carousel v-if="messages.length > 0" class="w-full relative cursor-grab active:cursor-grabbing pb-10"
				:opts="{ align: 'center', dragFree: true, loop: true }" :plugins="carouselPlugins">
				<CarouselContent class="py-2">
					<CarouselItem v-for="(msg, index) in messages" :key="msg.$id"
						class="basis-full md:basis-[672px] min-w-0 max-w-full select-none">
						<div
							class="h-full w-full max-w-full p-6 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col gap-6"
							:class="index % 2 === 0 ? 'bg-white border border-slate-100/80' : 'bg-primary border border-transparent'">

							<div class="flex items-center justify-between z-10 w-full max-w-full min-w-0"
								:class="index % 2 === 0 ? 'border-slate-50' : 'border-white/20'">
								<!-- Quote icon -->
								<svg class="w-8 h-8 shrink-0" :class="index % 2 === 0 ? 'text-primary/20' : 'text-white/20'"
									fill="currentColor" viewBox="0 0 24 24">
									<path
										d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
								</svg>

								<!-- Likes -->
								<div class="flex items-center justify-center">
									<Button variant="ghost" @click="toggleLike(msg)"
										class="!p-2 h-auto transition-all duration-300 hover:scale-125 active:scale-90" :class="[
											index % 2 === 0
												? 'text-slate-300 hover:text-red-500'
												: 'text-white/50 hover:text-white',
											msg.likes?.includes(authStore.guest?.$id || '') ? 'text-red-500 scale-100' : ''
										]">
										<svg class="w-6 h-6 transition-all duration-300"
											:fill="msg.likes?.includes(authStore.guest?.$id || '') ? 'currentColor' : 'none'"
											stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
												d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
										</svg>
									</Button>

									<span class="text-sm font-medium tabular-nums"
										:class="index % 2 === 0 ? 'text-slate-500' : 'text-white/80'">
										{{ msg.likes?.length || 0 }}
									</span>
								</div>
							</div>

							<p class="reveal-text font-serif italic leading-relaxed text-lg z-10 whitespace-pre-wrap break-words w-full min-w-0 max-w-full"
								:class="index % 2 === 0 ? 'text-slate-600' : 'text-white/90'">{{ msg.content }}</p>

							<div class="flex items-center gap-4 w-full pt-6 border-t mt-auto"
								:class="index % 2 === 0 ? 'border-slate-50' : 'border-white/20'">
								<img v-if="msg.guest.photo_url" :src="msg.guest.photo_url" referrerpolicy="no-referrer"
									class="w-12 h-12 shrink-0 rounded-full border-2 shadow-sm"
									:class="index % 2 === 0 ? 'border-slate-50' : 'border-white/20'" />
								<div v-else
									class="w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-sm font-bold border-2"
									:class="index % 2 === 0 ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-white/10 border-white/20 text-white'">
									{{ msg.guest.name?.charAt(0).toUpperCase() }}
								</div>
								<div class="flex flex-col min-w-0">
									<p class="text-sm font-medium tracking-wide truncate"
										:class="index % 2 === 0 ? 'text-slate-900' : 'text-white'">{{ msg.guest.name }}</p>
									<p class="text-xs font-light mt-0.5 truncate"
										:class="index % 2 === 0 ? 'text-slate-400' : 'text-white/70'">{{ dayjs(msg.$createdAt).format('DD [de] MMMM [de] YYYY') }}</p>
								</div>

								<!-- Delete button -->
								<Button variant="ghost" v-if="currentUser && (currentUser.$id === msg.guest.$id)"
									@click="deleteMessage(msg.$id)" class="!p-2 h-auto ml-auto"
									:class="index % 2 === 0 ? 'text-slate-300 hover:text-red-500' : 'text-white/50 hover:text-white'">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
