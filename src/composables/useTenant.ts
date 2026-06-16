import { IMessage } from "@/services/message.service";
import { IProduct } from "@/services/product.service";
import { IPurchase, PurchaseService } from "@/services/purchase.service";
import { IRsvp } from "@/services/rsvp.service";
import { type ITenant, TenantService } from "@/services/tenant.service";
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

export function useTenant() {
	const route = useRoute();
	const tenant = ref<ITenant>({} as ITenant);
	const products = ref<IProduct[]>([]);
	const messages = ref<IMessage[]>([]);
	const rsvps = ref<IRsvp[]>([]);
	const purchases = ref<IPurchase[]>([]);

	const loading = ref(true);
	const error = ref<string | null>(null);

	const fetchTenant = async (slug: string) => {
		loading.value = true;
		error.value = null;
		try {
			const result = await TenantService.getBySlug(slug);

			products.value = result?.products || [];
			messages.value = result.messages || [];
			rsvps.value = result.rsvps || [];
			purchases.value = await PurchaseService.listByTenant(result.$id);

			if (result) {
				tenant.value = result;
				if (tenant.value.primary_color) {
					applyTheme(tenant.value.primary_color);
				}
			} else {
				error.value = "Tenant not found";
				tenant.value = {} as ITenant;
			}
		} catch (err) {
			console.error("Error fetching tenant:", err);
			error.value = "Failed to load tenant details";
		} finally {
			loading.value = false;
		}
	};

	const applyTheme = (color: string) => {
		if (color) {
			document.documentElement.style.setProperty("--color-primary", color);
		}
	};

	onMounted(() => {
		const currentSlug = route.params.slug as string;
		if (currentSlug) {
			if (tenant.value?.slug === currentSlug) {
				loading.value = false;
				if (tenant.value.primary_color) {
					applyTheme(tenant.value.primary_color);
				}
			} else {
				fetchTenant(currentSlug);
			}
		}
	});

	watch(
		() => route.params.slug,
		(newSlug) => {
			if (newSlug && tenant.value?.slug !== newSlug) {
				fetchTenant(newSlug as string);
			}
		},
	);

	return {
		tenant,
		products,
		messages,
		rsvps,
		purchases,
		loading,
		error,
		fetchTenant,
	};
}
