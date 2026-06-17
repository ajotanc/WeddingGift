<script setup lang="ts">
import Combobox from "@/components/reusable/Combobox.vue";
import FormGroup from "@/components/reusable/FormGroup.vue";
import Modal from "@/components/reusable/Modal.vue";
import PageHeader from "@/components/reusable/PageHeader.vue";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm/useConfirm";
import { Input } from "@/components/ui/input";
import ProductGallery from "@/components/ui/ProductGallery.vue";
import { useTenant } from "@/composables/useTenant";
import { formatMoney } from "@/lib/money";
import {
	type IProduct,
	type IProductLink,
	ProductService,
	type ProductType,
} from "@/services/product.service";
import { useAuthStore } from "@/stores/auth";
import type { SerperItem } from "@/types";
import { toTypedSchema } from "@vee-validate/zod";
import { ExternalLink, Plus, Search, UploadCloud, X } from "lucide-vue-next";
import { useForm } from "vee-validate";
import { computed, ref } from "vue";
import { toast } from "vue-sonner";
import { z } from "zod";

const { confirm } = useConfirm();
const { tenant, products } = useTenant();
const authStore = useAuthStore();

const PREDEFINED_CATEGORIES = [
	"Cozinha",
	"Decoração",
	"Eletrônicos",
	"Cama, Mesa e Banho",
	"Eletrodomésticos",
	"Viagem",
	"Experiências",
	"Móveis",
];

const categoryOptions = computed(() => {
	return [
		...PREDEFINED_CATEGORIES.map((c) => ({ label: c, value: c })),
		{ label: "Outro", value: "Outro" },
	];
});

const KNOWN_STORES = [
	{ key: "amazon", name: "Amazon" },
	{ key: "mercadolivre", name: "Mercado Livre" },
	{ key: "mercadopago", name: "Mercado Pago" },
	{ key: "magazineluiza", name: "Magazine Luiza" },
	{ key: "magalu", name: "Magazine Luiza" },
	{ key: "americanas", name: "Americanas" },
	{ key: "submarino", name: "Submarino" },
	{ key: "shoptime", name: "Shoptime" },
	{ key: "casasbahia", name: "Casas Bahia" },
	{ key: "pontofrio", name: "Ponto Frio" },
	{ key: "extra", name: "Extra" },
	{ key: "fastshop", name: "Fast Shop" },
	{ key: "carrefour", name: "Carrefour" },
	{ key: "electrolux", name: "Electrolux" },
	{ key: "brastemp", name: "Brastemp" },
	{ key: "consul", name: "Consul" },
	{ key: "samsung", name: "Samsung" },
	{ key: "lg", name: "LG" },
	{ key: "polishop", name: "Polishop" },
	{ key: "kabum", name: "KaBuM!" },
	{ key: "pichau", name: "Pichau" },
	{ key: "terabyte", name: "Terabyte" },
	{ key: "camicado", name: "Camicado" },
	{ key: "tokstok", name: "Tok&Stok" },
	{ key: "leroymerlin", name: "Leroy Merlin" },
	{ key: "shopee", name: "Shopee" },
	{ key: "aliexpress", name: "AliExpress" },
	{ key: "shein", name: "Shein" },
];

const editProductId = ref<string | null>(null);

const productSchema = z
	.object({
		name: z.string().min(1, "O nome é obrigatório."),
		categorySelect: z.string().optional(),
		categoryCustom: z.string().optional(),
	})
	.refine((data) => data.categorySelect || data.categoryCustom, {
		message: "Selecione ou informe uma categoria.",
		path: ["categorySelect"],
	});

const physicalValidationSchema = toTypedSchema(
	productSchema.and(
		z.object({
			price: z.coerce
				.number()
				.min(0.01, "O valor deve ser maior que zero."),
			desiredQuantity: z.coerce
				.number()
				.min(1, "A quantidade deve ser maior que zero.")
				.default(1),
		}),
	),
);

const quotaValidationSchema = toTypedSchema(
	productSchema.and(
		z.object({
			price: z.coerce
				.number()
				.min(0.01, "A meta total deve ser maior que zero."),
			desiredQuantity: z.coerce
				.number()
				.min(1, "A quantidade deve ser maior que zero.")
				.default(1),
		}),
	),
);

type ProductFormValues = {
	name: string;
	price: number;
	desiredQuantity: number;
	categorySelect?: string;
	categoryCustom?: string;
};

// --- Physical Form ---
const showPhysicalModal = ref(false);

