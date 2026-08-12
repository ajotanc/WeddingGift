<script setup lang="ts">
import { formatMoney, getProductPrice } from "@/lib/money";
import type { IProduct } from "@/services/product.service";
import type { ITenant } from "@/services/tenant.service";
import { computed, ref, watch } from "vue";

// Importações dos Ícones utilizados nos Cards
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  Edit2,
  Gift,
  Heart,
  SlidersHorizontal,
  Trash2,
} from "lucide-vue-next";

// Importação dos Componentes de UI do Shadcn
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const getCategoryCount = (categoryName: string) => {
  if (categoryName === "all") return props.products.length;
  return props.products.filter((p) => p.category === categoryName).length;
};

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
    <div v-if="categories.length > 0" class="w-full mb-8">
      <!-- Seletor Dropdown Shadcn no Mobile (sm:hidden) -->
      <div class="block sm:hidden w-full">
        <Select v-model="selectedCategory">
          <SelectTrigger
            class="w-full h-11 backdrop-blur-sm rounded-xl px-4 text-xs font-semibold uppercase tracking-wider shadow-sm transition-all duration-300 border"
            :class="selectedCategory !== 'all'
              ? 'bg-primary/10 text-primary border-primary/40 font-bold'
              : 'bg-white/90 text-slate-800 border-slate-200/90 hover:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:border-primary'"
          >
            <div class="flex items-center justify-between w-full pr-1">
              <div class="flex items-center gap-2.5 truncate">
                <div class="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <SlidersHorizontal class="w-3.5 h-3.5" />
                </div>
                <span class="truncate font-bold text-slate-700">
                  {{ selectedCategory === 'all' ? 'Todas as Categorias' : selectedCategory }}
                </span>
              </div>
              <div
                class="ml-2 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 shrink-0 transition-colors"
              >
                {{ getCategoryCount(selectedCategory) }}
              </div>
            </div>
          </SelectTrigger>
          <SelectContent class="bg-white/95 backdrop-blur-md border border-slate-100 rounded-xl shadow-xl p-1 z-50 min-w-[220px]">
            <SelectGroup>
              <SelectItem
                value="all"
                class="rounded-lg text-xs uppercase tracking-wider font-semibold cursor-pointer py-2.5 px-3 border border-transparent data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary data-[state=checked]:border-primary/40 focus:bg-primary/10 focus:text-primary transition-colors"
              >
                <div class="flex items-center justify-between w-full gap-4">
                  <span>Todas as Categorias</span>
                  <div
                    class="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors shrink-0"
                    :class="selectedCategory === 'all' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-slate-100 text-slate-500 border border-slate-200/60'"
                  >
                    {{ props.products.length }}
                  </div>
                </div>
              </SelectItem>
              <SelectItem
                v-for="cat in categories"
                :key="cat"
                :value="cat"
                class="rounded-lg text-xs uppercase tracking-wider font-semibold cursor-pointer py-2.5 px-3 border border-transparent data-[state=checked]:bg-primary/10 data-[state=checked]:text-primary data-[state=checked]:border-primary/40 focus:bg-primary/10 focus:text-primary transition-colors"
              >
                <div class="flex items-center justify-between w-full gap-4">
                  <span>{{ cat }}</span>
                  <div
                    class="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors shrink-0"
                    :class="selectedCategory === cat ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-slate-100 text-slate-500 border border-slate-200/60'"
                  >
                    {{ getCategoryCount(cat) }}
                  </div>
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <!-- Abas de Pílula no Desktop (hidden sm:flex) -->
      <div class="hidden sm:flex items-center justify-center gap-2.5 max-w-3xl mx-auto flex-wrap">
        <button
          @click="selectedCategory = 'all'"
          class="h-11 px-4 rounded-xl text-xs uppercase tracking-widest font-semibold transition-all duration-300 cursor-pointer border flex items-center gap-2 group"
          :class="selectedCategory === 'all'
            ? 'bg-primary/10 text-primary border-primary/40 shadow-xs font-bold'
            : 'bg-white text-slate-500 border-slate-200/80 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300'"
        >
          <span>Todas</span>
          <div
            class="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors shrink-0"
            :class="selectedCategory === 'all'
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-slate-100 text-slate-500 border border-slate-200/60 group-hover:bg-slate-200/80 group-hover:text-slate-700'"
          >
            {{ props.products.length }}
          </div>
        </button>

        <button
          v-for="cat in categories"
          :key="cat"
          @click="selectedCategory = cat"
          class="h-11 px-4 rounded-xl text-xs uppercase tracking-widest font-semibold transition-all duration-300 cursor-pointer border flex items-center gap-2 group"
          :class="selectedCategory === cat
            ? 'bg-primary/10 text-primary border-primary/40 shadow-xs font-bold'
            : 'bg-white text-slate-500 border-slate-200/80 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300'"
        >
          <span>{{ cat }}</span>
          <div
            class="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors shrink-0"
            :class="selectedCategory === cat
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-slate-100 text-slate-500 border border-slate-200/60 group-hover:bg-slate-200/80 group-hover:text-slate-700'"
          >
            {{ getCategoryCount(cat) }}
          </div>
        </button>
      </div>
    </div>

    <div v-if="paginatedProducts.length === 0" class="text-center py-20 text-slate-400">
      Nenhum presente encontrado nesta categoria.
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
      <Card v-for="product in paginatedProducts" :key="product.$id"
        class="flex flex-col overflow-hidden bg-white group relative p-5 transition-all duration-500 border border-slate-100/70 hover:border-primary/20 rounded-2xl hover:shadow-[0_16px_36px_rgba(0,0,0,0.025)]">

        <div
          class="relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-50/70 border border-slate-100/50 flex items-center justify-center transition-all duration-500 group-hover:bg-white">
          <div v-if="product.type === 'physical' && product?.image_url"
            class="p-4 w-full h-full flex items-center justify-center">
            <img :src="product.image_url" alt="Produto"
              class="max-h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.03]" />
          </div>
          <div v-else
            class="p-4 w-full h-full flex flex-col items-center justify-center text-slate-300 select-none bg-slate-50/50">
            <div
              class="w-14 h-14 rounded-full border flex items-center justify-center mb-2 bg-white shadow-sm border-primary/20 text-primary">
              <Gift v-if="product.type === 'quota'" class="w-6 h-6 stroke-[1.25]" />
              <Heart v-else class="w-6 h-6 stroke-[1.25] fill-current" />
            </div>
            <span class="text-[9px] uppercase tracking-widest font-bold text-slate-400">Presente Especial</span>
          </div>

          <!-- Glassmorphic premium overlay for sold out -->
          <div v-if="isProductSoldOut(product)"
            class="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] flex items-center justify-center p-4">
            <div
              class="relative overflow-hidden bg-white/95 border border-slate-200/50 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
              <Heart class="w-3 h-3 fill-current animate-pulse text-primary" />
              <span class="text-[10px] font-bold tracking-wider text-slate-700 uppercase">Presenteado!</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col flex-1">
          <div class="mb-2.5 flex items-center gap-2 flex-wrap">
            <span v-if="product.category"
              class="bg-slate-100/80 border border-slate-300 text-slate-500 text-[9px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest">
              {{ product.category }}
            </span>

            <template v-if="product.type === 'quota'">
              <span
                class="text-[9px] border border-primary/50 font-bold px-2.5 py-1 rounded-md uppercase tracking-widest text-primary bg-primary/10">Cota</span>
              <span
                class="bg-slate-100/80 border border-slate-300 text-slate-500 text-[9px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest">
                {{ product.claimed_quantity || 0 }}/{{ product.desired_quantity }}
              </span>
            </template>
            <template v-else>
              <span
                class="text-[9px] border border-primary/50 font-bold px-2.5 py-1 rounded-md uppercase tracking-widest text-primary bg-primary/10">
                {{ (product.desired_quantity && product.desired_quantity === 1 ? 'Único' :
                  `${product.claimed_quantity || 0}/${product.desired_quantity}`) }}
              </span>
            </template>
          </div>

          <h3 class="text-slate-800 text-lg mb-2 leading-snug group-hover:text-primary transition-colors duration-300">
            {{ product.name }}
          </h3>

          <div class="mt-auto pt-2">
            <p v-if="product.type === 'quota' || getRemainingQuantity(product) > 1"
              class="font-extrabold text-2xl mt-1 text-primary">
              {{ formatMoney(getProductPrice(product, getLocalQuantity(product.$id))) }}
              <span v-if="product.type === 'quota'" class="text-xs font-normal text-slate-400">/ {{
                formatMoney(product.price) }}</span>
              <span v-else-if="getRemainingQuantity(product) > 1 && getLocalQuantity(product.$id) > 1"
                class="text-xs font-extrabold text-slate-400">
                ({{ getLocalQuantity(product.$id) }}x {{ formatMoney(product.price) }})
              </span>
            </p>
            <p v-else class="font-extrabold text-2xl mt-1 text-primary">
              {{ formatMoney(product.price) }}
            </p>

            <div v-if="isProductSoldOut(product)"
              class="mt-4 w-full py-2.5 rounded-xl border border-dashed border-slate-200 text-center transition-all bg-slate-50/50 cursor-not-allowed">
              <span class="text-xs italic text-slate-400">Garantido com carinho</span>
            </div>

            <template v-if="mode === 'public' && !isProductSoldOut(product)">
              <div class="flex flex-col gap-2 mt-4">

                <div v-if="getRemainingQuantity(product) > 1" class="flex items-center gap-2 mb-2">
                  <Button variant="outline" class="w-11 h-11 p-0 rounded-xl shrink-0"
                    @click="setLocalQuantity(product.$id, getLocalQuantity(product.$id) - 1, getRemainingQuantity(product))">-</Button>

                  <Input type="number" min="1" :max="getRemainingQuantity(product)"
                    class="text-center h-11 rounded-xl border-slate-200 shadow-sm bg-slate-50/50 font-medium flex-1 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    :model-value="getLocalQuantity(product.$id)"
                    @update:model-value="(val: string | number) => setLocalQuantity(product.$id, Number(val), getRemainingQuantity(product))" />

                  <Button variant="outline" class="w-11 h-11 p-0 rounded-xl shrink-0"
                    @click="setLocalQuantity(product.$id, getLocalQuantity(product.$id) + 1, getRemainingQuantity(product))">+</Button>
                </div>

                <template v-if="product.type === 'quota'">
                  <Button
                    class="w-full text-white hover:brightness-105 active:scale-[0.98] transition-all rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wider bg-primary border-primary"
                    @click="handleOpenPix(product)">
                    Presentear com PIX
                  </Button>
                </template>
                <template v-else-if="product.type === 'physical'">
                  <Button v-if="product.links && product.links.length > 0" variant="outline"
                    class="hover:bg-slate-50 transition-all rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wider text-primary border-primary/30"
                    @click="handleOpenLinks(product)">
                    Comprar na Loja
                  </Button>
                  <Button v-if="product.price"
                    class="w-full text-white hover:brightness-105 active:scale-[0.98] transition-all rounded-xl py-2.5 text-xs font-semibold uppercase tracking-wider bg-primary border-primary"
                    @click="handleOpenPix(product)">
                    Presentear com PIX
                  </Button>
                </template>
              </div>
            </template>

            <template v-if="mode === 'admin'">
              <div class="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                <Button variant="outline" class="flex-1 rounded-xl" @click="emit('edit', product)"
                  :disabled="product?.claimed_quantity > 0">
                  <Edit2 class="w-4 h-4 mr-2" /> Editar
                </Button>
                <Button variant="outline"
                  class="w-12 text-red-500 hover:text-red-600 hover:bg-red-50 p-0 flex items-center justify-center shrink-0 rounded-xl"
                  @click="emit('delete', product)" :disabled="product?.claimed_quantity > 0">
                  <Trash2 class="w-4 h-4" />
                </Button>
              </div>
            </template>

          </div>
        </div>
      </Card>
    </div>

    <!-- SEÇÃO DO SELETOR DE PAGINAÇÃO EDITORIAL -->
    <div v-if="filteredProducts.length > itemsPerPage || mode === 'admin'"
      class="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6">

      <!-- Only show items per page in admin mode -->
      <div v-if="mode === 'admin'" class="flex items-center gap-3">
        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Itens por página</span>
        <div class="relative flex items-center">
          <select :value="itemsPerPage.toString()" @change="updateItemsPerPage"
            class="w-[80px] h-9 pl-3 pr-8 rounded-xl border border-slate-200 bg-white shadow-sm text-xs font-medium text-slate-900 focus:outline-none appearance-none cursor-pointer">
            <option value="6">6</option>
            <option value="12">12</option>
            <option value="24">24</option>
            <option value="48">48</option>
            <option value="100">100</option>
          </select>
          <ChevronsUpDown class="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
        </div>
      </div>

      <Pagination v-slot="{ page }" :total="filteredProducts.length" :sibling-count="1" show-edges :default-page="1"
        v-model:page="currentPage" :items-per-page="itemsPerPage" class="w-auto mx-0 flex-none">
        <PaginationContent v-slot="{ items }" class="gap-1 flex items-center">
          <PaginationPrevious
            class="w-9 h-9 p-0 rounded-xl border border-slate-200 bg-white text-slate-500 transition-all cursor-pointer hover:bg-slate-50 disabled:opacity-40"
            :disabled="currentPage === 1" @click="currentPage = Math.max(1, currentPage - 1)">
            <ChevronLeft class="w-4 h-4" />
          </PaginationPrevious>

          <template v-for="(item, index) in items">
            <PaginationItem v-if="item.type === 'page'" :key="index" :value="item.value"
              :is-active="item.value === page" @click="currentPage = item.value"
              class="w-9 h-9 p-0 rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center border"
              :class="item.value === page ? 'border-primary text-primary font-bold bg-primary/10' : 'border-slate-200 text-slate-600'">
              {{ item.value }}
            </PaginationItem>
            <PaginationEllipsis v-else :key="item.type" :index="index"
              class="w-9 h-9 p-0 flex items-center justify-center text-slate-400" />
          </template>

          <PaginationNext
            class="w-9 h-9 p-0 rounded-xl border border-slate-200 bg-white text-slate-500 transition-all cursor-pointer hover:bg-slate-50 disabled:opacity-40"
            :disabled="currentPage === Math.ceil(filteredProducts.length / itemsPerPage)"
            @click="currentPage = Math.min(Math.ceil(filteredProducts.length / itemsPerPage), currentPage + 1)">
            <ChevronRight class="w-4 h-4" />
          </PaginationNext>
        </PaginationContent>
      </Pagination>
    </div>
  </div>
</template>