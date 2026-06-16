<script setup lang="ts">
import type { IProduct } from "@/services/product.service";
import type { ITenant } from "@/services/tenant.service";
import { computed, ref, watch } from "vue";

// 2. IMPORTAÇÃO DOS COMPONENTES DE SELECT DO SHADCN:
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 3. IMPORTAÇÃO DE TODOS OS SUBCOMPONENTES DE PAGINAÇÃO DO SHADCN:
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationFirst,
  PaginationLast,
  PaginationNext,
  PaginationPrevious
} from "@/components/ui/pagination";

// 4. IMPORTAÇÃO DOS ELEMENTOS INTERNOS DO GRID:
import Combobox from "@/components/ui/Combobox.vue";
// Nota: Certifique-se de que o caminho abaixo aponta corretamente para o seu componente de Card
import CardProduct from "@/components/ui/Card.vue";

const props = defineProps<{
  products: IProduct[];
  tenant: ITenant;
  mode: "public" | "admin";
  currentUser?: Record<string, unknown> | null;
}>();

const emit = defineEmits<{
  (e: "open-pix", product: IProduct, quantity: number): void;
  (e: "open-links", product: IProduct, quantity: number): void;
  (e: "edit", product: IProduct): void;
  (e: "delete", productId: string): void;
}>();

// Filter State
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

// Pagination State
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

// Quota quantities
const quotaQuantities = ref<Record<string, number>>({});

const handleOpenPix = (product: IProduct) => {
  const qty = quotaQuantities.value[product.$id] || 1;
  emit("open-pix", product, qty);
};

const handleOpenLinks = (product: IProduct) => {
  const qty = quotaQuantities.value[product.$id] || 1;
  emit("open-links", product, qty);
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
      <div v-for="product in paginatedProducts" :key="product.$id"
        class="flex flex-col bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <h3 class="font-serif text-slate-900 text-xl font-medium mb-2">{{ product.name }}</h3>
        <p class="text-primary font-bold mb-4">R$ {{ product.base_price }}</p>

        <div class="mt-auto space-y-2">
          <button @click="handleOpenPix(product)"
            class="w-full bg-primary text-white py-3 rounded-xl font-medium text-sm hover:opacity-95 transition-opacity">
            Presentear via PIX
          </button>
          <button v-if="product.links && product.links.length > 0" @click="handleOpenLinks(product)"
            class="w-full border border-slate-200 text-slate-600 py-3 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors">
            Comprar na Loja
          </button>
        </div>
      </div>
    </div>

    <div v-if="filteredProducts.length > 0"
      class="mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12">
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium text-slate-600 whitespace-nowrap">Itens por página</span>
        <Select :model-value="itemsPerPage.toString()"
          @update:model-value="(val: unknown) => itemsPerPage = parseInt(val as string, 10)">
          <SelectTrigger class="w-[90px] h-10 rounded-xl border-slate-200 bg-white shadow-sm focus:ring-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent class="bg-white rounded-xl border-slate-200 shadow-xl z-50">
            <SelectGroup>
              <SelectItem value="6" class="rounded-lg cursor-pointer">6</SelectItem>
              <SelectItem value="12" class="rounded-lg cursor-pointer">12</SelectItem>
              <SelectItem value="24" class="rounded-lg cursor-pointer">24</SelectItem>
              <SelectItem value="48" class="rounded-lg cursor-pointer">48</SelectItem>
              <SelectItem value="100" class="rounded-lg cursor-pointer">100</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <Pagination v-slot="{ page, items }" :total="filteredProducts.length" :sibling-count="1" show-edges
        :default-page="1" v-model:page="currentPage" :items-per-page="itemsPerPage" class="w-auto mx-0 flex-none">
        <PaginationContent class="gap-2">
          <PaginationFirst size="icon"
            class="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-500 transition-all cursor-pointer"
            @click="currentPage = 1">
            <ChevronsLeft class="w-5 h-5" />
          </PaginationFirst>

          <PaginationPrevious size="icon"
            class="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-500 transition-all cursor-pointer"
            @click="currentPage = Math.max(1, currentPage - 1)">
            <ChevronLeft class="w-5 h-5" />
          </PaginationPrevious>

          <template v-for="(item, index) in items" :key="index">
            <div v-if="item.type === 'ellipsis'" class="w-10 h-10 flex items-center justify-center text-slate-400">...
            </div>
            <button v-else class="w-10 h-10 rounded-xl font-medium transition-all"
              :class="item.value === page ? 'bg-primary text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600'"
              @click="currentPage = item.value">
              {{ item.value }}
            </button>
          </template>

          <PaginationNext size="icon"
            class="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-500 transition-all cursor-pointer"
            @click="currentPage = Math.min(Math.ceil(filteredProducts.length / itemsPerPage), currentPage + 1)">
            <ChevronRight class="w-5 h-5" />
          </PaginationNext>

          <PaginationLast size="icon"
            class="w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-500 transition-all cursor-pointer"
            @click="currentPage = Math.ceil(filteredProducts.length / itemsPerPage)">
            <ChevronsRight class="w-5 h-5" />
          </PaginationLast>
        </PaginationContent>
      </Pagination>
    </div>
  </div>
</template>