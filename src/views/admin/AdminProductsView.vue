<script setup lang="ts">
import Combobox from "@/components/reusable/Combobox.vue";
import FileUpload from "@/components/reusable/FileUpload.vue";
import FormGroup from "@/components/reusable/FormGroup.vue";
import Modal from "@/components/reusable/Modal.vue";
import PageHeader from "@/components/reusable/PageHeader.vue";
import ProductGallery from "@/components/ui/ProductGallery.vue";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm/useConfirm";
import { Input } from "@/components/ui/input";
import { useProductSearch } from "@/composables/useProductSearch";
import { useTenant } from "@/composables/useTenant";
import { formatMoney } from "@/lib/money";
import {
	type IProduct,
	type IProductLink,
	ProductService,
	type ProductType,
} from "@/services/product.service";
import { useAuthStore } from "@/stores/auth";
import { toTypedSchema } from "@vee-validate/zod";
import { ExternalLink, Plus, X } from "lucide-vue-next";
import { useForm } from "vee-validate";
import { computed, ref, watch } from "vue";
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

const PREDEFINED_EXPERIENCES = [
	{ name: "Jogo de panelas moderno", price: 500, qty: 1, category: "Cozinha" },
	{
		name: "Relógio da noiva sem atrasos",
		price: 350,
		qty: 1,
		category: "Outro",
	},
	{
		name: "Contribuição para Lua de Mel",
		price: 1000,
		qty: 5,
		category: "Viagem",
	},
	{
		name: "1º lugar na fila do buffet",
		price: 150,
		qty: 2,
		category: "Experiências",
	},
	{ name: "Calmante para os noivos", price: 60, qty: 4, category: "Outro" },
	{
		name: "Dancinha do TikTok com o casal",
		price: 100,
		qty: 3,
		category: "Experiências",
	},
	{
		name: "Passagem aérea classe econômica",
		price: 1200,
		qty: 2,
		category: "Viagem",
	},
	{ name: "Upgrade de assento no voo", price: 300, qty: 2, category: "Viagem" },
	{ name: "Diária em hotel de luxo", price: 700, qty: 3, category: "Viagem" },
	{
		name: "Jantar romântico a dois",
		price: 450,
		qty: 1,
		category: "Experiências",
	},
	{
		name: "Garrafa de vinho especial",
		price: 250,
		qty: 2,
		category: "Experiências",
	},
	{
		name: "Drinks refrescantes na piscina",
		price: 150,
		qty: 4,
		category: "Experiências",
	},
	{
		name: "Café da manhã na piscina",
		price: 200,
		qty: 1,
		category: "Experiências",
	},
	{
		name: "Aluguel de carro conversível",
		price: 600,
		qty: 2,
		category: "Viagem",
	},
	{
		name: "Massagem relaxante pós-festa",
		price: 350,
		qty: 2,
		category: "Experiências",
	},
	{
		name: "Passeio de helicóptero",
		price: 1500,
		qty: 1,
		category: "Experiências",
	},
	{
		name: "Voo de balão panorâmico",
		price: 900,
		qty: 1,
		category: "Experiências",
	},
	{
		name: "Ingressos para museu local",
		price: 120,
		qty: 2,
		category: "Experiências",
	},
	{
		name: "Jantar exótico de lua de mel",
		price: 350,
		qty: 1,
		category: "Experiências",
	},
	{
		name: "Mergulho com tubarões",
		price: 800,
		qty: 1,
		category: "Experiências",
	},
	{
		name: "Guia turístico local",
		price: 180,
		qty: 1,
		category: "Experiências",
	},
	{
		name: "Kit protetor solar fator 100",
		price: 100,
		qty: 1,
		category: "Viagem",
	},
	{
		name: "Kit ressaca pós-casamento",
		price: 80,
		qty: 2,
		category: "Experiências",
	},
	{
		name: "Seguro viagem internacional",
		price: 250,
		qty: 1,
		category: "Viagem",
	},
	{
		name: "Café da manhã na cama",
		price: 120,
		qty: 2,
		category: "Experiências",
	},
	{
		name: "Lanche rápido no aeroporto",
		price: 110,
		qty: 2,
		category: "Viagem",
	},
	{
		name: "Chá da tarde especial",
		price: 160,
		qty: 2,
		category: "Experiências",
	},
	{
		name: "Passeio romântico de barco",
		price: 400,
		qty: 1,
		category: "Experiências",
	},
	{
		name: "Ingressos para parque de diversão",
		price: 500,
		qty: 2,
		category: "Experiências",
	},
	{
		name: "Aluguel de bicicleta dupla",
		price: 140,
		qty: 1,
		category: "Experiências",
	},
	{
		name: "Curso rápido de culinária",
		price: 300,
		qty: 1,
		category: "Experiências",
	},
	{
		name: "Fundo de reserva de viagem",
		price: 500,
		qty: 1,
		category: "Viagem",
	},
	{
		name: "Ajuda com pedágios na viagem",
		price: 150,
		qty: 1,
		category: "Viagem",
	},
	{
		name: "Degustação de cervejas",
		price: 200,
		qty: 2,
		category: "Experiências",
	},
	{
		name: "Diária em resort all-inclusive",
		price: 900,
		qty: 2,
		category: "Viagem",
	},
	{
		name: "Passeio de gôndola clássico",
		price: 500,
		qty: 1,
		category: "Experiências",
	},
	{
		name: "Primeiro mercado da casa nova",
		price: 400,
		qty: 1,
		category: "Cama, Mesa e Banho",
	},
	{ name: "Adoção de pet do casal", price: 300, qty: 1, category: "Outro" },
	{
		name: "Aparelho de fondue de chocolate",
		price: 220,
		qty: 1,
		category: "Cozinha",
	},
	{
		name: "Assinatura de streaming anual",
		price: 90,
		qty: 1,
		category: "Eletrônicos",
	},
	{
		name: "Robô aspirador inteligente",
		price: 800,
		qty: 1,
		category: "Eletrodomésticos",
	},
	{
		name: "Adega de vinhos compacta",
		price: 600,
		qty: 1,
		category: "Decoração",
	},
	{
		name: "Cafeteira expressa de cápsula",
		price: 450,
		qty: 1,
		category: "Cozinha",
	},
	{
		name: "Jarra de cristal com infusor",
		price: 90,
		qty: 1,
		category: "Decoração",
	},
	{
		name: "Passeio radical de jipe 4x4",
		price: 350,
		qty: 2,
		category: "Experiências",
	},
	{
		name: "Almoço de frutos do mar",
		price: 320,
		qty: 1,
		category: "Experiências",
	},
	{
		name: "Piquenique completo no parque",
		price: 150,
		qty: 1,
		category: "Experiências",
	},
	{ name: "Jogo de malas de viagem", price: 500, qty: 1, category: "Viagem" },
	{
		name: "Jogo de tabuleiro divertido",
		price: 180,
		qty: 1,
		category: "Outro",
	},
	{ name: "Diária de hotel com hidro", price: 650, qty: 2, category: "Viagem" },
	{
		name: "Ingressos para festival",
		price: 400,
		qty: 2,
		category: "Experiências",
	},
	{
		name: "Sobremesa especial para dois",
		price: 80,
		qty: 1,
		category: "Experiências",
	},
	{ name: "Primeira pizza na casa nova", price: 90, qty: 1, category: "Outro" },
	{
		name: "Tour noturno de mistérios",
		price: 160,
		qty: 2,
		category: "Experiências",
	},
	{
		name: "Passeio exótico de camelo",
		price: 400,
		qty: 2,
		category: "Experiências",
	},
	{
		name: "Ajuda com fotógrafo do evento",
		price: 600,
		qty: 1,
		category: "Experiências",
	},
	{
		name: "Jogar o buquê na sua direção",
		price: 300,
		qty: 2,
		category: "Experiências",
	},
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
			price: z.coerce.number().min(0.01, "O valor deve ser maior que zero."),
			desiredQuantity: z.coerce
				.number()
				.min(1, "A quantidade deve ser maior que zero."),
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
				.min(1, "A quantidade deve ser maior que zero."),
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

const {
	links: searchResults,
	isSearching: isSearchingLinks,
	searchError,
	searchProducts,
} = useProductSearch();

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
		toast.info("Preencha o nome do produto para buscar os links.");
		return;
	}
	await searchProducts(pName.value);
	if (searchError.value) {
		toast.error(searchError.value);
	} else if (searchResults.value.length === 0) {
		toast.info("Nenhum link encontrado para este produto.");
	}
};

