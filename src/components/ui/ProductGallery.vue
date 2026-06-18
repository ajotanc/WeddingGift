<script setup lang="ts">
import { formatMoney, getProductPrice } from "@/lib/money";
import type { IProduct } from "@/services/product.service";
import type { ITenant } from "@/services/tenant.service";
import { computed, ref, watch } from "vue";

// Importações dos Ícones utilizados nos Cards
import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
	ChevronsUpDown,
	Edit2,
	Heart,
	Package,
	QrCode,
	Trash2,
} from "lucide-vue-next";

// Importação dos Componentes de UI do Shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Card } from "@/components/ui/card";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationFirst,
	PaginationItem,
	PaginationLast,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";

import Combobox from "../reusable/Combobox.vue";

const props = defineProps<{
	products: IProduct[];
	tenant: ITenant | null;
	mode: "public" | "admin";
	currentUser?: Record<string, unknown> | null;
}>();

const emit = defineEmits<{
	(e: "open-pix", product: IProduct, quantity: number): void;
	(e: "open-links", product: IProduct, quantity: number): void;
	(e: "edit", product: IProduct): void;
	(e: "delete", product: IProduct): void;
}>();

// --- Estado de Filtros ---
const selectedCategory = ref<string>("all");
const categories = computed(() => {
	const cats = new Set(
		props.products.map((p) => p.category).filter((c): c is string => !!c),
	);
	return Array.from(cats).sort();
});

const filteredProducts = computed(() => {
	if (selectedCategory.value === "all") return props.products;
	return props.products.filter((p) => p.category === selectedCategory.value);
});

// --- Estado de Paginação ---
const currentPage = ref(1);
const itemsPerPage = ref(6);

watch(selectedCategory, () => {
	currentPage.value = 1;
});

const paginatedProducts = computed(() => {
	const start = (currentPage.value - 1) * itemsPerPage.value;
	const end = start + itemsPerPage.value;
	return filteredProducts.value.slice(start, end);
});

// --- Dicionário reativo para controlar as quantidades selecionadas por produto ---
const quotaQuantities = ref<Record<string, number>>({});

// Métodos auxiliares para calcular limites individuais de cada produto na lista
const isProductSoldOut = (product: IProduct) => {
	return (product.claimed_quantity || 0) >= (product.desired_quantity || 1);
};

const getRemainingQuantity = (product: IProduct) => {
	return Math.max(
		0,
		(product.desired_quantity || 1) - (product.claimed_quantity || 0),
	);
};

const getLocalQuantity = (productId: string) => {
	return quotaQuantities.value[productId] || 1;
};

const setLocalQuantity = (productId: string, val: number, maxQty: number) => {
	quotaQuantities.value[productId] = Math.max(1, Math.min(maxQty, val));
};

// --- Handlers de Ação de Envio ---
const handleOpenPix = (product: IProduct) => {
	const qty = getLocalQuantity(product.$id);
	emit("open-pix", product, qty);
};

const handleOpenLinks = (product: IProduct) => {
	const qty = getLocalQuantity(product.$id);
	emit("open-links", product, qty);
};

// TIPAGEM ESTRITA SEM ANY/UNKNOWN USANDO INTERFACES NATIVAS DO DOM
const updateItemsPerPage = (event: Event) => {
	const target = event.target as HTMLSelectElement;
	if (target) {
		itemsPerPage.value = Number.parseInt(target.value, 10);
	}
};
</script>

