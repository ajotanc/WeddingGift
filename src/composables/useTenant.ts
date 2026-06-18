import { sortBy } from "@/lib/utils";
import { FaqService, type IFaq } from "@/services/faq.service";
import { GalleryService, type IGalleryImage } from "@/services/gallery.service";
import type { IMessage } from "@/services/message.service";
import type { IProduct } from "@/services/product.service";
import type { IPurchase } from "@/services/purchase.service";
import { PurchaseService } from "@/services/purchase.service";
import type { IRsvp } from "@/services/rsvp.service";
import {
	type IScheduleItem,
	ScheduleService,
} from "@/services/schedule.service";
import { type ITenant, TenantService } from "@/services/tenant.service";
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

export function useTenant() {
	const route = useRoute();

	// 1. Mudado para aceitar null em vez de um objeto vazio enganoso
	const tenant = ref<ITenant | null>(null);
	const products = ref<IProduct[]>([]);
	const messages = ref<IMessage[]>([]);
	const rsvps = ref<IRsvp[]>([]);
	const purchases = ref<IPurchase[]>([]);
	const gallery = ref<IGalleryImage[]>([]);
	const faqs = ref<IFaq[]>([]);
	const schedules = ref<IScheduleItem[]>([]);

	// Começa como false para evitar travamentos falsos na Home
	const loading = ref(false);
	const error = ref<string | null>(null);

	const fetchTenant = async (slug: string) => {
		// Proteção 1: Se já estiver carregando ou o slug for inválido, não faz nada
		if (loading.value || !slug || slug.trim() === "") return;

		loading.value = true;
		error.value = null;
		try {
			const result = await TenantService.getBySlug(slug);

			if (result) {
				products.value = result?.products || [];
				messages.value = result.messages || [];
				rsvps.value = result?.rsvps || [];
				purchases.value = await PurchaseService.listByTenant(result.$id);
				gallery.value = result?.gallery || [];
				faqs.value = sortBy(result?.faqs || [], "order");
				schedules.value = sortBy(result?.schedules || [], "hour");

				tenant.value = result;

				if (tenant.value.primary_color) {
					applyTheme(tenant.value.primary_color);
				}
			} else {
				error.value = "Casamento não encontrado";
				tenant.value = null;
			}
		} catch (err) {
			console.error("Error fetching tenant:", err);
			error.value = "Falha ao carregar detalhes do casamento";
			tenant.value = null;
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
		} else {
			loading.value = false;
		}
	});

	// Proteção 2: O watch agora está blindado contra loops assíncronos
	watch(
		() => route.params.slug,
		(newSlug) => {
			if (newSlug) {
				// Só faz o fetch se o slug da URL for REALMENTE diferente do tenant atual carregado
				if (!tenant.value || tenant.value.slug !== newSlug) {
					fetchTenant(newSlug as string);
				}
			} else {
				// Se mudou para uma página sem slug (ex: Home /), limpa os estados de forma segura
				tenant.value = null;
				products.value = [];
				messages.value = [];
				rsvps.value = [];
				purchases.value = [];
				gallery.value = [];
				faqs.value = [];
				schedules.value = [];
				loading.value = false;
			}
		},
	);

	return {
		tenant,
		products,
		messages,
		rsvps,
		purchases,
		gallery,
		faqs,
		schedules,
		loading,
		error,
		fetchTenant,
	};
}