const {
	handleSubmit: handlePhysicalSubmit,
	errors: physicalErrors,
	defineField: definePhysicalField,
	setValues: setPhysicalValues,
	resetForm: resetPhysicalForm,
} = useForm<ProductFormValues>({
	validationSchema: physicalValidationSchema,
	initialValues: {
		name: "",
		price: 0,
		desiredQuantity: 1,
		categorySelect: "",
		categoryCustom: "",
	},
});

const [pName] = definePhysicalField("name");
const [pPrice] = definePhysicalField("price");
const [pDesiredQuantity] = definePhysicalField("desiredQuantity");
const [pCategorySelect] = definePhysicalField("categorySelect");
const [pCategoryCustom] = definePhysicalField("categoryCustom");

const pLinks = ref<IProductLink[]>([]);
const pImageBase64 = ref("");
const pImageFile = ref<File | null>(null);

const isSearchingLinks = ref(false);
const searchResults = ref<SerperItem[]>([]);

const handleImageUpload = (event: Event) => {
	const file = (event.target as HTMLInputElement).files?.[0];
	if (file) {
		pImageFile.value = file;
		pImageBase64.value = URL.createObjectURL(file);
	}
};

const handleDrop = (event: DragEvent) => {
	const file = event.dataTransfer?.files?.[0];
	if (file) {
		pImageFile.value = file;
		pImageBase64.value = URL.createObjectURL(file);
	}
};

const triggerFileInput = () => {
	const fileInput = document.getElementById("file-upload") as HTMLInputElement;
	if (fileInput) fileInput.click();
};

const removeImage = () => {
	pImageBase64.value = "";
	pImageFile.value = null;
};

const openNewPhysical = () => {
	editProductId.value = null;
	resetPhysicalForm();
	pLinks.value = [];
	pImageBase64.value = "";
	pImageFile.value = null;
	showPhysicalModal.value = true;
};

const editPhysical = (p: IProduct) => {
	editProductId.value = p.$id;
	const isPredefined = p.category && PREDEFINED_CATEGORIES.includes(p.category);

	setPhysicalValues({
		name: p.name,
		price: Number(p.price) || 0,
		desiredQuantity: p.desired_quantity || 1,
		categorySelect: isPredefined ? p.category || "" : p.category ? "Outro" : "",
		categoryCustom: !isPredefined && p.category ? p.category : "",
	});

	pLinks.value = p.links || [];
	pImageBase64.value = p.image_url ?? "";
	pImageFile.value = null;

	showPhysicalModal.value = true;
};

const searchExternalLinks = async () => {
	if (!pName.value) {
		toast.info("Aviso", { description: "Preencha o nome do produto para buscar os links." });
		return;
	}
	isSearchingLinks.value = true;
	searchResults.value = [];

	try {
		const response = await fetch("https://google.serper.dev/search", {
			method: "POST",
			headers: {
				"X-API-KEY": import.meta.env.VITE_SERPAPI_KEY,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				q: pName.value,
				gl: "br",
				hl: "pt-br",
			}),
		});

		const data = await response.json();
		if (data?.organic?.length > 0) {
			searchResults.value = data.organic.map((item: Record<string, string>) => {
				let extractedSource = item.source || "LOJA";
				if (item.link) {
					const lowerLink = item.link.toLowerCase();
					const knownStore = KNOWN_STORES.find((s) =>
						lowerLink.includes(s.key),
					);

					if (knownStore) {
						extractedSource = knownStore.name;
					} else {
						try {
							const urlObj = new URL(item.link);
							const hostParts = urlObj.hostname
								.replace(/^www\./, "")
								.split(".");
							if (hostParts.length > 0 && hostParts[0]) {
								extractedSource = hostParts[0].toUpperCase();
							} else {
								const match = item.link.match(/www\.([^.]+)\./);
								if (match?.[1]) {
									extractedSource = match[1].toUpperCase();
								} else {
									extractedSource = "LOJA";
								}
							}
						} catch (e) {
							extractedSource = "LOJA";
						}
					}
				}
				return {
					...item,
					source: extractedSource,
				};
			});
		} else {
			toast({
				title: "Aviso",
				description: "Nenhum link encontrado para este produto.",
				variant: "default",
			});
		}
	} catch (err) {
		console.error(err);
		toast({
			title: "Erro",
			description: "Falha ao buscar links. Verifique a conexão.",
			variant: "destructive",
		});
	} finally {
		isSearchingLinks.value = false;
	}
};

const addLinkToProduct = (item: SerperItem) => {
	pLinks.value.push({
		store: item.source || "Loja",
		url: item.link,
	} as IProductLink);
	searchResults.value = searchResults.value.filter(
		(res) => res.link !== item.link,
	);
	toast({ title: "Adicionado", description: "Link adicionado ao produto!" });
};