const addLinkToProduct = (item: IProductLink) => {
	pLinks.value.push({
		store: item.store || "Loja",
		url: item.url,
	} as IProductLink);
	searchResults.value = searchResults.value.filter(
		(res: IProductLink) => res.url !== item.url,
	);
	toast.success("Link adicionado ao produto!");
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

	toast.success("Produto salvo com sucesso!");

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

const selectedPredefinedExp = ref("");
const predefinedExperienceOptions = computed(() => {
	return PREDEFINED_EXPERIENCES.map((exp) => ({
		label: exp.name,
		value: exp.name,
	}));
});

watch(selectedPredefinedExp, (newVal) => {
	if (newVal) {
		const exp = PREDEFINED_EXPERIENCES.find((e) => e.name === newVal);
		if (exp) {
			qName.value = exp.name;
			qPrice.value = exp.price;
			qDesiredQuantity.value = exp.qty;
			qCategorySelect.value = exp.category;
		}
	}
});

const openNewQuota = () => {
	editProductId.value = null;
	resetQuotaForm();
	selectedPredefinedExp.value = "";
	qImageBase64.value = "";
	qImageFile.value = null;
	showQuotaModal.value = true;
};

const editQuota = (p: IProduct) => {
	editProductId.value = p.$id;
	selectedPredefinedExp.value = "";
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

	toast.success("Cota salva com sucesso!");

	showQuotaModal.value = false;
});

const deleteProduct = async (product: IProduct) => {
	confirm({
		title: product.name,
		description:
			"Tem certeza de que deseja excluir este item? Esta ação não pode ser desfeita.",
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
          <FileUpload v-model="pImageBase64" @file-selected="(file) => pImageFile = file" :maxSizeMb="1"
            accept="image/*" />
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
                <a :href="res.url" target="_blank" class="block text-xs font-medium text-slate-900 truncate" :title="res.title">{{ res.title }}</a>
                <p class="text-[10px] text-slate-500">{{ res.store }}</p>
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
        <FormGroup label="Sugestão de Experiência">
          <Combobox v-model="selectedPredefinedExp" :options="predefinedExperienceOptions"
            placeholder="Selecione uma sugestão para preencher..." emptyText="Nenhuma sugestão encontrada..." />
        </FormGroup>

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
          <FileUpload v-model="qImageBase64" @file-selected="(file) => qImageFile = file" :maxSizeMb="1"
            accept="image/*" />
        </FormGroup>
      </div>
      <div class="pt-4 border-t border-slate-100 flex gap-3">
        <Button class="flex-1" @click="quotaSubmit">Salvar</Button>
      </div>
    </Modal>
  </div>
</template>
