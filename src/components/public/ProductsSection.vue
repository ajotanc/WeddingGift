<script setup lang="ts">
import ProductGallery from "@/components/ui/ProductGallery.vue";
import type { IProduct } from "@/services/product.service";
import type { ITenant } from "@/services/tenant.service";
import type { IUser } from "@/stores/auth";

defineProps<{
	products: IProduct[];
	tenant: ITenant | null;
	currentUser: IUser;
}>();

defineEmits<{
	(e: "openPix", data: { product: IProduct; quantity?: number }): void;
	(e: "openLinks", data: { product: IProduct; quantity?: number }): void;
}>();
</script>

<template>
	<section id="gifts" class="scroll-mt-10">
		<div class="text-center mb-16">
			<h2 class="text-3xl font-serif text-slate-900 mb-6">Nossa Lista</h2>
			<p class="text-slate-500 font-light max-w-xl mx-auto text-lg leading-relaxed">
				Com muito carinho, selecionamos alguns itens e experiências. Fique à vontade para nos presentear com o que tocar o seu coração.
			</p>
		</div>

		<ProductGallery :products="products" :tenant="tenant" mode="public" :currentUser="currentUser"
			@open-pix="(prod, qty) => $emit('openPix', { product: prod, quantity: qty })"
			@open-links="(prod, qty) => $emit('openLinks', { product: prod, quantity: qty })" />
	</section>
</template>
