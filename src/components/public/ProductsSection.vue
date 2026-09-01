<script setup lang="ts">
import SectionHeader from "@/components/public/SectionHeader.vue";
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
	<section id="gifts" class="scroll-mt-16 text-center">
		<SectionHeader
			tag="Presentes"
			title="Nossa Lista"
			description="Preparamos esta lista com muito carinho para servir de inspiração. Sintam-se livres para presentear por aqui ou adquirir em qualquer loja."
			responsive />

		<ProductGallery :products="products" :tenant="tenant" mode="public" :currentUser="currentUser"
			@open-pix="(prod, qty) => $emit('openPix', { product: prod, quantity: qty })"
			@open-links="(prod, qty) => $emit('openLinks', { product: prod, quantity: qty })" />
	</section>
</template>
