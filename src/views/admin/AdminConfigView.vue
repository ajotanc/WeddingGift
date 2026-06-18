<script setup lang="ts">
import { useTenant } from "@/composables/useTenant";
import { TenantService } from "@/services/tenant.service";
import { useAuthStore } from "@/stores/auth";
import { ref, watch } from "vue";
import { useConfirm } from "@/components/ui/confirm/useConfirm";
import "@vueup/vue-quill/dist/vue-quill.snow.css";
import { StorageService } from "@/services/storage.service";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import * as z from "zod";
import FileUpload from "@/components/reusable/FileUpload.vue";
import PageHeader from "@/components/reusable/PageHeader.vue";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FormGroup from "@/components/reusable/FormGroup.vue";
import {
	InputGroup,
	InputGroupInput,
	InputGroupText,
} from "@/components/ui/input-group";
import { Loader2, Plus, Trash2, HelpCircle, Image as ImageIcon, GripVertical, Settings, Calendar, Clock, Utensils, Music, GlassWater, Heart, Cake, Camera, Sparkles, MapPin, Gift } from "lucide-vue-next";
import DatePicker from "@/components/reusable/DatePicker.vue";
import LocationAutocomplete from "@/components/ui/LocationAutocomplete.vue";
import { Button } from "@/components/ui/button";
import { toast } from "vue-sonner";
import { GalleryService, type IGalleryImage } from "@/services/gallery.service";
import { FaqService } from "@/services/faq.service";
import { ScheduleService } from "@/services/schedule.service";
import { sortBy } from "@/lib/utils";
import { storage, BUCKET_ID } from "@/lib/appwrite";

const { tenant, gallery, faqs, schedules } = useTenant();
const authStore = useAuthStore();
const { confirm } = useConfirm();
const activeTab = ref("geral");

const hostName = window.location.host;

