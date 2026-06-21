<script setup lang="ts">
import DatePicker from "@/components/reusable/DatePicker.vue";
import FileUpload from "@/components/reusable/FileUpload.vue";
import FormGroup from "@/components/reusable/FormGroup.vue";
import Modal from "@/components/reusable/Modal.vue";
import PageHeader from "@/components/reusable/PageHeader.vue";
import PlanLimitAlert from "@/components/reusable/PlanLimitAlert.vue";
import PlanRequired from "@/components/reusable/PlanRequired.vue";
import LocationAutocomplete from "@/components/ui/LocationAutocomplete.vue";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm/useConfirm";
import { Input } from "@/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
	FONTS_REGISTRY,
	loadGoogleFont,
	useTenant,
} from "@/composables/useTenant";
import {
	DEFAULT_BACKGROUND_COLOR,
	DEFAULT_BODY_FONT,
	DEFAULT_PRIMARY_COLOR,
	DEFAULT_TEXT_COLOR,
	DEFAULT_TITLE_FONT,
	FREE_BACKGROUND_COLORS,
	FREE_PRIMARY_COLORS,
} from "@/lib/defaults";
import { sortBy } from "@/lib/utils";
import { FaqService } from "@/services/faq.service";
import { GalleryService, type IGalleryImage } from "@/services/gallery.service";
import { ScheduleService } from "@/services/schedule.service";
import { StorageService } from "@/services/storage.service";
import { TenantService } from "@/services/tenant.service";
import { useAuthStore } from "@/stores/auth";
import { toTypedSchema } from "@vee-validate/zod";
import dayjs from "dayjs";
import {
	Cake,
	Calendar,
	Camera,
	CheckCircle,
	Clock,
	Gift,
	GlassWater,
	GripVertical,
	Heart,
	HelpCircle,
	Image as ImageIcon,
	Loader2,
	Lock,
	MapPin,
	Music,
	Settings,
	Sparkles,
	Trash2,
	Utensils,
} from "lucide-vue-next";
import { useForm } from "vee-validate";
import { ref, watch } from "vue";
import { toast } from "vue-sonner";
import * as z from "zod";

const { tenant, gallery, faqs, schedules } = useTenant();
const authStore = useAuthStore();
const { confirm } = useConfirm();
const activeTab = ref("general");
import { onMounted } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

watch(
	() => route.query.tab,
	(newTab) => {
		if (newTab) {
			activeTab.value = newTab as string;
		}
	},
	{ immediate: true },
);

// --- Mercado Pago Subscription Simulation State ---
const showCheckoutModal = ref(false);
const selectedPlan = ref<"quarterly" | "semestral">("quarterly");
const isSimulatingPayment = ref(false);

const openCheckout = (plan: "quarterly" | "semestral") => {
	selectedPlan.value = plan;
	showCheckoutModal.value = true;
};

const handleConfirmSimulatedPayment = async () => {
	isSimulatingPayment.value = true;
	try {
		await authStore.upgradeTenant(selectedPlan.value);
		toast.success("Assinatura Ativada com sucesso!", {
			description:
				"Obrigado! Sua conta agora possui acesso Premium a todas as funcionalidades.",
		});
		showCheckoutModal.value = false;
		if (tenant.value && authStore.tenant) {
			tenant.value.plan = authStore.tenant.plan;
			tenant.value.premium_until = authStore.tenant.premium_until;
		}
		setTimeout(() => {
			window.location.reload();
		}, 1500);
	} catch (e) {
		console.error(e);
		toast.error("Erro ao processar ativação de assinatura.");
	} finally {
		isSimulatingPayment.value = false;
	}
};

const showUpgradeToast = () => {
	toast.info("Recurso Premium", {
		description:
			"Esta funcionalidade requer o plano Premium. Vá para a aba 'Assinatura' para fazer o upgrade!",
		action: {
			label: "Upgrade",
			onClick: () => {
				activeTab.value = "subscription";
			},
		},
	});
};

const hostName = ref("");

onMounted(() => {
	for (const f of Object.keys(FONTS_REGISTRY)) {
		loadGoogleFont(f);
	}
});

const zodSchema = z.object({
	groom_name: z.string().min(2, "Nome muito curto").optional(),
	bride_name: z.string().min(2, "Nome muito curto").optional(),
	slug: z
		.string()
		.min(3, "Mínimo de 3 caracteres")
		.regex(/^[a-z0-9-]+$/, "Apenas letras minúsculas, números e hifens"),
	pix_key: z.string().min(5, "Chave PIX inválida"),
	pix_consent: z.boolean().refine((val) => val === true, {
		message: "Você precisa autorizar a exibição pública da sua chave PIX.",
	}),
	couple_history: z.string().optional(),
	quote: z.string().optional(),
	event_date: z.string().nullable().optional(),
	event_time: z.string().nullable().optional(),
	event_location: z.string().nullable().optional(),
	event_latitude: z.number().nullable().optional(),
	event_longitude: z.number().nullable().optional(),
	show_countdown: z.boolean().optional(),
	show_gallery: z.boolean().optional(),
	show_faq: z.boolean().optional(),
	show_schedule: z.boolean().optional(),
	show_dress_code: z.boolean().optional(),
	dress_code_text: z.string().optional(),
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
	text_color: z
		.string()
		.regex(/^#([0-9A-Fa-f]{3}){1,2}$/, { message: "Cor inválida" })
		.optional(),
	title_font: z.string().optional().nullable(),
	body_font: z.string().optional().nullable(),
	music_url: z.string().optional().nullable(),
	ambient_effect: z
		.enum([
			"none",
			"rose-petals",
			"sparkles",
			"snow",
			"hearts",
			"butterflies",
			"gold-dust",
			"confetti",
			"shooting-stars",
			"fireflies",
			"balloons",
		])
		.optional()
		.nullable(),
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
			pix_consent: false,
			couple_history: "",
			quote: "",
			event_date: null,
			event_time: null,
			event_location: "",
			event_latitude: null,
			event_longitude: null,
			show_countdown: true,
			show_gallery: false,
			show_faq: false,
			show_schedule: false,
			show_dress_code: false,
			dress_code_text: "",
			primary_color: DEFAULT_PRIMARY_COLOR,
			background_color: DEFAULT_BACKGROUND_COLOR,
			text_color: DEFAULT_TEXT_COLOR,
			logo_url: "",
			title_font: DEFAULT_TITLE_FONT,
			body_font: DEFAULT_BODY_FONT,
			music_url: "",
			ambient_effect: "none",
		},
	});