<template>
  <div class="space-y-12">
    <div v-if="categories.length > 0" class="flex justify-center mb-8">
      <div class="w-full max-w-sm">
        <Combobox v-model="selectedCategory"
          :options="[{ label: 'Todas as Categorias', value: 'all' }, ...categories.map(c => ({ label: c, value: c }))]"
          placeholder="Filtrar por categoria..." emptyText="Nenhuma categoria encontrada." />
      </div>
    </div>

    <div v-if="paginatedProducts.length === 0" class="text-center py-20 text-slate-400">
      Nenhum presente encontrado nesta categoria.
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      <Card v-for="product in paginatedProducts" :key="product.$id"
        class="flex flex-col overflow-hidden border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl transition-all hover:-translate-y-1 hover:shadow-md duration-300 bg-white group p-6">

        <div v-if="product.type === 'physical' && product?.image_url"
          class="bg-slate-100/60 p-6 rounded-xl aspect-square flex items-center justify-center">
          <img :src="product.image_url" alt="Produto"
            class="max-h-full object-contain mix-blend-multiply drop-shadow-sm transition-transform duration-500 group-hover:scale-105" />
        </div>
        <div v-else class="bg-slate-100/60 p-6 rounded-xl aspect-square flex flex-col items-center justify-center">
          <span class="text-primary/60 font-serif text-3xl mb-2 italic">{{ product.category }}</span>
          <span class="text-slate-700 text-center font-medium px-4 text-sm">{{ product.name }}</span>
        </div>

        <div class="flex flex-col flex-1 pt-3">
          <div class="mb-2 flex items-center gap-2 flex-wrap">
            <span v-if="product.category"
              class="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest">
              {{ product.category }}
            </span>

            <template v-if="product.type === 'quota'">
              <span class="text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest"
                :style="{ color: tenant?.primary_color, backgroundColor: (tenant?.primary_color || '#000000') + '1a' }">Cota</span>
              <span
                class="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest">
                {{ product.claimed_quantity || 0 }}/{{ product.desired_quantity }}
              </span>
            </template>
            <template v-else>
              <span class="text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest"
                :style="{ color: tenant?.primary_color, backgroundColor: (tenant?.primary_color || '#000000') + '1a' }">
                {{ (product.desired_quantity && product.desired_quantity === 1 ? 'Único Produto' :
                  `${product.claimed_quantity || 0}/${product.desired_quantity}`) }}
              </span>
            </template>
          </div>

          <h3 class="font-serif text-slate-900 text-xl mb-2 leading-snug">{{ product.name }}</h3>

          <div class="mt-auto pt-2">
            <p v-if="product.type === 'quota' || getRemainingQuantity(product) > 1"
              class="text-primary font-bold text-xl mt-1">
              {{ formatMoney(getProductPrice(product, getLocalQuantity(product.$id))) }}
              <span v-if="product.type === 'quota'" class="text-xs font-normal text-slate-400">/ {{
                formatMoney(product.price) }}</span>
              <span v-else-if="getRemainingQuantity(product) > 1 && getLocalQuantity(product.$id) > 1"
                class="text-xs font-normal text-slate-400">
                ({{ getLocalQuantity(product.$id) }}x {{ formatMoney(product.price) }})
              </span>
            </p>
            <p v-else class="text-primary font-bold text-xl mt-1">
              {{ formatMoney(product.price) }}
            </p>

            <div v-if="isProductSoldOut(product)"
              class="mt-4 w-full h-11 rounded-xl flex items-center justify-center gap-2 bg-rose-50 border border-rose-100/50 text-center transition-all shadow-sm">
              <span class="text-sm font-semibold text-rose-600 uppercase tracking-widest">Já Reservado</span>
              <Heart class="w-5 h-5 text-rose-500 fill-rose-100" />
            </div>

            <template v-if="mode === 'public' && !isProductSoldOut(product)">
              <div class="flex flex-col gap-2 mt-4">

                <div v-if="getRemainingQuantity(product) > 1" class="flex items-center gap-2 mb-2">
                  <Button variant="outline"
                    class="w-12 p-0"
                    @click="setLocalQuantity(product.$id, getLocalQuantity(product.$id) - 1, getRemainingQuantity(product))">-</Button>

                  <Input type="number" min="1" :max="getRemainingQuantity(product)"
                    class="text-center rounded-xl border-slate-200 shadow-sm bg-slate-50/50 font-medium flex-1 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    :model-value="getLocalQuantity(product.$id)"
                    @update:model-value="(val: string | number) => setLocalQuantity(product.$id, Number(val), getRemainingQuantity(product))" />

                  <Button variant="outline"
                    class="w-12 p-0"
                    @click="setLocalQuantity(product.$id, getLocalQuantity(product.$id) + 1, getRemainingQuantity(product))">+</Button>
                </div>

                <template v-if="product.type === 'quota'">
                  <Button @click="handleOpenPix(product)">
                    Presentear com PIX
                  </Button>
                </template>
                <template v-else-if="product.type === 'physical'">
                  <Button v-if="product.links && product.links.length > 0" variant="outline"
                    @click="handleOpenLinks(product)">
                    Comprar na Loja
                  </Button>
                  <Button v-if="product.price" @click="handleOpenPix(product)">
                    Presentear com PIX
                  </Button>
                </template>
              </div>
            </template>

            <template v-if="mode === 'admin'">
              <div class="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                <Button variant="outline" class="flex-1"
                  @click="emit('edit', product)" :disabled="product?.claimed_quantity > 0">
                  <Edit2 class="w-4 h-4 mr-2" /> Editar
                </Button>
                <Button variant="outline"
                  class="w-12 text-red-500 hover:text-red-600 hover:bg-red-50 p-0 flex items-center justify-center shrink-0"
                  @click="emit('delete', product)" :disabled="product?.claimed_quantity > 0">
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
            </template>

          </div>
        </div>
      </Card>
    </div>

    <!-- SEÇÃO DO SELETOR DE PAGINAÇÃO CORRIGIDO COM ELEMENTO NATIVO DO HTML -->
    <div v-if="filteredProducts.length > 0"
      class="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium text-slate-600 whitespace-nowrap">Itens por página</span>

        <div class="relative flex items-center">
          <select :value="itemsPerPage.toString()" @change="updateItemsPerPage"
            class="w-[90px] h-10 pl-3 pr-8 rounded-xl border border-slate-200 bg-white shadow-sm text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer">
            <option value="6">6</option>
            <option value="12">12</option>
            <option value="24">24</option>
            <option value="48">48</option>
            <option value="100">100</option>
          </select>
          <ChevronsUpDown class="w-4 h-4 text-slate-400 absolute right-2.5 pointer-events-none" />
        </div>
      </div>

      <Pagination v-slot="{ page }" :total="filteredProducts.length" :sibling-count="1" show-edges :default-page="1"
        v-model:page="currentPage" :items-per-page="itemsPerPage" class="w-auto mx-0 flex-none">
        <PaginationContent v-slot="{ items }" class="gap-2 flex items-center">
          <PaginationFirst
            class="w-10 h-10 p-0 rounded-xl border border-slate-200 bg-white text-slate-500 transition-all cursor-pointer hover:bg-slate-50"
            :disabled="currentPage === 1" @click="currentPage = 1">
            <ChevronsLeft class="w-5 h-5" />
          </PaginationFirst>
          <PaginationPrevious
            class="w-10 h-10 p-0 rounded-xl border border-slate-200 bg-white text-slate-500 transition-all cursor-pointer hover:bg-slate-50"
            :disabled="currentPage === 1" @click="currentPage = Math.max(1, currentPage - 1)">
            <ChevronLeft class="w-5 h-5" />
          </PaginationPrevious>

          <template v-for="(item, index) in items">
            <PaginationItem v-if="item.type === 'page'" :key="index" :value="item.value"
              :is-active="item.value === page" @click="currentPage = item.value"
              class="w-10 h-10 p-0 rounded-xl font-medium transition-all cursor-pointer flex items-center justify-center"
              :class="item.value === page ? 'bg-primary text-white shadow-md border-transparent hover:bg-primary/90' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'">
              {{ item.value }}
            </PaginationItem>
            <PaginationEllipsis v-else :key="item.type" :index="index"
              class="w-10 h-10 p-0 flex items-center justify-center text-slate-400" />
          </template>

          <PaginationNext
            class="w-10 h-10 p-0 rounded-xl border border-slate-200 bg-white text-slate-500 transition-all cursor-pointer hover:bg-slate-50"
            :disabled="currentPage === Math.ceil(filteredProducts.length / itemsPerPage)"
            @click="currentPage = Math.min(Math.ceil(filteredProducts.length / itemsPerPage), currentPage + 1)">
            <ChevronRight class="w-5 h-5" />
          </PaginationNext>
          <PaginationLast
            class="w-10 h-10 p-0 rounded-xl border border-slate-200 bg-white text-slate-500 transition-all cursor-pointer hover:bg-slate-50"
            :disabled="currentPage === Math.ceil(filteredProducts.length / itemsPerPage)"
            @click="currentPage = Math.ceil(filteredProducts.length / itemsPerPage)">
            <ChevronsRight class="w-5 h-5" />
          </PaginationLast>
        </PaginationContent>
      </Pagination>
    </div>
  </div>
</template>