const zodSchema = z.object({
	groom_name: z.string().min(2, "Nome muito curto").optional(),
	bride_name: z.string().min(2, "Nome muito curto").optional(),
	slug: z
		.string()
		.min(3, "Mínimo de 3 caracteres")
		.regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hifens"),
	pix_key: z.string().min(5, "Chave PIX inválida"),
	couple_history: z.string().optional(),
	quote: z.string().optional(),
	event_date: z.string().nullable().optional(),
	event_time: z.string().nullable().optional(),
	event_location: z.string().nullable().optional(),
	guest_limit: z.number().int().positive().nullable().optional(),
	show_countdown: z.boolean().optional(),
	show_gallery: z.boolean().optional(),
	show_faq: z.boolean().optional(),
	show_schedule: z.boolean().optional(),
	primary_color: z.string(),
	background_image: z
		.string()
		.optional()
		.or(z.string().regex(/^data:image\/[a-zA-Z]+;base64,/, "Imagem inválida"))
		.refine(
			(val) => {
				if (!val) return true;
				try {
					new URL(val);
					return true;
				} catch {
					return false;
				}
			},
			{ message: "URL inválida" },
		),
	logo_url: z.string().optional(),
	background_color: z
		.string()
		.regex(/^#([0-9A-Fa-f]{3}){1,2}$/, { message: "Cor inválida" })
		.optional(),
});

const configSchema = toTypedSchema(zodSchema);

type ConfigFormValues = z.infer<typeof zodSchema>;

const { handleSubmit, errors, setValues, defineField } =
	useForm<ConfigFormValues>({
		validationSchema: configSchema,
		initialValues: {
			groom_name: "",
			bride_name: "",
			slug: "",
			pix_key: "",
			couple_history: "",
			quote: "",
			event_date: null,
			event_time: null,
			show_countdown: true,
			show_gallery: false,
			show_faq: false,
			show_schedule: false,
			primary_color: "#ec4899",
			background_color: "#ffffff",
			logo_url: "",
		},
	});

const [groom_name] = defineField("groom_name");
const [bride_name] = defineField("bride_name");
const [slug] = defineField("slug");
const [pix_key] = defineField("pix_key");
const [couple_history] = defineField("couple_history");
const [quote] = defineField("quote");
const [event_date] = defineField("event_date");
const [event_time] = defineField("event_time");
const [event_location] = defineField("event_location");
const [guest_limit] = defineField("guest_limit");
const [show_countdown] = defineField("show_countdown");
const [show_gallery] = defineField("show_gallery");
const [show_faq] = defineField("show_faq");
const [show_schedule] = defineField("show_schedule");
const [primary_color] = defineField("primary_color");
const [background_image] = defineField("background_image");
const [logo_url] = defineField("logo_url");
const [background_color] = defineField("background_color");

const isSaving = ref(false);

const isUploadingBackground = ref(false);
const isUploadingLogo = ref(false);

const onBackgroundUpload = async (file: File) => {
	if (authStore.user) {
		isUploadingBackground.value = true;
		try {
			toast.info("Enviando imagem de fundo...");
			const url = await StorageService.autoUpload(
				authStore.user.$id,
				file,
				"background",
			);
			background_image.value = url;
			toast.success("Imagem de fundo enviada com sucesso!");
		} catch (err) {
			console.error(err);
			toast.error("Falha ao enviar a imagem.");
		} finally {
			isUploadingBackground.value = false;
		}
	}
};

const onLogoUpload = async (file: File) => {
	if (authStore.user) {
		isUploadingLogo.value = true;
		try {
			toast.info("Enviando logomarca...");
			const url = await StorageService.autoUpload(
				authStore.user.$id,
				file,
				"logo",
			);
			logo_url.value = url;
			toast.success("Logomarca enviada com sucesso!");
		} catch (err) {
			console.error(err);
			toast.error("Falha ao enviar a logomarca.");
		} finally {
			isUploadingLogo.value = false;
		}
	}
};

// Os switches da galeria e faq agora são gerenciados pelo formulário (defineField)

const isUploadingGalleryImage = ref(false);

const onGalleryImageUpload = async (file: File) => {
	if (!tenant.value || !authStore.user) return;
	if (gallery.value.length >= 20) {
		toast.error("Limite atingido", {
			description: "Você pode enviar no máximo 20 imagens.",
		});
		return;
	}

	isUploadingGalleryImage.value = true;

	try {
		toast.info("Enviando imagem para a galeria...");

		const newImage = await GalleryService.create(
			{
				tenant: tenant.value.$id,
				image_url: "",
			},
			file,
		);

		gallery.value.push(newImage);
		toast.success("Imagem adicionada à galeria!");
	} catch (err) {
		console.error(err);
		toast.error("Falha ao enviar a imagem.");
	} finally {
		isUploadingGalleryImage.value = false;
	}
};

const deleteGalleryImage = (image: IGalleryImage) => {
	confirm({
		title: "Excluir Imagem",
		description: "Tem certeza de que deseja excluir esta imagem da galeria?",
		confirmText: "Sim, excluir",
		cancelText: "Não",
		confirm: async () => {
			try {
				await GalleryService.delete(image.$id);
				gallery.value = gallery.value.filter((img) => img.$id !== image.$id);
				toast.success("Imagem removida com sucesso!");
			} catch (err) {
				console.error(err);
				toast.error("Falha ao excluir a imagem.");
			}
		},
	});
};

const faqQuestion = ref("");
const faqAnswer = ref("");
const isAddingFaq = ref(false);

const addCustomFaq = async () => {
	if (!tenant.value || !faqQuestion.value.trim() || !faqAnswer.value.trim())
		return;

	isAddingFaq.value = true;
	try {
		const newFaq = await FaqService.create({
			tenant: tenant.value.$id,
			question: faqQuestion.value,
			answer: faqAnswer.value,
			order: faqs.value.length,
		});

		faqs.value.push(newFaq);
		faqQuestion.value = "";
		faqAnswer.value = "";
		toast.success("Pergunta frequente adicionada!");
	} catch (err) {
		console.error(err);
		toast.error("Falha ao adicionar a pergunta.");
	} finally {
		isAddingFaq.value = false;
	}
};

const deleteFaq = (id: string) => {
	confirm({
		title: "Excluir Pergunta",
		description: "Tem certeza de que deseja excluir esta pergunta frequente?",
		confirmText: "Sim, excluir",
		cancelText: "Não",
		confirm: async () => {
			try {
				await FaqService.delete(id);
				faqs.value = faqs.value.filter((f) => f.$id !== id);
				toast.success("Pergunta frequente excluída!");
			} catch (err) {
				console.error(err);
				toast.error("Falha ao excluir a pergunta.");
			}
		},
	});
};

const scheduleTitle = ref("");
const scheduleDescription = ref("");
const scheduleHour = ref("");
const scheduleIcon = ref("clock");
const isAddingSchedule = ref(false);

const addCustomSchedule = async () => {
	if (!tenant.value || !scheduleTitle.value.trim() || !scheduleHour.value.trim()) return;

	isAddingSchedule.value = true;
	try {
		const newItem = await ScheduleService.create({
			tenant: tenant.value.$id,
			title: scheduleTitle.value,
			description: scheduleDescription.value,
			hour: scheduleHour.value,
			icon: scheduleIcon.value,
		});

		schedules.value.push(newItem);
		schedules.value = sortBy(schedules.value, "hour");

		scheduleTitle.value = "";
		scheduleDescription.value = "";
		scheduleHour.value = "";
		scheduleIcon.value = "clock";
		toast.success("Evento adicionado ao cronograma!");
	} catch (err) {
		console.error(err);
		toast.error("Falha ao adicionar o evento.");
	} finally {
		isAddingSchedule.value = false;
	}
};

const deleteSchedule = (id: string) => {
	confirm({
		title: "Excluir Evento",
		description: "Tem certeza de que deseja excluir este evento do cronograma?",
		confirmText: "Sim, excluir",
		cancelText: "Não",
		confirm: async () => {
			try {
				await ScheduleService.delete(id);
				schedules.value = schedules.value.filter((s) => s.$id !== id);
				toast.success("Evento excluído do cronograma!");
			} catch (err) {
				console.error(err);
				toast.error("Falha ao excluir o evento.");
			}
		}
	});
};

const predefinedSchedules = [
	{
		title: "Cerimônia de Casamento",
		description: "Cerimônia religiosa e celebração.",
		icon: "clock",
	},
	{
		title: "Recepção e Coquetel",
		description: "Momento para cumprimentar os noivos, tirar fotos e descontrair.",
		icon: "cheers",
	},
	{
		title: "Jantar de Comemoração",
		description: "Um buffet preparado com muito carinho para celebrarmos juntos.",
		icon: "utensils",
	},
	{
		title: "Abertura da Pista de Dança",
		description: "Hora de celebrar na pista com muita música e diversão!",
		icon: "music",
	},
];

const selectPredefinedSchedule = (predef: { title: string; description: string; icon: string }) => {
	scheduleTitle.value = predef.title;
	scheduleDescription.value = predef.description;
	scheduleIcon.value = predef.icon;
	if (tenant.value?.event_time && !scheduleHour.value) {
		scheduleHour.value = tenant.value.event_time;
	}
	toast.info("Sugestão selecionada! Você pode ajustar os detalhes antes de salvar.");
};

const draggedIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

const onDragStart = (index: number, event: DragEvent) => {
	draggedIndex.value = index;
	if (event.dataTransfer) {
		event.dataTransfer.effectAllowed = "move";
	}
};

const onDragOver = (index: number, event: DragEvent) => {
	event.preventDefault();
	if (draggedIndex.value !== index) {
		dragOverIndex.value = index;
	}
};

const onDragLeave = (index: number) => {
	if (dragOverIndex.value === index) {
		dragOverIndex.value = null;
	}
};

const onDragEnd = () => {
	draggedIndex.value = null;
	dragOverIndex.value = null;
};

const onDrop = async (targetIndex: number) => {
	dragOverIndex.value = null;
	if (draggedIndex.value === null || draggedIndex.value === targetIndex) return;

	const items = [...faqs.value];
	const [movedItem] = items.splice(draggedIndex.value, 1);
	items.splice(targetIndex, 0, movedItem);

	// Atualiza localmente
	faqs.value = items;

	// Salva a nova ordenação no banco
	try {
		const promises = faqs.value.map((faq, index) => {
			if (faq.order !== index) {
				faq.order = index;
				return FaqService.update(faq.$id, { order: index });
			}
			return Promise.resolve();
		});

		await Promise.all(promises);
		toast.success("Ordem do FAQ atualizada!");
	} catch (err) {
		console.error("Erro ao atualizar ordem do FAQ:", err);
		toast.error("Falha ao salvar a nova ordem das perguntas.");
	} finally {
		draggedIndex.value = null;
	}
};

const predefinedFaqs = [
	{
		question: "Qual o traje recomendado?",
		answer:
			"Recomendamos traje Esporte Fino para que todos fiquem confortáveis e elegantes.",
	},
	{
		question: "Há estacionamento no local?",
		answer:
			"Sim, o local do evento conta com estacionamento gratuito e manobrista para os convidados.",
	},
	{
		question: "Posso levar acompanhantes?",
		answer:
			"A lista de convidados é restrita aos nomes indicados no seu convite. Caso queira levar acompanhantes, confirme a quantidade permitida no RSVP.",
	},
	{
		question: "Qual a data limite para confirmar presença?",
		answer:
			"Pedimos a gentileza de confirmar sua presença (RSVP) até 15 dias antes do evento.",
	},
	{
		question: "Onde posso encontrar a lista de presentes?",
		answer:
			"Nossa lista de presentes está disponível aqui no nosso site na aba 'Nossa Lista'. Você pode escolher presentear via PIX ou comprar nas lojas parceiras.",
	},
];

const selectPredefinedFaq = (predef: { question: string; answer: string }) => {
	faqQuestion.value = predef.question;
	faqAnswer.value = predef.answer;
	toast.info(
		"Pergunta selecionada! Você pode editar a resposta antes de salvar.",
	);
};

const loadSettings = () => {
	if (tenant.value) {
		show_gallery.value = tenant.value.show_gallery ?? false;
		show_faq.value = tenant.value.show_faq ?? false;
		show_schedule.value = tenant.value.show_schedule ?? false;
		setValues({
			groom_name: tenant.value.groom_name || "",
			bride_name: tenant.value.bride_name || "",
			slug: tenant.value.slug || "",
			pix_key: tenant.value.pix_key || "",
			couple_history: tenant.value.couple_history || "",
			quote: tenant.value.quote || "",
			event_date: tenant.value.event_date || null,
			event_time: tenant.value.event_time || null,
			event_location: tenant.value.event_location || "",
			guest_limit: tenant.value.guest_limit ?? 0,
			show_countdown: tenant.value.show_countdown ?? true,
			primary_color: tenant.value.primary_color || "#ec4899",
			background_image: tenant.value.background_image || "",
			logo_url: tenant.value.logo_url || "",
			background_color: tenant.value.background_color || "#ffffff",
		});
	}
};

watch(
	tenant,
	(newTenant) => {
		if (newTenant) loadSettings();
	},
	{ immediate: true },
);

watch([groom_name, bride_name], ([groom, bride]) => {
	if (groom && bride) {
		const generated = `${bride}-${groom}`
			.normalize("NFD")
			.replace(/\p{M}/gu, "")
			.toLowerCase()
			.replace(/[^a-z0-9-]/g, "");

		slug.value = generated;
	}
});

function onLocationSelect(payload: { address: string }) {
	event_location.value = payload.address;
}

const onFileSelect = async (e: Event) => {
	const target = e.target as HTMLInputElement;
	const file = target.files?.[0];

	if (file && authStore.user) {
		try {
			toast({ title: "Aviso", description: "Otimizando e enviando imagem..." });

			const url = await StorageService.uploadFile(
				authStore.user.$id,
				file,
				"background",
			);

			background_image.value = url;

			toast({
				title: "Sucesso",
				description: "Imagem enviada com sucesso!",
				class: "bg-emerald-500 text-white border-none",
			});
		} catch (err) {
			console.error(err);
			toast({
				title: "Erro",
				description: "Falha ao enviar a imagem.",
				variant: "destructive",
			});
		}
	}
};

const onLogoSelect = async (e: Event) => {
	const target = e.target as HTMLInputElement;
	const file = target.files?.[0];

	if (file && authStore.user) {
		try {
			toast.info("Aviso", { description: "Enviando logomarca..." });

			const url = await StorageService.uploadFile(
				authStore.user.$id,
				file,
				"logo",
			);

			logo_url.value = url;

			toast.success("Sucesso", {
				description: "Logomarca enviada com sucesso!",
			});
		} catch (err) {
			console.error(err);
			toast.error("Erro", { description: "Falha ao enviar a logomarca." });
		}
	}
};

const slugStatus = ref<"idle" | "checking" | "available" | "unavailable">(
	"idle",
);

watch(slug, (newSlug) => {
	if (newSlug === tenant.value?.slug) {
		slugStatus.value = "idle";
	} else if (slugStatus.value !== "idle" && slugStatus.value !== "checking") {
		slugStatus.value = "idle";
	}
});

const checkSlug = async () => {
	if (!slug.value || slug.value === tenant.value?.slug || !!errors.value.slug) {
		slugStatus.value = "idle";
		return;
	}
	slugStatus.value = "checking";
	try {
		const existing = await TenantService.getBySlug(slug.value);
		if (existing?.$id && existing.$id !== tenant.value?.$id) {
			slugStatus.value = "unavailable";
		} else {
			slugStatus.value = "available";
		}
	} catch (e) {
		slugStatus.value = "idle";
	}
};

const saveSettings = handleSubmit(async (values) => {
	if (!tenant.value || !authStore.user || slugStatus.value === "unavailable")
		return;

	isSaving.value = true;

	try {
		const coupleName =
			`${values.bride_name || ""} & ${values.groom_name || ""}`.trim();
		const urlChanged = tenant.value.slug !== values.slug;

		const payload = {
			...values,
			couple_name: coupleName,
		};

		const updatedTenant = await TenantService.update(
			authStore.user.$id,
			payload,
		);

		tenant.value = updatedTenant;
		authStore.tenant = updatedTenant;

		if (urlChanged) {
			window.location.href = `/${values.slug}/admin/config`;
		} else {
			window.location.reload();
		}
	} catch (err) {
		console.error("Erro ao salvar configurações", err);
		toast({
			title: "Erro",
			description: "Erro ao salvar as configurações.",
			variant: "destructive",
		});
	} finally {
		isSaving.value = false;
	}
});
</script>

<template>
	<div class="space-y-8 w-full">
		<!-- Header -->
		<PageHeader title="Configurações" description="Personalize o seu site de casamento." />

		<Tabs v-model="activeTab" class="w-full">
			<div class="flex items-center gap-1.5 mb-8 w-full overflow-x-auto pb-2 flex-nowrap hide-scrollbar md:w-fit md:pb-0">
				<button 
					type="button"
					@click="activeTab = 'geral'" 
					class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2.5 border-0 shadow-none cursor-pointer shrink-0"
					:class="activeTab === 'geral' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-zinc-100 hover:text-slate-900'"
				>
					<Settings class="w-4 h-4" />
					Geral
				</button>
				<button 
					type="button"
					@click="activeTab = 'galeria'" 
					class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2.5 border-0 shadow-none cursor-pointer shrink-0"
					:class="activeTab === 'galeria' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-zinc-100 hover:text-slate-900'"
				>
					<ImageIcon class="w-4 h-4" />
					Galeria de Fotos
				</button>
				<button 
					type="button"
					@click="activeTab = 'faq'" 
					class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2.5 border-0 shadow-none cursor-pointer shrink-0"
					:class="activeTab === 'faq' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-zinc-100 hover:text-slate-900'"
				>
					<HelpCircle class="w-4 h-4" />
					FAQ (Dúvidas)
				</button>
				<button 
					type="button"
					@click="activeTab = 'cronograma'" 
					class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2.5 border-0 shadow-none cursor-pointer shrink-0"
					:class="activeTab === 'cronograma' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-zinc-100 hover:text-slate-900'"
				>
					<Calendar class="w-4 h-4" />
					Cronograma
				</button>
			</div>

			<!-- TAB: GERAL -->
			<TabsContent value="geral" class="mt-0">
				<form @submit.prevent="saveSettings"
					class="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-8">
					<div class="flex items-center justify-between border-b border-slate-100 pb-4">
						<div>
							<h3 class="text-lg font-semibold text-slate-800">Informações Gerais</h3>
							<p class="text-xs text-slate-500">Personalize as informações básicas e a identidade visual do site do casamento.</p>
						</div>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormGroup label="Nome do Noivo" :error="errors.groom_name">
							<Input v-model="groom_name" placeholder="Ex: João" class="bg-slate-50/50" />
						</FormGroup>
						<FormGroup label="Nome da Noiva" :error="errors.bride_name">
							<Input v-model="bride_name" placeholder="Ex: Maria" class="bg-slate-50/50" />
						</FormGroup>
						<FormGroup label="Chave PIX" :error="errors.pix_key">
							<Input v-model="pix_key" placeholder="CPF, Email ou Telefone" class="bg-slate-50/50" />
						</FormGroup>
						<FormGroup label="Link Personalizado" :error="errors.slug">
							<InputGroup
								:class="{ 'border-red-400': slugStatus === 'unavailable', 'border-emerald-400': slugStatus === 'available', 'border-slate-200': slugStatus === 'idle' || slugStatus === 'checking' }">
								<InputGroupText align="inline-start">
									<span class="text-slate-500 font-medium text-sm">https://{{ hostName }}/</span>
								</InputGroupText>
								<InputGroupInput v-model="slug" type="text" placeholder="joao-maria" @blur="checkSlug"
									class="bg-white focus:outline-none text-slate-700" />
							</InputGroup>
							<div class="flex items-center gap-2 mt-1 min-h-[20px]">
								<p class="text-xs text-red-400">Atenção: alterar o link invalida o acesso antigo.</p>
								<span v-if="slugStatus === 'checking'" class="text-xs text-slate-500 ml-auto flex items-center">
									<Loader2 class="w-3 h-3 animate-spin mr-1" /> Verificando...
								</span>
								<span v-else-if="slugStatus === 'unavailable'"
									class="text-xs text-red-500 font-medium ml-auto flex items-center">Indisponível</span>
								<span v-else-if="slugStatus === 'available'"
									class="text-xs text-emerald-500 font-medium ml-auto flex items-center">Disponível</span>
							</div>
						</FormGroup>
					</div>

					<FormGroup label="História do Casal">
						<p class="text-xs text-slate-500 mb-1">Escreva um texto especial contando a história de vocês. Ele aparecerá
							na
							página inicial para os convidados.</p>
						<div class="border border-slate-200 rounded-xl overflow-hidden bg-white">
							<QuillEditor theme="snow" v-model:content="couple_history" contentType="html"
								class="min-h-[200px] text-base font-sans" />
						</div>
					</FormGroup>

					<div class="grid grid-cols-1 gap-6">
						<FormGroup label="Citação" :error="errors.quote">
							<Input v-model="quote" placeholder="Tudo posso naquele que me fortalece." class="bg-slate-50/50" />
						</FormGroup>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormGroup label="Data do Evento" :error="errors.event_date">
							<DatePicker v-model="event_date" class="bg-slate-50/50" />
						</FormGroup>

						<FormGroup label="Hora do Evento" :error="errors.event_time">
							<Input type="text" v-model="event_time" v-maska data-maska="##:##" inputmode="numeric" placeholder="00:00"
								class="bg-slate-50/50" />
						</FormGroup>

						<FormGroup label="Local do Evento" class="md:col-span-2">
							<LocationAutocomplete @select="onLocationSelect" />
							<p class="text-xs text-slate-500 mt-1">Selecionado: {{ event_location }}</p>
						</FormGroup>

						<FormGroup label="Exibir Contagem Regressiva">
							<div class="flex items-center gap-2">
								<Switch v-model="show_countdown" id="show_countdown" />
								<label for="show_countdown">
									{{ show_countdown ? 'Ativo' : 'Inativo' }}
								</label>
							</div>
						</FormGroup>

						<FormGroup label="Exibir Galeria de Fotos">
							<div class="flex items-center gap-2">
								<Switch v-model="show_gallery" id="show_gallery" />
								<label for="show_gallery">
									{{ show_gallery ? 'Ativo' : 'Inativo' }}
								</label>
							</div>
						</FormGroup>

						<FormGroup label="Exibir FAQ">
							<div class="flex items-center gap-2">
								<Switch v-model="show_faq" id="show_faq" />
								<label for="show_faq">
									{{ show_faq ? 'Ativo' : 'Inativo' }}
								</label>
							</div>
						</FormGroup>

						<FormGroup label="Exibir Cronograma">
							<div class="flex items-center gap-2">
								<Switch v-model="show_schedule" id="show_schedule" />
								<label for="show_schedule">
									{{ show_schedule ? 'Ativo' : 'Inativo' }}
								</label>
							</div>
						</FormGroup>

					<div class="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
						<FormGroup label="Limite de Convidados" :error="errors.guest_limit">
							<Input type="number" v-model.number="guest_limit" min="0" class="bg-slate-50/50" />
						</FormGroup>

						<FormGroup label="Cor Principal">
							<div class="flex items-center gap-4 h-10">
								<Input type="color" v-model="primary_color" class="w-8 h-8 rounded cursor-pointer p-0 border-0 bg-transparent" />
								<span class="text-sm font-medium text-slate-600">{{ primary_color }}</span>
							</div>
						</FormGroup>

						<FormGroup label="Cor de Fundo" :error="errors.background_color">
							<div class="flex items-center gap-4 h-10">
								<Input type="color" v-model="background_color" class="w-8 h-8 rounded cursor-pointer p-0 border-0 bg-transparent" />
								<span class="text-sm font-medium text-slate-600">{{ background_color }}</span>
							</div>
						</FormGroup>
					</div>

					<div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
						<FormGroup label="Logomarca" :error="errors.logo_url">
							<FileUpload v-model="logo_url" :auto-upload="true" :uploading="isUploadingLogo"
								@auto-upload="onLogoUpload" :maxSizeMb="1" accept="image/*" />
						</FormGroup>

						<FormGroup label="Imagem de Fundo" :error="errors.background_image">
							<FileUpload v-model="background_image" :auto-upload="true" :uploading="isUploadingBackground"
								@auto-upload="onBackgroundUpload" :maxSizeMb="2" accept="image/*" />
						</FormGroup>
					</div>
					</div>

					<div class="pt-6 border-t border-slate-100 flex justify-end">
						<Button type="submit" :disabled="isSaving">
							{{ isSaving ? 'Salvando...' : 'Salvar Alterações' }}
						</Button>
					</div>
				</form>
			</TabsContent>

			<!-- TAB: GALERIA -->
			<TabsContent value="galeria" class="mt-0">
				<div
					class="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
					<div class="flex items-center justify-between border-b border-slate-100 pb-4">
						<div>
							<h3 class="text-lg font-semibold text-slate-800">Galeria de Fotos</h3>
							<p class="text-xs text-slate-500">Compartilhe os melhores momentos do casal (máximo de 20 fotos).</p>
						</div>
					</div>

					<div v-if="show_gallery" class="space-y-6 pt-2">
						<FormGroup label="Adicionar Foto">
							<div class="w-full">
								<FileUpload :model-value="null" :auto-upload="true" :uploading="isUploadingGalleryImage"
									@auto-upload="onGalleryImageUpload" :maxSizeMb="2" accept="image/*" />
							</div>
						</FormGroup>

						<div v-if="gallery.length > 0" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-4">
							<div v-for="img in gallery" :key="img.$id"
								class="group relative aspect-square rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shadow-sm">
								<img :src="img.image_url" class="w-full h-full object-cover" />
								<div
									class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
									<button type="button" @click="deleteGalleryImage(img)"
										class="bg-white hover:bg-red-50 text-red-500 hover:text-red-600 p-2.5 rounded-full shadow transition-all transform hover:scale-110 cursor-pointer border-0 outline-none">
										<Trash2 class="w-5 h-5" />
									</button>
								</div>
							</div>
						</div>
						<div v-else
							class="py-12 text-center text-slate-400 flex flex-col items-center justify-center border border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
							<ImageIcon class="w-12 h-12 text-slate-200 mb-2" />
							<p class="text-sm font-light">Nenhuma foto adicionada à galeria ainda.</p>
						</div>
					</div>
					<div v-else class="py-12 text-center text-slate-400 border border-slate-100 rounded-2xl bg-slate-50/30">
						<p class="text-sm font-light">A galeria de fotos está desativada. Ative no interruptor acima para começar a
							adicionar fotos.</p>
					</div>
				</div>
			</TabsContent>

			<!-- TAB: FAQ -->
			<TabsContent value="faq" class="mt-0">
				<div
					class="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
					<div class="flex items-center justify-between border-b border-slate-100 pb-4">
						<div>
							<h3 class="text-lg font-semibold text-slate-800">FAQ (Perguntas Frequentes)</h3>
							<p class="text-xs text-slate-500">Esclareça as principais dúvidas dos seus convidados.</p>
						</div>
					</div>

					<div v-if="show_faq" class="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
						<!-- List of FAQs and Predefined Questions -->
						<div class="lg:col-span-7 space-y-6">
							<div>
								<h4 class="text-sm font-semibold text-slate-700 mb-3">Perguntas Cadastradas</h4>
								<div v-if="faqs.length > 0" class="space-y-3">
									<div v-for="(faq, index) in faqs" :key="faq.$id"
										draggable="true"
										@dragstart="onDragStart(index, $event)"
										@dragover="onDragOver(index, $event)"
										@dragleave="onDragLeave(index)"
										@dragend="onDragEnd"
										@drop="onDrop(index)"
										class="p-4 rounded-2xl border flex items-start gap-4 shadow-sm cursor-grab active:cursor-grabbing hover:bg-slate-50 transition-all duration-200"
										:class="[
											draggedIndex === index ? 'opacity-40 border-slate-200 bg-slate-50/50' : '',
											dragOverIndex === index && draggedIndex !== index 
												? 'border-dashed border-primary bg-primary/5 scale-[1.01] shadow-md' 
												: 'border-slate-100 bg-slate-50/50'
										]"
									>
										<GripVertical class="w-4 h-4 text-slate-400 mt-1 shrink-0 cursor-grab" />
										<div class="flex-1 min-w-0">
											<p class="font-medium text-slate-900 text-sm">{{ faq.question }}</p>
											<p class="text-slate-500 text-xs mt-1 leading-relaxed">{{ faq.answer }}</p>
										</div>
										<button type="button" @click="deleteFaq(faq.$id)"
											class="text-slate-400 hover:text-red-500 p-1 bg-transparent border-0 outline-none cursor-pointer transition-colors">
											<Trash2 class="w-4 h-4" />
										</button>
									</div>
								</div>
								<div v-else class="py-8 text-center text-slate-400 border border-slate-100 rounded-2xl bg-slate-50/30">
									<p class="text-xs font-light">Nenhuma pergunta cadastrada.</p>
								</div>
							</div>

							<div>
								<h4 class="text-sm font-semibold text-slate-700 mb-2">Sugestões de Perguntas</h4>
								<p class="text-xs text-slate-400 mb-3">Clique em uma sugestão abaixo para carregar no formulário:</p>
								<div class="flex flex-wrap gap-2">
									<button v-for="item in predefinedFaqs" :key="item.question" type="button"
										@click="selectPredefinedFaq(item)"
										class="px-3.5 py-1.5 text-xs bg-slate-100 hover:bg-primary/10 text-slate-600 hover:text-primary rounded-full transition-all border-0 outline-none cursor-pointer font-medium">
										{{ item.question }}
									</button>
								</div>
							</div>
						</div>

						<!-- Add FAQ Form -->
						<div class="lg:col-span-5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4 h-fit">
							<h4 class="text-sm font-semibold text-slate-800">Nova Pergunta</h4>

							<FormGroup label="Pergunta">
								<Input v-model="faqQuestion" placeholder="Ex: Qual o traje recomendado?"
									class="bg-white border-slate-200 rounded-xl" />
							</FormGroup>

							<FormGroup label="Resposta">
								<Textarea v-model="faqAnswer" placeholder="Ex: Recomendamos o uso de traje esporte fino..."
									class="bg-white border-slate-200 rounded-xl h-24 resize-none" />
							</FormGroup>

							<Button type="button" @click="addCustomFaq"
								:disabled="isAddingFaq || !faqQuestion.trim() || !faqAnswer.trim()">
								<Loader2 v-if="isAddingFaq" class="w-4 h-4 animate-spin mr-2" />
								Adicionar Pergunta
							</Button>
						</div>
					</div>
					<div v-else class="py-12 text-center text-slate-400 border border-slate-100 rounded-2xl bg-slate-50/30">
						<p class="text-sm font-light">O FAQ está desativado. Ative no interruptor acima para começar a adicionar
							perguntas frequentes.</p>
					</div>
				</div>
			</TabsContent>

			<!-- TAB: CRONOGRAMA -->
			<TabsContent value="cronograma" class="mt-0">
				<div
					class="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
					<div class="flex items-center justify-between border-b border-slate-100 pb-4">
						<div>
							<h3 class="text-lg font-semibold text-slate-800">Cronograma do Evento</h3>
							<p class="text-xs text-slate-500">Configure a programação completa do seu grande dia.</p>
						</div>
					</div>

					<div v-if="show_schedule" class="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
						<!-- List of Schedules -->
						<div class="lg:col-span-7 space-y-6">
							<div>
								<h4 class="text-sm font-semibold text-slate-700 mb-3">Eventos Cadastrados (Ordenados por horário)</h4>
								<div v-if="schedules.length > 0" class="space-y-3">
									<div v-for="item in schedules" :key="item.$id"
										class="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-start gap-4 shadow-sm hover:bg-slate-50 transition-all duration-200">
										<!-- Icon Badge -->
										<div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
											<Clock v-if="item.icon === 'clock'" class="w-4 h-4" />
											<GlassWater v-else-if="item.icon === 'cheers'" class="w-4 h-4" />
											<Utensils v-else-if="item.icon === 'utensils'" class="w-4 h-4" />
											<Music v-else-if="item.icon === 'music'" class="w-4 h-4" />
											<Cake v-else-if="item.icon === 'cake'" class="w-4 h-4" />
											<Camera v-else-if="item.icon === 'camera'" class="w-4 h-4" />
											<Sparkles v-else-if="item.icon === 'sparkles'" class="w-4 h-4" />
											<MapPin v-else-if="item.icon === 'map-pin'" class="w-4 h-4" />
											<Gift v-else-if="item.icon === 'gift'" class="w-4 h-4" />
											<Heart v-else class="w-4 h-4" />
										</div>
										<div class="flex-1 min-w-0">
											<div class="flex items-center gap-2">
												<span class="inline-block px-2 py-0.5 bg-primary/10 text-primary font-semibold text-xs rounded-full">
													{{ item.hour }}
												</span>
												<p class="font-medium text-slate-900 text-sm">{{ item.title }}</p>
											</div>
											<p class="text-slate-500 text-xs mt-1.5 leading-relaxed">{{ item.description }}</p>
										</div>
										<button type="button" @click="deleteSchedule(item.$id)"
											class="text-slate-400 hover:text-red-500 p-1 bg-transparent border-0 outline-none cursor-pointer transition-colors">
											<Trash2 class="w-4 h-4" />
										</button>
									</div>
								</div>
								<div v-else class="py-8 text-center text-slate-400 border border-slate-100 rounded-2xl bg-slate-50/30">
									<p class="text-xs font-light">Nenhum evento cadastrado no cronograma.</p>
								</div>
							</div>

							<div>
								<h4 class="text-sm font-semibold text-slate-700 mb-2">Sugestões de Eventos</h4>
								<p class="text-xs text-slate-400 mb-3">Clique em uma sugestão abaixo para carregar no formulário:</p>
								<div class="flex flex-wrap gap-2">
									<button v-for="item in predefinedSchedules" :key="item.title" type="button"
										@click="selectPredefinedSchedule(item)"
										class="px-3.5 py-1.5 text-xs bg-slate-100 hover:bg-primary/10 text-slate-600 hover:text-primary rounded-full transition-all border-0 outline-none cursor-pointer font-medium">
										{{ item.title }}
									</button>
								</div>
							</div>
						</div>

						<!-- Add Schedule Form -->
						<div class="lg:col-span-5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4 h-fit">
							<h4 class="text-sm font-semibold text-slate-800">Novo Evento</h4>

							<FormGroup label="Título do Evento">
								<Input v-model="scheduleTitle" placeholder="Ex: Recepção e Coquetel"
									class="bg-white border-slate-200 rounded-xl" />
							</FormGroup>

							<FormGroup label="Horário">
								<Input v-model="scheduleHour" v-maska data-maska="##:##" placeholder="Ex: 19:30"
									class="bg-white border-slate-200 rounded-xl" />
							</FormGroup>

							<FormGroup label="Descrição">
								<Textarea v-model="scheduleDescription" placeholder="Ex: Momento para cumprimentar os noivos..."
									class="bg-white border-slate-200 rounded-xl h-20 resize-none" />
							</FormGroup>

							<FormGroup label="Ícone">
								<Select v-model="scheduleIcon">
									<SelectTrigger class="w-full bg-white border-slate-200 rounded-xl text-sm font-light text-slate-600 focus:ring-primary/20 h-10">
										<SelectValue placeholder="Selecione um ícone" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="clock">Cerimônia / Relógio</SelectItem>
										<SelectItem value="cheers">Brinde / Recepção</SelectItem>
										<SelectItem value="utensils">Buffet / Jantar</SelectItem>
										<SelectItem value="music">Festa / Música</SelectItem>
										<SelectItem value="cake">Bolo / Doces</SelectItem>
										<SelectItem value="camera">Fotos / Sessão</SelectItem>
										<SelectItem value="sparkles">Momento Especial / Sparklers</SelectItem>
										<SelectItem value="map-pin">Local / Chegada</SelectItem>
										<SelectItem value="gift">Lembrancinhas / Presentes</SelectItem>
										<SelectItem value="heart">Geral / Coração</SelectItem>
									</SelectContent>
								</Select>
							</FormGroup>

							<Button type="button" @click="addCustomSchedule"
								:disabled="isAddingSchedule || !scheduleTitle.trim() || !scheduleHour.trim()">
								<Loader2 v-if="isAddingSchedule" class="w-4 h-4 animate-spin mr-2" />
								Adicionar Evento
							</Button>
						</div>
					</div>
					<div v-else class="py-12 text-center text-slate-400 border border-slate-100 rounded-2xl bg-slate-50/30">
						<p class="text-sm font-light">O cronograma do evento está desativado. Ative no interruptor na aba "Geral" para começar a adicionar eventos.</p>
					</div>
				</div>
			</TabsContent>
		</Tabs>
	</div>
</template>

<style scoped>
.hide-scrollbar {
	-ms-overflow-style: none;
	scrollbar-width: none;
}

.hide-scrollbar::-webkit-scrollbar {
	display: none;
}
</style>