const [groom_name] = defineField("groom_name");
const [bride_name] = defineField("bride_name");
const [slug] = defineField("slug");
const [pix_key] = defineField("pix_key");
const [pix_consent] = defineField("pix_consent");
const [couple_history] = defineField("couple_history");
const [quote] = defineField("quote");
const [event_date] = defineField("event_date");
const [event_time] = defineField("event_time");
const [event_location] = defineField("event_location");
const [event_latitude] = defineField("event_latitude");
const [event_longitude] = defineField("event_longitude");
const [show_countdown] = defineField("show_countdown");
const [show_gallery] = defineField("show_gallery");
const [show_faq] = defineField("show_faq");
const [show_schedule] = defineField("show_schedule");
const [show_dress_code] = defineField("show_dress_code");
const [dress_code_text] = defineField("dress_code_text");
const [primary_color] = defineField("primary_color");
const [background_image] = defineField("background_image");
const [logo_url] = defineField("logo_url");
const [background_color] = defineField("background_color");
const [text_color] = defineField("text_color");
const [title_font] = defineField("title_font");
const [body_font] = defineField("body_font");
const [music_url] = defineField("music_url");
const [ambient_effect] = defineField("ambient_effect");

const isSaving = ref(false);

const isUploadingBackground = ref(false);
const isUploadingLogo = ref(false);

// Configurações do upload e separação da galeria
import ImageGallery from "@/components/ui/ImageGallery.vue";
import { PaymentService } from "@/services/payment.service";
import { computed } from "vue";

const uploadIsPublic = ref(false);
const handleChangeUpload = computed({
	get: () => (uploadIsPublic.value ? "true" : "false"),
	set: (val) => {
		uploadIsPublic.value = val === "true";
	},
});

const homePrivateImages = computed(() => {
	return gallery.value.filter((img) => !img.guest && !img.is_public);
});

const generalGalleryImages = computed(() => {
	return gallery.value.filter((img) => img.is_public || img.guest);
});

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

const onGalleryImageUpload = async (files: File | File[]) => {
	if (!tenant.value || !authStore.user) return;
	const tenantId = tenant.value.$id;

	const filesArray = Array.isArray(files) ? files : [files];
	const isPremium = authStore.isPremium;

	if (uploadIsPublic.value) {
		const currentPublicCount = generalGalleryImages.value.length;
		const limit = isPremium ? 99999 : 50;
		if (currentPublicCount + filesArray.length > limit) {
			toast.error("Limite atingido", {
				description: isPremium
					? `Limite de ${limit} fotos na galeria pública atingido.`
					: "No plano gratuito, a galeria pública é limitada a 50 fotos. Faça o upgrade para fotos ilimitadas!",
				action: isPremium
					? undefined
					: {
							label: "Upgrade",
							onClick: () => {
								activeTab.value = "subscription";
							},
						},
			});
			return;
		}
	} else {
		const currentPrivateCount = homePrivateImages.value.length;
		const limit = isPremium ? 20 : 5;
		if (currentPrivateCount + filesArray.length > limit) {
			toast.error("Limite atingido", {
				description: isPremium
					? "No plano Premium, o limite é de 20 fotos privadas na página inicial."
					: "No plano gratuito, o limite é de 5 fotos privadas na página inicial. Faça o upgrade para enviar até 20 fotos!",
				action: isPremium
					? undefined
					: {
							label: "Upgrade",
							onClick: () => {
								activeTab.value = "subscription";
							},
						},
			});
			return;
		}
	}

	isUploadingGalleryImage.value = true;

	try {
		toast.info(`Enviando ${filesArray.length} imagem(ns) para a galeria...`);

		const promises = filesArray.map(async (file) => {
			const newImage = await GalleryService.create(
				{
					tenant: tenantId,
					image_url: "",
					is_public: uploadIsPublic.value,
				},
				file,
			);
			return newImage;
		});

		const newImages = await Promise.all(promises);
		gallery.value.push(...newImages);
		toast.success("Imagens adicionadas com sucesso!");
	} catch (err) {
		console.error(err);
		toast.error("Falha ao enviar uma ou mais imagens.");
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

const faqSchema = toTypedSchema(
	z.object({
		faqQuestion: z
			.string()
			.min(5, "A pergunta deve ter pelo menos 5 caracteres"),
		faqAnswer: z
			.string()
			.min(10, "A resposta deve ter pelo menos 10 caracteres"),
	}),
);

const {
	handleSubmit: handleFaqSubmit,
	errors: faqErrors,
	defineField: defineFaqField,
	resetForm: resetFaqForm,
} = useForm({
	validationSchema: faqSchema,
	initialValues: {
		faqQuestion: "",
		faqAnswer: "",
	},
});

const [faqQuestion] = defineFaqField("faqQuestion");
const [faqAnswer] = defineFaqField("faqAnswer");
const isAddingFaq = ref(false);

const addCustomFaq = handleFaqSubmit(async (values) => {
	if (!tenant.value) return;

	isAddingFaq.value = true;
	try {
		const newFaq = await FaqService.create({
			tenant: tenant.value.$id,
			question: values.faqQuestion,
			answer: values.faqAnswer,
			order: faqs.value.length,
		});

		faqs.value.push(newFaq);
		resetFaqForm();
		toast.success("Pergunta frequente adicionada!");
	} catch (err) {
		console.error(err);
		toast.error("Falha ao adicionar a pergunta.");
	} finally {
		isAddingFaq.value = false;
	}
});

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

const scheduleSchema = toTypedSchema(
	z.object({
		scheduleTitle: z
			.string()
			.min(3, "O título deve ter pelo menos 3 caracteres"),
		scheduleDescription: z.string().optional(),
		scheduleHour: z
			.string()
			.regex(/^[0-9]{2}:[0-9]{2}$/, "Horário inválido (deve ser HH:MM)"),
		scheduleIcon: z.string(),
	}),
);

const {
	handleSubmit: handleScheduleSubmit,
	errors: scheduleErrors,
	defineField: defineScheduleField,
	resetForm: resetScheduleForm,
} = useForm({
	validationSchema: scheduleSchema,
	initialValues: {
		scheduleTitle: "",
		scheduleDescription: "",
		scheduleHour: "",
		scheduleIcon: "clock",
	},
});

const [scheduleTitle] = defineScheduleField("scheduleTitle");
const [scheduleDescription] = defineScheduleField("scheduleDescription");
const [scheduleHour] = defineScheduleField("scheduleHour");
const [scheduleIcon] = defineScheduleField("scheduleIcon");
const isAddingSchedule = ref(false);

const addCustomSchedule = handleScheduleSubmit(async (values) => {
	if (!tenant.value) return;

	isAddingSchedule.value = true;
	try {
		const newItem = await ScheduleService.create({
			tenant: tenant.value.$id,
			title: values.scheduleTitle,
			description: values.scheduleDescription || "",
			hour: values.scheduleHour,
			icon: values.scheduleIcon,
		});

		schedules.value.push(newItem);
		schedules.value = sortBy(schedules.value, "hour");

		resetScheduleForm();
		toast.success("Evento adicionado ao cronograma!");
	} catch (err) {
		console.error(err);
		toast.error("Falha ao adicionar o evento.");
	} finally {
		isAddingSchedule.value = false;
	}
});

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
		},
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
		description:
			"Momento para cumprimentar os noivos, tirar fotos e descontrair.",
		icon: "cheers",
	},
	{
		title: "Jantar de Comemoração",
		description:
			"Um buffet preparado com muito carinho para celebrarmos juntos.",
		icon: "utensils",
	},
	{
		title: "Abertura da Pista de Dança",
		description: "Hora de celebrar na pista com muita música e diversão!",
		icon: "music",
	},
];

