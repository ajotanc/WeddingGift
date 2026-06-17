<script setup lang="ts">
import { useToast } from "@/components/ui/toast/use-toast";
import { useTenant } from "@/composables/useTenant";
import { TenantService } from "@/services/tenant.service";
import { useAuthStore } from "@/stores/auth";
import { ref, watch } from "vue";
import "@vueup/vue-quill/dist/vue-quill.snow.css";
import { StorageService } from "@/services/storage.service";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import * as z from "zod";
import PageHeader from "@/components/reusable/PageHeader.vue";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import FormGroup from "@/components/reusable/FormGroup.vue";
import { InputGroup, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Loader2 } from "lucide-vue-next";
import DatePicker from "@/components/reusable/DatePicker.vue";
import LocationAutocomplete from "@/components/ui/LocationAutocomplete.vue";
import { Button } from "@/components/ui/button";

const { toast } = useToast();
const { tenant } = useTenant();
const authStore = useAuthStore();

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
			primary_color: "#ec4899",
			background_color: "#ffffff",
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
const [primary_color] = defineField("primary_color");
const [background_image] = defineField("background_image");
const [background_color] = defineField("background_color");

const isSaving = ref(false);

const loadSettings = () => {
	if (tenant.value) {
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
			.toLowerCase()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
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
	<div class="space-y-12 w-full">
		<!-- Header -->
		<PageHeader title="Configurações Gerais" description="Personalize o seu site de casamento." />

		<form @submit.prevent="saveSettings"
			class="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-8">

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
				<p class="text-xs text-slate-500 mb-1">Escreva um texto especial contando a história de vocês. Ele aparecerá na
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

				<FormGroup label="Limite de Convidados" :error="errors.guest_limit">
					<Input type="number" v-model.number="guest_limit" min="0" class="bg-slate-50/50" />
				</FormGroup>

				<FormGroup label="Cor Principal (Tema)">
					<div class="flex items-center gap-4">
						<Input type="color" v-model="primary_color" class="w-12 h-12 rounded cursor-pointer border-0 p-0" />
						<span class="text-sm font-medium text-slate-600">{{ primary_color }}</span>
					</div>
				</FormGroup>

				<FormGroup label="Cor do Cabeçalho do Dashboard" :error="errors.background_color">
					<Input type="color" v-model="background_color" class="w-12 h-12 rounded cursor-pointer border-0 p-0" />
				</FormGroup>

				<FormGroup label="Imagem de Fundo" class="md:col-span-2" :error="errors.background_image">
					<div class="flex flex-col gap-4">
						<Input v-model="background_image" placeholder="URL da imagem (Ex: https://example.com/bg.jpg)"
							class="bg-slate-50/50" />
						<div class="flex items-center gap-4">
							<span class="text-sm text-slate-500 font-medium">Ou faça o upload:</span>
							<Input type="file" @change="onFileSelect" accept="image/*"
								class="text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
						</div>
						<img v-if="background_image" :src="background_image"
							class="w-full max-w-sm rounded-xl border border-slate-200 mt-2 object-cover aspect-video" />
					</div>
				</FormGroup>
			</div>

			<div class="pt-6 border-t border-slate-100 flex justify-end">
				<Button type="submit" :disabled="isSaving" class="px-10">
					{{ isSaving ? 'Salvando...' : 'Salvar Alterações' }}
				</Button>
			</div>
		</form>
	</div>
</template>
