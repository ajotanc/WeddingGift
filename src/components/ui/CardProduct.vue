<script setup lang="ts">
import type { IProduct } from "@/services/product.service";
import type { ITenant } from "@/services/tenant.service";
import { computed } from "vue";

const props = defineProps<{
	product: IProduct;
	tenant: ITenant;
	mode: "public" | "admin";
	currentUser?: Record<string, unknown> | null; // Opcional, usado no public
	quotaQuantity?: number; // Opcional, usado no public (v-model local)
}>();

const emit = defineEmits<{
	(e: "update:quotaQuantity", val: number): void;
	(e: "open-pix", product: IProduct, quantity: number): void;
	(e: "open-links", product: IProduct, quantity: number): void;
	(e: "require-auth"): void;
	(e: "edit", product: IProduct): void;
	(e: "delete", productId: IProduct): void;
}>();

const localQuota = computed({
	get: () => props.quotaQuantity || 1,
	set: (val) => emit("update:quotaQuantity", val),
});

const isSoldOut = computed(() => {
	return (
		(props.product.claimed_quantity || 0) >=
		(props.product.desired_quantity || 1)
	);
});

const remainingQuantity = computed(() => {
	return Math.max(
		0,
		(props.product.desired_quantity || 1) -
			(props.product.claimed_quantity || 0),
	);
});
</script>

<template>
  <Card
    class="flex flex-col overflow-hidden border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl transition-all hover:-translate-y-1 hover:shadow-md duration-300 bg-white group p-6">
    <div v-if="product.type === 'physical' && product.image_url"
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
          class="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest">{{
            product.category }}</span>
        <template v-if="product.type === 'quota'">
          <span class="text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest"
            :style="{ color: tenant.primary_color, backgroundColor: (tenant.primary_color || '#000000') + '1a' }">Cota</span>
          <span
            class="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest">{{
              product.claimed_quantity || 0 }}/{{ product.desired_quantity }}</span>
        </template>
        <template v-else>
          <span class="text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest"
            :style="{ color: tenant.primary_color, backgroundColor: (tenant.primary_color || '#000000') + '1a' }">{{
              (product.desired_quantity && product.desired_quantity === 1 ? 'Único Produto' :
                `${product.claimed_quantity || 0}/${product.desired_quantity}`) }}</span>
        </template>
      </div>
      <h3 class="font-serif text-slate-900 text-xl mb-2 leading-snug">{{ product.name }}</h3>
      <div class="mt-auto pt-2">
        <p v-if="product.type === 'quota' || remainingQuantity > 1" class="text-primary font-bold text-xl mt-1">
          {{ formatMoney(getProductPrice(product, localQuota)) }} <span v-if="product.type === 'quota'"
            class="text-xs font-normal text-slate-400">/ {{ formatMoney(product.base_price) }}</span>
          <span v-else-if="remainingQuantity > 1 && localQuota > 1" class="text-xs font-normal text-slate-400">
            ({{ localQuota }}x {{ formatMoney(product.base_price) }})
          </span>
        </p>
        <p v-else class="text-primary font-bold text-xl mt-1">
          {{ formatMoney(product.base_price) }}
        </p>

        <!-- Status de Reservado -->
        <div v-if="isSoldOut"
          class="mt-4 w-full rounded-xl h-12 flex items-center justify-center gap-2 bg-rose-50 border border-rose-100/50 text-center transition-all shadow-sm">
          <span class="text-sm font-semibold text-rose-600 uppercase tracking-widest">Já Reservado</span>
          <Heart class="w-5 h-5 text-rose-500 fill-rose-100" />
        </div>

        <!-- Ações do Public -->
        <template v-if="mode === 'public' && !isSoldOut">
          <div v-if="currentUser" class="flex flex-col gap-2 mt-4">
            
            <!-- Seletor de Quantidade (comum para cota e produtos com qtd > 1) -->
            <div v-if="remainingQuantity > 1" class="flex items-center gap-2 mb-2">
              <Button variant="outline"
                class="w-12 h-12 p-0 rounded-xl shrink-0 border-slate-200 shadow-sm bg-slate-50/50 hover:bg-slate-100"
                @click="localQuota = Math.max(1, localQuota - 1)">-</Button>
              <Input type="number" min="1"
                :max="remainingQuantity"
                class="text-center rounded-xl h-12 border-slate-200 shadow-sm bg-slate-50/50 font-medium flex-1 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                v-model="localQuota"
                @update:model-value="val => localQuota = Math.max(1, Math.min(remainingQuantity, Number(val)))" />
              <Button variant="outline"
                class="w-12 h-12 p-0 rounded-xl shrink-0 border-slate-200 shadow-sm bg-slate-50/50 hover:bg-slate-100"
                @click="localQuota = Math.min(remainingQuantity, localQuota + 1)">+</Button>
            </div>

            <template v-if="product.type === 'quota'">
              <Button class="w-full rounded-xl h-12 font-medium shadow-sm hover:shadow-md transition-all"
                @click="emit('open-pix', product, Number(localQuota))">
                Presentear com PIX
              </Button>
            </template>
            <template v-else-if="product.type === 'physical'">
              <Button v-if="product.links && product.links.length > 0" variant="outline"
                class="w-full rounded-xl h-12 border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                @click="emit('open-links', product, Number(localQuota))">
                Comprar na Loja
              </Button>
              <Button v-if="product.base_price"
                class="w-full rounded-xl h-12 font-medium shadow-sm hover:opacity-90 transition-all duration-300 ease-in-out"
                @click="emit('open-pix', product, Number(localQuota))">
                Presentear via PIX
              </Button>
            </template>
          </div>
          <div v-else
            class="text-center p-5 mt-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 flex flex-col gap-4">
            <p class="text-slate-500 font-light text-sm">Faça login com sua conta Google para presentear.</p>
            <GoogleAuthButton @click="emit('require-auth')" :fill="true" :themeColor="tenant.primary_color"
              class="mx-auto w-full" />
          </div>
        </template>

        <!-- Ações do Admin -->
        <template v-if="mode === 'admin'">
          <div class="mt-4 flex gap-2 border-t border-slate-100 pt-4">
            <Button variant="outline" class="flex-1 text-slate-600 hover:text-slate-900 h-12"
              @click="emit('edit', product)">
              <Edit2 class="w-4 h-4 mr-2" /> Editar
            </Button>
            <Button variant="outline" class="w-12 text-red-500 hover:text-red-600 hover:bg-red-50 h-12 p-0 flex items-center justify-center shrink-0"
              @click="emit('delete', product)" :disabled="product.claimed_quantity > 0">
              <Trash2 class="w-4 h-4" />
            </Button>
          </div>
        </template>

      </div>
    </div>
  </Card>
</template>