const selectPredefinedSchedule = (predef: {
	title: string;
	description: string;
	icon: string;
}) => {
	scheduleTitle.value = predef.title;
	scheduleDescription.value = predef.description;
	scheduleIcon.value = predef.icon;
	if (tenant.value?.event_time && !scheduleHour.value) {
		scheduleHour.value = tenant.value.event_time;
	}
	toast.info(
		"Sugestão selecionada! Você pode ajustar os detalhes antes de salvar.",
	);
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
		show_dress_code.value = tenant.value.show_dress_code ?? false;
		setValues({
			groom_name: tenant.value.groom_name || "",
			bride_name: tenant.value.bride_name || "",
			slug: tenant.value.slug || "",
			pix_key: tenant.value.pix_key || "",
			pix_consent: !!tenant.value.pix_key,
			couple_history: tenant.value.couple_history || "",
			quote: tenant.value.quote || "",
			event_date: tenant.value.event_date || null,
			event_time: tenant.value.event_time || null,
			event_location: tenant.value.event_location || "",
			event_latitude: tenant.value.event_latitude || null,
			event_longitude: tenant.value.event_longitude || null,
			show_countdown: tenant.value.show_countdown ?? true,
			primary_color: tenant.value.primary_color || DEFAULT_PRIMARY_COLOR,
			background_image: tenant.value.background_image || "",
			logo_url: tenant.value.logo_url || "",
			background_color:
				tenant.value.background_color || DEFAULT_BACKGROUND_COLOR,
			text_color: tenant.value.text_color || DEFAULT_TEXT_COLOR,
			title_font: tenant.value.title_font || DEFAULT_TITLE_FONT,
			body_font: tenant.value.body_font || DEFAULT_BODY_FONT,
			music_url: tenant.value.music_url || "",
			ambient_effect: tenant.value.ambient_effect || "none",
			dress_code_text: tenant.value.dress_code_text || "",
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

function onLocationSelect(payload: {
	address: string;
	latitude: number;
	longitude: number;
}) {
	console.log(payload);
	event_location.value = payload.address;
	event_latitude.value = payload.latitude;
	event_longitude.value = payload.longitude;
}

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

		const { pix_consent, ...restValues } = values;

		const payload = {
			...restValues,
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
		toast.error("Erro ao salvar as configurações.");
	} finally {
		isSaving.value = false;
	}
});

onMounted(async () => {
	hostName.value = window.location.host; // Correto

	// Lógica do Mercado Pago
	const code = route.query.code as string;
	const state = route.query.state as string;

	if (code && state && tenant.value?.$id === state) {
		toast.info("Processando conexão...");
		try {
			// AQUI: Chame sua Appwrite Function que troca o code pelo token
			// await AppwriteFunctions.exchangeCodeForToken(code);
			toast.success("Conta conectada com sucesso!");
		} catch (e) {
			toast.error("Erro ao conectar conta.");
		}
		window.history.replaceState({}, document.title, window.location.pathname);
	}
});

const handleDisconnect = async () => {
	if (!tenant.value) return;
	await PaymentService.disconnect(tenant.value.$id);
	toast.success("Conta desconectada.");
	window.location.reload();
};

const connectToMarketPago = () => {
	if (tenant.value) {
		window.location.href = PaymentService.getAuthUrl(tenant.value.$id);
	} else {
		toast.error("Erro ao conectar: Tenant não encontrado.");
	}
};
</script>

<template>
	<div class="space-y-8 w-full">
		<!-- Header -->
		<PageHeader title="Configurações" description="Personalize o seu site de casamento." />

		<Tabs v-model="activeTab" class="w-full">
			<div
				class="flex items-center gap-1.5 mb-8 w-full overflow-x-auto pb-2 flex-nowrap hide-scrollbar md:w-fit md:pb-0">
				<button type="button" @click="activeTab = 'general'"
					class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2.5 border-0 shadow-none cursor-pointer shrink-0"
					:class="activeTab === 'general' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-zinc-100 hover:text-slate-900'">
					<Settings class="w-4 h-4" />
					Geral
				</button>
				<button type="button" @click="activeTab = 'gallery'"
					class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2.5 border-0 shadow-none cursor-pointer shrink-0"
					:class="activeTab === 'gallery' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-zinc-100 hover:text-slate-900'">
					<ImageIcon class="w-4 h-4" />
					Galeria de Fotos
				</button>
				<button type="button" @click="activeTab = 'faq'"
					class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2.5 border-0 shadow-none cursor-pointer shrink-0"
					:class="activeTab === 'faq' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-zinc-100 hover:text-slate-900'">
					<HelpCircle class="w-4 h-4" />
					FAQ
				</button>
				<button type="button" @click="activeTab = 'schedule'"
					class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2.5 border-0 shadow-none cursor-pointer shrink-0"
					:class="activeTab === 'schedule' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-zinc-100 hover:text-slate-900'">
					<Calendar class="w-4 h-4" />
					Cronograma
				</button>
				<button type="button" @click="activeTab = 'subscription'"
					class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2.5 border-0 shadow-none cursor-pointer shrink-0"
					:class="activeTab === 'subscription' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-zinc-100 hover:text-slate-900'">
					<Sparkles class="w-4 h-4" />
					Assinatura
				</button>
			</div>

			<!-- TAB: GERAL -->
			<TabsContent value="general" class="mt-0">
				<form @submit.prevent="saveSettings"
					class="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-8">
					<div class="flex items-center justify-between border-b border-slate-100 pb-4">
						<div>
							<h3 class="text-lg font-semibold text-slate-800">Informações Gerais</h3>
							<p class="text-xs text-slate-500">Personalize as informações básicas e a identidade visual do site do
								casamento.</p>
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
							<div class="mt-2.5 p-3.5 bg-amber-50/40 border border-amber-100 rounded-xl space-y-2">
								<div class="text-[10px] text-amber-800 font-light leading-normal flex items-start gap-1.5">
									<span class="font-bold shrink-0 mt-0.5">⚠️ Recomendação LGPD:</span>
									<span>
										Para proteger sua privacidade, recomendamos fortemente o uso de uma <strong>chave aleatória (EVP)</strong>. 
										Evite usar chaves com dados pessoais (CPF, e-mail, telefone), pois a chave será exibida publicamente na página de presentes.
									</span>
								</div>
								<div class="flex items-start gap-2 pt-1.5 border-t border-amber-100/50">
									<input type="checkbox" id="pix_consent" v-model="pix_consent"
										class="w-3.5 h-3.5 mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-50/20 accent-amber-600 cursor-pointer" />
									<label for="pix_consent"
										class="text-[11px] text-amber-900 font-normal leading-tight cursor-pointer select-none">
										Eu autorizo a exibição pública desta chave PIX no site do casamento em conformidade com a LGPD.
									</label>
								</div>
								<p v-if="errors.pix_consent" class="text-[11px] text-red-500 font-medium">{{ errors.pix_consent }}</p>
							</div>
						</FormGroup>
						<FormGroup label="Link Personalizado" :error="errors.slug">
							<InputGroup
								:class="{ 'border-red-400': slugStatus === 'unavailable', 'border-emerald-400': slugStatus === 'available', 'border-slate-200': slugStatus === 'idle' || slugStatus === 'checking' }">
								<InputGroupAddon align="inline-start">
									<span class="text-slate-500 font-medium text-sm">https://{{ hostName }}/</span>
								</InputGroupAddon>
								<InputGroupInput v-model="slug" type="text" placeholder="joao-maria" @blur="checkSlug"
									class="bg-transparent focus:outline-none text-slate-700" />
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
							<div class="flex flex-col gap-2">
								<div class="flex items-center gap-2">
									<Switch :model-value="authStore.isPremium ? show_countdown : false"
										@update:model-value="(val: boolean) => { if (!authStore.isPremium) { showUpgradeToast(); } else { show_countdown = val; } }"
										id="show_countdown" />
									<label for="show_countdown" class="flex items-center gap-1.5 text-sm select-none">
										{{ (authStore.isPremium && show_countdown) ? 'Ativo' : 'Inativo' }}
									</label>
								</div>
								<PlanRequired v-if="!authStore.isPremium" text="Contagem regressiva requer Premium" />
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

						<FormGroup label="Exibir Guia de Trajes">
							<div class="flex items-center gap-2">
								<Switch v-model="show_dress_code" id="show_dress_code" />
								<label for="show_dress_code">
									{{ show_dress_code ? 'Ativo' : 'Inativo' }}
								</label>
							</div>
						</FormGroup>

						<FormGroup v-if="show_dress_code" label="Orientações de Trajes" class="md:col-span-2">
							<p class="text-xs text-slate-500 mb-1">Escreva as informações sobre o traje sugerido (ex: Esporte Fino,
								paleta de cores recomendada, etc.). Ele aparecerá na página inicial para os convidados.</p>
							<div class="border border-slate-200 rounded-xl overflow-hidden bg-white">
								<QuillEditor theme="snow" v-model:content="dress_code_text" contentType="html"
									class="min-h-[200px] text-base font-sans" />
							</div>
						</FormGroup>

						<div class="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
							<FormGroup label="Cor do Texto" :error="errors.text_color">
								<div class="flex flex-col gap-2">
									<div class="flex items-center gap-3">
										<div
											class="relative w-9 h-9 rounded-xl border border-slate-200 overflow-hidden cursor-pointer shadow-sm">
											<input type="color" v-model="text_color"
												class="absolute inset-0 w-full h-full scale-150 cursor-pointer p-0 border-0 bg-transparent" />
										</div>
										<span class="text-sm font-medium text-slate-600">{{ text_color }}</span>
									</div>
									<span class="text-[10px] text-slate-400 font-light leading-normal">
										Essa cor serve como base para todos os textos, bordas e detalhes cinzas do site.
									</span>
								</div>
							</FormGroup>
							<FormGroup label="Cor Principal">
								<div v-if="authStore.isPremium" class="flex items-center gap-3">
									<div
										class="relative w-9 h-9 rounded-xl border border-slate-200 overflow-hidden cursor-pointer shadow-sm">
										<input type="color" v-model="primary_color"
											class="absolute inset-0 w-full h-full scale-150 cursor-pointer p-0 border-0 bg-transparent" />
									</div>
									<span class="text-sm font-medium text-slate-600">{{ primary_color }}</span>
								</div>
								<div v-else class="flex flex-col gap-2">
									<div class="flex items-center gap-2">
										<button v-for="color in FREE_PRIMARY_COLORS" :key="color" type="button"
											@click="primary_color = color"
											class="w-9 h-9 rounded-xl border transition-all cursor-pointer shadow-sm"
											:class="primary_color === color ? 'border-slate-800 scale-110' : 'border-slate-200 hover:scale-105'"
											:style="{ backgroundColor: color }"></button>
										<button type="button" @click="showUpgradeToast"
											class="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer hover:scale-105 transition-all shadow-sm"
											title="Escolher cor personalizada (Premium)">
											<Lock class="w-3.5 h-3.5 text-slate-400" />
										</button>
									</div>
									<PlanRequired text="Cor customizada requer Premium" />
								</div>
							</FormGroup>

							<FormGroup label="Cor de Fundo" :error="errors.background_color">
								<div v-if="authStore.isPremium" class="flex items-center gap-3">
									<div
										class="relative w-9 h-9 rounded-xl border border-slate-200 overflow-hidden cursor-pointer shadow-sm">
										<input type="color" v-model="background_color"
											class="absolute inset-0 w-full h-full scale-150 cursor-pointer p-0 border-0 bg-transparent" />
									</div>
									<span class="text-sm font-medium text-slate-600">{{ background_color }}</span>
								</div>
								<div v-else class="flex flex-col gap-2">
									<div class="flex items-center gap-2">
										<button v-for="color in FREE_BACKGROUND_COLORS" :key="color" type="button"
											@click="background_color = color"
											class="w-9 h-9 rounded-xl border transition-all cursor-pointer shadow-sm"
											:class="background_color === color ? 'border-slate-800 scale-110' : 'border-slate-200 hover:scale-105'"
											:style="{ backgroundColor: color }"></button>
										<button type="button" @click="showUpgradeToast"
											class="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center cursor-pointer hover:scale-105 transition-all shadow-sm"
											title="Escolher cor personalizada (Premium)">
											<Lock class="w-3.5 h-3.5 text-slate-400" />
										</button>
									</div>
									<PlanRequired text="Fundo customizado requer Premium" />
								</div>
							</FormGroup>
						</div>

						<div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
							<FormGroup label="Fonte dos Títulos">
								<div v-if="authStore.isPremium" class="w-full">
									<Select v-model="title_font">
										<SelectTrigger
											class="w-full bg-slate-50/50 border-slate-200 rounded-xl text-sm text-slate-700 h-10">
											<SelectValue placeholder="Selecione a fonte dos títulos" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem v-for="(font, key) in FONTS_REGISTRY" :key="key" :value="key"
												:style="{ fontFamily: font.cssFamily }">
												{{ font.name }}
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div v-else class="flex flex-col gap-2">
									<Select disabled model-value="playfair">
										<SelectTrigger
											class="w-full bg-slate-100 border-slate-200 rounded-xl text-sm text-slate-400 h-10 cursor-not-allowed">
											<SelectValue placeholder="Playfair Display (Serifada Elegante)" />
										</SelectTrigger>
									</Select>
									<PlanRequired text="Alterar fonte de títulos requer Premium" />
								</div>
							</FormGroup>

							<FormGroup label="Fonte do Texto">
								<div v-if="authStore.isPremium" class="w-full">
									<Select v-model="body_font">
										<SelectTrigger
											class="w-full bg-slate-50/50 border-slate-200 rounded-xl text-sm text-slate-700 h-10">
											<SelectValue placeholder="Selecione a fonte do texto" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem v-for="(font, key) in FONTS_REGISTRY" :key="key" :value="key"
												:style="{ fontFamily: font.cssFamily }">
												{{ font.name }}
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div v-else class="flex flex-col gap-2">
									<Select disabled model-value="inter">
										<SelectTrigger
											class="w-full bg-slate-100 border-slate-200 rounded-xl text-sm text-slate-400 h-10 cursor-not-allowed">
											<SelectValue placeholder="Inter (Padrão Limpo)" />
										</SelectTrigger>
									</Select>
									<PlanRequired text="Alterar fonte de texto requer Premium" />
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

						<div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100/50">
							<FormGroup label="Música de Fundo (YouTube)" :error="errors.music_url">
								<div v-if="authStore.isPremium" class="w-full space-y-1">
									<Input v-model="music_url" placeholder="https://www.youtube.com/watch?v=..."
										class="bg-slate-50/50 rounded-xl border-slate-200" />
									<span class="text-[10px] text-slate-400 font-light">
										Cole o link de um vídeo do YouTube.
									</span>
								</div>
								<div v-else class="flex flex-col gap-2">
									<Input disabled placeholder="Música desativada (Requer Premium)"
										class="bg-slate-100 text-slate-400 rounded-xl h-10 border-slate-200 cursor-not-allowed" />
									<PlanRequired text="Música de fundo requer Premium" />
								</div>
							</FormGroup>

							<FormGroup label="Efeito Visual de Fundo">
								<div v-if="authStore.isPremium" class="w-full">
									<Select v-model="ambient_effect">
										<SelectTrigger
											class="w-full bg-slate-50/50 border-slate-200 rounded-xl text-sm text-slate-700 h-10">
											<SelectValue placeholder="Selecione um efeito" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">Nenhum efeito</SelectItem>
											<SelectItem value="rose-petals">Pétalas de Rosas</SelectItem>
											<SelectItem value="sparkles">Brilhos Dourados</SelectItem>
											<SelectItem value="snow">Neve Caindo</SelectItem>
											<SelectItem value="hearts">Corações Flutuantes</SelectItem>
											<SelectItem value="butterflies">Borboletas Flutuantes</SelectItem>
											<SelectItem value="gold-dust">Poeira de Ouro</SelectItem>
											<SelectItem value="confetti">Confetes Festivos</SelectItem>
											<SelectItem value="shooting-stars">Constelação e Estrelas Cadentes</SelectItem>
											<SelectItem value="fireflies">Vaga-lumes Românticos</SelectItem>
											<SelectItem value="balloons">Balões Festivos</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div v-else class="flex flex-col gap-2">
									<Select disabled model-value="none">
										<SelectTrigger
											class="w-full bg-slate-100 border-slate-200 rounded-xl text-sm text-slate-400 h-10 cursor-not-allowed">
											<SelectValue placeholder="Nenhum efeito" />
										</SelectTrigger>
									</Select>
									<PlanRequired text="Efeitos ambientais requerem Premium" />
								</div>
							</FormGroup>
						</div>
					</div>

					<div class="pt-6 border-t border-slate-100 flex justify-end">
						<Button type="submit" :disabled="isSaving">
							{{ isSaving ? 'Salvando...' : 'Salvar Alterações' }}
						</Button>
					</div>

					<div class="space-y-6 pt-6 border-t border-slate-100">
						<div class="flex items-center justify-between">
							<div>
								<h3 class="text-lg font-semibold text-slate-800">Integração Financeira</h3>
								<p class="text-xs text-slate-500">Conecte sua conta Mercado Pago para receber pagamentos.</p>
							</div>
						</div>

						<div class="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
							<div class="flex items-center gap-4">
								<div class="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center">
									<svg class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
										<path
											d="M12 0C5.37 0 0 5.37 0 12c0 6.63 5.37 12 12 12 6.63 0 12-5.37 12-12C24 5.37 18.63 0 12 0zm0 21.6c-5.3 0-9.6-4.3-9.6-9.6 0-5.3 4.3-9.6 9.6-9.6 5.3 0 9.6 4.3 9.6 9.6 0 5.3-4.3 9.6-9.6 9.6z" />
									</svg>
								</div>
								<div>
									<h4 class="font-bold text-slate-900">{{ tenant?.mp_user_id ? "Mercado Pago Conectado" : "Conectar Mercado Pago" }}</h4>
									<p class="text-xs text-slate-500">{{ tenant?.mp_user_id ? "Sua conta está conectada." : "Permita o acesso para receber pagamentos diretamente." }}</p>
								</div>
							</div>

							<div v-if="!tenant?.mp_user_id">
								<Button type="button" @click="connectToMarketPago">
									Conectar Conta
								</Button>
							</div>
							<div v-else>
								<Button type="button" variant="outline" class="text-red-500 hover:text-red-600"
									@click="handleDisconnect">
									Desconectar
								</Button>
							</div>
						</div>
					</div>
				</form>
			</TabsContent>

			<!-- TAB: GALERIA -->
			<TabsContent value="gallery" class="mt-0">
				<div
					class="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
					<div class="flex items-center justify-between border-b border-slate-100 pb-4">
						<div>
							<h3 class="text-lg font-semibold text-slate-800">Galeria de Fotos</h3>
							<p class="text-xs text-slate-500">Compartilhe e gerencie as fotos do casamento.</p>
						</div>
					</div>

					<div v-if="show_gallery" class="space-y-8 pt-2">
						<!-- Gallery Limits Information Alert -->
						<PlanLimitAlert :variant="authStore.isPremium ? 'success' : 'danger'" :icon="Sparkles"
							:title="`Limites da Galeria (Plano ${authStore.isPremium ? 'Premium' : 'Grátis'}):`"
							:button-label="!authStore.isPremium ? 'Aumentar Limites ✨' : undefined"
							@action="activeTab = 'subscription'">
							<template #description>
								<p class="text-xs text-slate-600 mt-0.5 font-light">
									Fotos da Página Inicial: <span class="font-bold text-slate-800">{{ homePrivateImages.length }} / {{
										authStore.isPremium ? 20 : 5 }} fotos</span> |
									Fotos da Galeria Pública: <span class="font-bold text-slate-800">{{ generalGalleryImages.length }} /
										{{ authStore.isPremium ? 'Sem limite' : 50 }} fotos</span>
								</p>
							</template>
						</PlanLimitAlert>
						<FormGroup label="Adicionar Foto">
							<div class="flex flex-col gap-4 p-4 border border-slate-100 rounded-2xl bg-slate-50/50">
								<div class="flex flex-col md:flex-row md:items-center gap-4">
									<span class="text-sm font-medium text-slate-700">Onde exibir a foto?</span>
									<RadioGroup v-model="handleChangeUpload" class="flex items-center gap-6">
										<div class="flex items-center gap-2">
											<RadioGroupItem id="option-private" value="false" />
											<Label for="option-private" class="cursor-pointer text-sm font-normal text-slate-600">Página
												Inicial (Privada)</Label>
										</div>
										<div class="flex items-center gap-2">
											<RadioGroupItem id="option-public" value="true" />
											<Label for="option-public" class="cursor-pointer text-sm font-normal text-slate-600">Galeria Geral
												(Pública)</Label>
										</div>
									</RadioGroup>
								</div>

								<FileUpload :model-value="null" :auto-upload="true" :multiple="true"
									:uploading="isUploadingGalleryImage" @auto-upload="onGalleryImageUpload" :maxSizeMb="2"
									accept="image/*" />
							</div>
						</FormGroup>

						<!-- 1. Fotos da Página Inicial (Privadas) -->
						<div class="space-y-3 pt-2">
							<h4 class="text-sm font-semibold text-slate-800 flex items-center gap-2">
								<span class="w-2 h-2 rounded-full bg-amber-500"></span>
								Fotos da Página Inicial (Privadas)
								<span class="text-xs font-normal text-slate-400">({{ homePrivateImages.length }} fotos)</span>
							</h4>
							<p class="text-xs text-slate-500">Estas fotos aparecem apenas na tela inicial do evento em formato de
								carrossel.</p>
							<ImageGallery v-if="homePrivateImages.length > 0" :images="homePrivateImages" :isAdmin="true"
								@delete="deleteGalleryImage" />
							<div v-else
								class="py-6 text-center text-slate-400 border border-dashed border-slate-100 rounded-2xl bg-slate-50/30 text-sm font-light">
								Nenhuma foto privada adicionada para a Página Inicial.
							</div>
						</div>

						<!-- 2. Fotos da Galeria Geral -->
						<div class="space-y-3 pt-4">
							<h4 class="text-sm font-semibold text-slate-800 flex items-center gap-2">
								<span class="w-2 h-2 rounded-full bg-emerald-500"></span>
								Fotos da Galeria Geral
								<span class="text-xs font-normal text-slate-400">({{ generalGalleryImages.length }} fotos)</span>
							</h4>
							<p class="text-xs text-slate-500">Estas fotos aparecem na galeria general pública de convidados (inclui
								fotos públicas enviadas pelos noivos e fotos enviadas por convidados).</p>
							<ImageGallery v-if="generalGalleryImages.length > 0" :images="generalGalleryImages" :isAdmin="true"
								@delete="deleteGalleryImage" />
							<div v-else
								class="py-6 text-center text-slate-400 border border-dashed border-slate-100 rounded-2xl bg-slate-50/30 text-sm font-light">
								Nenhuma foto adicionada para a Galeria Geral.
							</div>
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
									<div v-for="(faq, index) in faqs" :key="faq.$id" draggable="true"
										@dragstart="onDragStart(index, $event)" @dragover="onDragOver(index, $event)"
										@dragleave="onDragLeave(index)" @dragend="onDragEnd" @drop="onDrop(index)"
										class="p-4 rounded-2xl border flex items-start gap-4 shadow-sm cursor-grab active:cursor-grabbing hover:bg-slate-50 transition-all duration-200"
										:class="[
											draggedIndex === index ? 'opacity-40 border-slate-200 bg-slate-50/50' : '',
											dragOverIndex === index && draggedIndex !== index
												? 'border-dashed border-primary bg-primary/5 scale-[1.01] shadow-md'
												: 'border-slate-100 bg-slate-50/50'
										]">
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
						<form @submit.prevent="addCustomFaq"
							class="lg:col-span-5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4 h-fit">
							<h4 class="text-sm font-semibold text-slate-800">Nova Pergunta</h4>

							<FormGroup label="Pergunta" :error="faqErrors.faqQuestion">
								<Input v-model="faqQuestion" placeholder="Ex: Qual o traje recomendado?"
									class="bg-white border-slate-200 rounded-xl" />
							</FormGroup>

							<FormGroup label="Resposta" :error="faqErrors.faqAnswer">
								<Textarea v-model="faqAnswer" placeholder="Ex: Recomendamos o uso de traje esporte fino..."
									class="bg-white border-slate-200 rounded-xl h-24 resize-none" />
							</FormGroup>

							<Button type="submit" :disabled="isAddingFaq">
								<Loader2 v-if="isAddingFaq" class="w-4 h-4 animate-spin mr-2" />
								Adicionar Pergunta
							</Button>
						</form>
					</div>
					<div v-else class="py-12 text-center text-slate-400 border border-slate-100 rounded-2xl bg-slate-50/30">
						<p class="text-sm font-light">O FAQ está desativado. Ative no interruptor acima para começar a adicionar
							perguntas frequentes.</p>
					</div>
				</div>
			</TabsContent>

			<!-- TAB: CRONOGRAMA -->
			<TabsContent value="schedule" class="mt-0">
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
										<div
											class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
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
												<span
													class="inline-block px-2 py-0.5 bg-primary/10 text-primary font-semibold text-xs rounded-full">
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
						<form @submit.prevent="addCustomSchedule"
							class="lg:col-span-5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4 h-fit">
							<h4 class="text-sm font-semibold text-slate-800">Novo Evento</h4>

							<FormGroup label="Título do Evento" :error="scheduleErrors.scheduleTitle">
								<Input v-model="scheduleTitle" placeholder="Ex: Recepção e Coquetel"
									class="bg-white border-slate-200 rounded-xl" />
							</FormGroup>

							<FormGroup label="Horário" :error="scheduleErrors.scheduleHour">
								<Input v-model="scheduleHour" v-maska data-maska="##:##" placeholder="Ex: 19:30"
									class="bg-white border-slate-200 rounded-xl" />
							</FormGroup>

							<FormGroup label="Descrição" :error="scheduleErrors.scheduleDescription">
								<Textarea v-model="scheduleDescription" placeholder="Ex: Momento para cumprimentar os noivos..."
									class="bg-white border-slate-200 rounded-xl h-20 resize-none" />
							</FormGroup>

							<FormGroup label="Ícone" :error="scheduleErrors.scheduleIcon">
								<Select v-model="scheduleIcon">
									<SelectTrigger
										class="w-full bg-white border-slate-200 rounded-xl text-sm font-light text-slate-600 focus:ring-primary/20 h-10">
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

							<Button type="submit" :disabled="isAddingSchedule">
								<Loader2 v-if="isAddingSchedule" class="w-4 h-4 animate-spin mr-2" />
								Adicionar Evento
							</Button>
						</form>
					</div>
					<div v-else class="py-12 text-center text-slate-400 border border-slate-100 rounded-2xl bg-slate-50/30">
						<p class="text-sm font-light">O cronograma do evento está desativado. Ative no interruptor na aba "Geral"
							para começar a adicionar eventos.</p>
					</div>
				</div>
			</TabsContent>

			<!-- TAB: ASSINATURA -->
			<TabsContent value="subscription" class="mt-0">
				<div
					class="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-8">
					<div class="flex items-center justify-between border-b border-slate-100 pb-4">
						<div>
							<h3 class="text-lg font-semibold text-slate-800">Assinatura Premium</h3>
							<p class="text-xs text-slate-500">Ative os recursos exclusivos da plataforma para o seu casamento.</p>
						</div>
					</div>

					<!-- Status da Assinatura -->
					<PlanLimitAlert v-if="authStore.isPremium" variant="success" :icon="Sparkles" icon-effect="pulse"
						title="Seu Plano é Premium! ✨">
						<template #description>
							<p v-if="tenant?.premium_until" class="text-xs text-slate-600 mt-0.5 font-light">
								Aproveite todos os recursos exclusivos liberados em seu plano, válido até <span
									class="font-semibold text-slate-950">{{
										dayjs(tenant.premium_until).format('DD/MM/YYYY') }}</span>.
							</p>
						</template>
						<template #actions>
							<div
								class="bg-white px-4 py-2 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-600 uppercase tracking-widest text-center shadow-sm">
								Plano Ativo
							</div>
						</template>
					</PlanLimitAlert>

					<div v-else class="space-y-8">
						<!-- Banner de Upgrade -->
						<PlanLimitAlert variant="premium" :icon="Sparkles" title="Desbloqueie todo o potencial da sua lista"
							description="Aproveite recursos exclusivos como paleta de cores customizada, contagem regressiva, convidados ilimitados e relatórios completos." />

						<!-- Lista de Planos -->
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
							<!-- Plano Trimestral -->
							<div
								class="border border-slate-150 rounded-2xl p-6 bg-white hover:border-slate-300 transition-all flex flex-col justify-between shadow-sm">
								<div class="space-y-4">
									<div>
										<h5 class="font-bold text-lg text-slate-900">Plano Trimestral</h5>
										<p class="text-slate-500 text-xs mt-0.5">Ideal para casamentos próximos</p>
									</div>
									<div class="text-3xl font-bold text-slate-900 font-serif">R$ 79,99 <span
											class="text-xs font-normal text-slate-400">/ 3 meses</span></div>
									<ul class="space-y-2.5 pt-4 border-t border-slate-100 text-sm text-slate-600">
										<li class="flex items-center gap-2">
											<CheckCircle class="w-4 h-4 text-emerald-500" /> Cores de tema personalizadas
										</li>
										<li class="flex items-center gap-2">
											<CheckCircle class="w-4 h-4 text-emerald-500" /> RSVP e Convidados ilimitados
										</li>
										<li class="flex items-center gap-2">
											<CheckCircle class="w-4 h-4 text-emerald-500" /> Galeria: máx 20 fotos Home / públicas ilimitadas
										</li>
										<li class="flex items-center gap-2">
											<CheckCircle class="w-4 h-4 text-emerald-500" /> Contagem regressiva active
										</li>
										<li class="flex items-center gap-2">
											<CheckCircle class="w-4 h-4 text-emerald-500" /> Exportação de planilhas de convidados
										</li>
									</ul>
								</div>
								<Button type="button" @click="openCheckout('quarterly')"
									class="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
									Assinar Trimestral
								</Button>
							</div>

							<!-- Plano Semestral -->
							<div
								class="border-2 border-rose-500 rounded-2xl p-6 bg-white shadow-md shadow-rose-50/50 flex flex-col justify-between">
								<div class="space-y-4">
									<div class="flex justify-between items-start">
										<div>
											<h5 class="font-bold text-lg text-rose-600">Plano Semestral</h5>
											<p class="text-slate-500 text-xs mt-0.5">Mais tempo para planejar</p>
										</div>
										<span
											class="bg-rose-100 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Melhor
											Valor</span>
									</div>
									<div class="text-3xl font-bold text-slate-900 font-serif">R$ 159,99 <span
											class="text-xs font-normal text-slate-400">/ 6 meses</span></div>
									<ul class="space-y-2.5 pt-4 border-t border-slate-100 text-sm text-slate-600">
										<li class="flex items-center gap-2">
											<CheckCircle class="w-4 h-4 text-rose-500" /> Todos os recursos liberados
										</li>
										<li class="flex items-center gap-2">
											<CheckCircle class="w-4 h-4 text-rose-500" /> Galeria: máx 20 fotos Home / públicas ilimitadas
										</li>
										<li class="flex items-center gap-2">
											<CheckCircle class="w-4 h-4 text-rose-500" /> Paletas e logotipo customizados
										</li>
										<li class="flex items-center gap-2">
											<CheckCircle class="w-4 h-4 text-rose-500" /> Suporte prioritário via WhatsApp
										</li>
										<li class="flex items-center gap-2">
											<CheckCircle class="w-4 h-4 text-rose-500" /> Exportações e controle estendido
										</li>
									</ul>
								</div>
								<Button type="button" @click="openCheckout('semestral')"
									class="w-full mt-6 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-sm">
									Assinar Semestral
								</Button>
							</div>
						</div>
					</div>
				</div>
			</TabsContent>
		</Tabs>
	</div>

	<!-- MOCK MERCADO PAGO CHECKOUT PRO MODAL -->
	<Modal v-model:open="showCheckoutModal" title="Checkout Mercado Pago"
		description="Finalize seu pagamento de forma segura via Mercado Pago.">
		<div class="space-y-6 pt-4">
			<div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
				<div class="flex justify-between items-center text-sm">
					<span class="text-slate-500">Produto:</span>
					<span class="font-bold text-slate-800">Wedding Gift Premium ({{ selectedPlan === 'quarterly' ? 'Trimestral' :
						'Semestral' }})</span>
				</div>
				<div class="flex justify-between items-center text-sm">
					<span class="text-slate-500">Valor:</span>
					<span class="font-bold text-slate-800">R$ {{ selectedPlan === 'quarterly' ? '79,99' : '159,99' }}</span>
				</div>
			</div>

			<div
				class="flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
				<div
					class="w-40 h-40 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 relative overflow-hidden">
					<svg class="w-32 h-32 text-slate-800" viewBox="0 0 24 24" fill="none" stroke="currentColor"
						stroke-width="1.5">
						<rect x="2" y="2" width="6" height="6" rx="1" />
						<rect x="16" y="2" width="6" height="6" rx="1" />
						<rect x="2" y="16" width="6" height="6" rx="1" />
						<path d="M6 9v2M9 6h2M18 9v2M15 6h1M9 18v2M6 15h2M18 18v4M15 15h3M21 15v1M15 21h3" />
					</svg>
					<div class="absolute inset-0 bg-slate-900/5 flex items-center justify-center">
						<span
							class="bg-white/95 px-3 py-1 rounded-full text-[10px] font-bold text-sky-600 shadow border border-sky-100">Mercado
							Pago Pix</span>
					</div>
				</div>
				<span class="text-xs text-slate-500 text-center max-w-xs leading-relaxed font-light">
					Escaneie o QR Code acima com o app do seu banco para pagar com Pix. O acesso é liberado instantaneamente.
				</span>
			</div>

			<div class="space-y-3">
				<Button type="button" @click="handleConfirmSimulatedPayment" :disabled="isSimulatingPayment"
					class="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md">
					<Loader2 v-if="isSimulatingPayment" class="w-4 h-4 animate-spin mr-2" />
					Simular Confirmação de Pagamento (Mercado Pago)
				</Button>
				<Button type="button" variant="ghost" @click="showCheckoutModal = false" class="w-full text-slate-500">
					Cancelar
				</Button>
			</div>
		</div>
	</Modal>
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