const removeLink = (index: number) => {
	pLinks.value.splice(index, 1);
};

const productSubmit = handlePhysicalSubmit(async (values) => {
	if (!tenant.value || !authStore.user) return;

	const finalCategory =
		values.categorySelect === "Outro"
			? values.categoryCustom
			: values.categorySelect;

	const payload = {
		tenant: tenant.value.$id,
		type: "physical" as ProductType,
		name: values.name,
		price: String(values.price),
		desired_quantity: values.desiredQuantity,
		claimed_quantity: 0,
		links: pLinks.value,
		category: finalCategory,
	};

	const newProduct = await ProductService.upsert(
		editProductId.value,
		payload,
		pImageFile.value,
	);

	const productIndex = products.value.findIndex(
		(p) => p.$id === newProduct.$id,
	);

	if (productIndex !== -1) {
		products.value[productIndex] = newProduct;
	} else {
		products.value.push(newProduct);
	}

	toast({
		title: "Sucesso",
		description: "Produto salvo com sucesso!",
	});

	showPhysicalModal.value = false;
});

// --- Quota Form ---
const showQuotaModal = ref(false);

const {
	handleSubmit: handleQuotaSubmit,
	errors: quotaErrors,
	defineField: defineQuotaField,
	setValues: setQuotaValues,
	resetForm: resetQuotaForm,
	values: quotaValues,
} = useForm<ProductFormValues>({
	validationSchema: quotaValidationSchema,
	initialValues: {
		name: "",
		price: 0,
		desiredQuantity: 1,
		categorySelect: "",
		categoryCustom: "",
	},
});

const [qName] = defineQuotaField("name");
const [qPrice] = defineQuotaField("price");
const [qDesiredQuantity] = defineQuotaField("desiredQuantity");
const [qCategorySelect] = defineQuotaField("categorySelect");
const [qCategoryCustom] = defineQuotaField("categoryCustom");

const qImageBase64 = ref("");
const qImageFile = ref<File | null>(null);

const handleQuotaImageUpload = (event: Event) => {
	const file = (event.target as HTMLInputElement).files?.[0];
	if (file) {
		qImageFile.value = file;
		qImageBase64.value = URL.createObjectURL(file);
	}
};

const handleQuotaDrop = (event: DragEvent) => {
	const file = event.dataTransfer?.files?.[0];
	if (file) {
		qImageFile.value = file;
		qImageBase64.value = URL.createObjectURL(file);
	}
};

const triggerQuotaFileInput = () => {
	const fileInput = document.getElementById(
		"quota-file-upload",
	) as HTMLInputElement;
	if (fileInput) fileInput.click();
};

const removeQuotaImage = () => {
	qImageBase64.value = "";
	qImageFile.value = null;
};

const openNewQuota = () => {
	editProductId.value = null;
	resetQuotaForm();
	qImageBase64.value = "";
	qImageFile.value = null;
	showQuotaModal.value = true;
};

const editQuota = (p: IProduct) => {
	editProductId.value = p.$id;
	const isPredefined = p.category && PREDEFINED_CATEGORIES.includes(p.category);

	setQuotaValues({
		name: p.name,
		price: Number(p.price) || 0,
		desiredQuantity: p.desired_quantity || 1,
		categorySelect: isPredefined ? p.category || "" : p.category ? "Outro" : "",
		categoryCustom: !isPredefined && p.category ? p.category : "",
	});

	qImageBase64.value = p.image_url ?? "";
	qImageFile.value = null;

	showQuotaModal.value = true;
};

const quotaSubmit = handleQuotaSubmit(async (values) => {
	if (!tenant.value || !authStore.user) return;

	const finalCategory =
		values.categorySelect === "Outro"
			? values.categoryCustom
			: values.categorySelect;

	const payload = {
		tenant: tenant.value.$id,
		type: "quota" as ProductType,
		name: values.name,
		price: String(values.price),
		desired_quantity: values.desiredQuantity,
		claimed_quantity: 0,
		category: finalCategory,
	};

	const newQuota = await ProductService.upsert(
		editProductId.value,
		payload,
		qImageFile.value,
	);

	const quotaIndex = products.value.findIndex((p) => p.$id === newQuota.$id);

	if (quotaIndex !== -1) {
		products.value[quotaIndex] = newQuota;
	} else {
		products.value.push(newQuota);
	}

	toast({
		title: "Sucesso",
		description: "Cota salva com sucesso!",
	});

	showQuotaModal.value = false;
});

const deleteProduct = async (product: IProduct) => {
	confirm({
		title: product.name,
		description: "Tem certeza de que deseja excluir este item? Esta ação não pode ser desfeita.",
		confirmText: "Sim, excluir",
		cancelText: "Não",
		confirm: async () => {
			await ProductService.delete(product.$id);
			products.value = products.value.filter((p) => p.$id !== product.$id);
			toast.success("Sucesso", { description: "Item excluído com sucesso!" });
		},
	});
};
</script>

<template>
	<div class="space-y-12">
		<!-- Header -->
		<PageHeader title="Lista de Presentes" description="Gerencie produtos físicos e cotas financeiras.">
			<Button @click="openNewQuota">Nova Cota (PIX)</Button>
			<Button @click="openNewPhysical" variant="outline">Novo
				Produto</Button>
		</PageHeader>

		<!-- Products Gallery -->
		<ProductGallery :products="products" :tenant="tenant" mode="admin"
			@edit="(p: IProduct) => p.type === 'quota' ? editQuota(p) : editPhysical(p)" @delete="deleteProduct" />

		<!-- Modals -->
		<!-- Physical Modal -->
		<Modal v-model:open="showPhysicalModal" :title="editProductId ? 'Editar Produto Físico' : 'Novo Produto Físico'"
			class="max-w-2xl">
			<div class="space-y-5 max-h-[60vh] overflow-y-auto py-4">
				<FormGroup label="Nome do Produto" :error="physicalErrors.name">
					<Input v-model="pName" placeholder="Ex: Jogo de Panelas Tramontina" />
				</FormGroup>

				<FormGroup label="Categoria" :error="physicalErrors.categorySelect">
					<Combobox v-model="pCategorySelect" :options="categoryOptions" placeholder="Selecione a categoria..."
						emptyText="Nenhuma categoria..." />
				</FormGroup>

				<FormGroup v-if="pCategorySelect === 'Outro'" label="Qual categoria?" :error="physicalErrors.categoryCustom">
					<Input v-model="pCategoryCustom" placeholder="Ex: Eletroportáteis" class="bg-slate-50/50" />
				</FormGroup>

				<div class="grid grid-cols-2 gap-4">
					<FormGroup label="Preço Unitário Estimado" :error="physicalErrors.price">
						<Input v-model.number="pPrice" type="number" step="0.01" placeholder="Ex: 150.00" />
					</FormGroup>
					<FormGroup label="Quantidade" :error="physicalErrors.desiredQuantity">
						<Input v-model.number="pDesiredQuantity" type="number" min="1" />
					</FormGroup>
				</div>

				<FormGroup label="Imagem do Produto">
					<div v-if="!pImageBase64" @dragover.prevent @dragenter.prevent @drop.prevent="handleDrop"
						@click="triggerFileInput"
						class="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 hover:bg-slate-50 transition-colors">
						<UploadCloud class="w-8 h-8 text-slate-400 mb-2" stroke-width="1.5" />
						<p class="text-sm text-slate-600 font-medium">Clique ou arraste até aqui</p>
						<input type="file" id="file-upload" accept="image/*" @change="handleImageUpload" class="hidden" />
					</div>
					<div v-else
						class="relative bg-slate-50 rounded-2xl p-4 aspect-video flex items-center justify-center border border-slate-100">
						<img :src="pImageBase64" class="max-h-full object-contain" />
						<button @click.stop="removeImage"
							class="absolute top-2 right-2 bg-white shadow rounded-full p-2 text-slate-500 hover:text-red-500">
							<X class="w-4 h-4" stroke-width="2.5" />
						</button>
					</div>
				</FormGroup>
				<FormGroup label="Links Externos (Lojas)">
					<div v-if="pLinks.length > 0" class="space-y-2 mb-2">
						<div v-for="(link, idx) in pLinks" :key="idx"
							class="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-xl">
							<div class="w-8 h-8 rounded bg-slate-200 flex items-center justify-center text-slate-400">
								<ExternalLink class="w-4 h-4" />
							</div>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium text-slate-900 truncate">{{ link.store }}</p>
							</div>
							<Button variant="ghost" size="sm" class="text-red-500 hover:text-red-600 hover:bg-red-50"
								@click="removeLink(idx)">
								<X class="w-4 h-4" />
							</Button>
						</div>
					</div>

					<div v-if="searchResults.length > 0"
						class="space-y-2 mt-4 p-4 border border-primary/20 bg-primary/5 rounded-xl">
						<h4 class="text-xs font-bold text-primary uppercase tracking-wider mb-3">Resultados da Busca (Serper)</h4>
						<div v-for="(res, idx) in searchResults" :key="idx"
							class="flex items-center gap-3 p-2 bg-white rounded-lg shadow-sm">
							<div class="flex-1 min-w-0">
								<p class="text-xs font-medium text-slate-900 truncate" :title="res.title">{{ res.title }}</p>
								<p class="text-[10px] text-slate-500">{{ res.source }}</p>
							</div>
							<Button size="sm" variant="outline" class="h-7 text-xs px-2" @click="addLinkToProduct(res)">
								<Plus class="w-3 h-3 mr-1" /> Add
							</Button>
						</div>
					</div>
					<div v-else-if="pLinks.length === 0"
						class="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
						Nenhum link adicionado. Use a busca abaixo para encontrar ofertas.
					</div>
				</FormGroup>
			</div>
			<div class="pt-4 border-t border-slate-100 flex gap-3">
				<Button variant="outline" class="flex-1" @click="searchExternalLinks" :disabled="isSearchingLinks">
					{{ isSearchingLinks ? 'Buscando...' : 'Buscar Links (Google)' }}
				</Button>
				<Button class="flex-1" @click="productSubmit">Salvar</Button>
			</div>
		</Modal>

		<!-- Quota Modal -->
		<Modal v-model:open="showQuotaModal" :title="editProductId ? 'Editar Cota PIX' : 'Nova Cota (PIX)'"
			class="max-w-2xl">
			<div class="space-y-5 max-h-[60vh] overflow-y-auto py-4">
				<FormGroup label="Nome da Experiência" :error="quotaErrors.name">
					<Input v-model="qName" placeholder="Ex: Jantar Romântico" />
				</FormGroup>

				<FormGroup label="Categoria" :error="quotaErrors.categorySelect">
					<Combobox v-model="qCategorySelect" :options="categoryOptions" placeholder="Selecione a categoria..."
						emptyText="Nenhuma categoria..." />
				</FormGroup>

				<FormGroup v-if="qCategorySelect === 'Outro'" label="Qual categoria?" :error="quotaErrors.categoryCustom">
					<Input v-model="qCategoryCustom" placeholder="Ex: Experiências de Viagem" class="bg-slate-50/50" />
				</FormGroup>

				<div class="grid grid-cols-2 gap-4">
					<FormGroup label="Valor da Cota (R$)" :error="quotaErrors.price">
						<Input v-model.number="qPrice" type="number" step="0.01" placeholder="Ex: 400.00" />
					</FormGroup>
					<FormGroup label="Quantidade de Cotas" :error="quotaErrors.desiredQuantity">
						<Input v-model.number="qDesiredQuantity" type="number" placeholder="Ex: 5" />
					</FormGroup>
				</div>

				<div v-if="(Number(quotaValues.price) || 0) > 0 && (Number(quotaValues.desiredQuantity) || 0) > 0"
					class="bg-primary/5 text-primary text-sm font-medium p-3 rounded-xl border border-primary/10 flex justify-between items-center">
					<span>Valor da Cota Individual:</span>
					<span class="text-base font-bold">{{ formatMoney((Number(quotaValues.price) || 0) /
						(Number(quotaValues.desiredQuantity) || 1)) }}</span>
				</div>

				<FormGroup label="Imagem Inspiracional">
					<div v-if="!qImageBase64" @dragover.prevent @dragenter.prevent @drop.prevent="handleQuotaDrop"
						@click="triggerQuotaFileInput"
						class="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 hover:bg-slate-50 transition-colors">
						<UploadCloud class="w-8 h-8 text-slate-400 mb-2" stroke-width="1.5" />
						<p class="text-sm text-slate-600 font-medium">Clique ou arraste até aqui</p>
						<input type="file" id="quota-file-upload" accept="image/*" @change="handleQuotaImageUpload"
							class="hidden" />
					</div>
					<div v-else
						class="relative bg-slate-50 rounded-2xl p-4 aspect-video flex items-center justify-center border border-slate-100">
						<img :src="qImageBase64" class="max-h-full object-contain" />
						<button @click.stop="removeQuotaImage"
							class="absolute top-2 right-2 bg-white shadow rounded-full p-2 text-slate-500 hover:text-red-500">
							<X class="w-4 h-4" stroke-width="2.5" />
						</button>
					</div>
				</FormGroup>
			</div>
			<div class="pt-4 border-t border-slate-100 flex gap-3">
				<Button class="flex-1" @click="quotaSubmit">Salvar</Button>
			</div>
		</Modal>
	</div>
</template>
