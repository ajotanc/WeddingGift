import { sortBy } from "@/lib/utils";
import type { IFaq } from "@/services/faq.service";
import type { IGalleryImage } from "@/services/gallery.service";
import type { IMessage } from "@/services/message.service";
import type { IProduct } from "@/services/product.service";
import type { IPurchase } from "@/services/purchase.service";
import { PurchaseService } from "@/services/purchase.service";
import type { IRsvp } from "@/services/rsvp.service";
import type { IScheduleItem } from "@/services/schedule.service";
import { type ITenant, TenantService } from "@/services/tenant.service";
import { useAuthStore } from "@/stores/auth";
import { useMusicStore } from "@/stores/music";
import { DEFAULT_SLATE_COLORS } from "@/lib/defaults";
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

export interface IFontDefinition {
	googleFamily: string;
	cssFamily: string;
	name: string;
}

export const FONTS_REGISTRY: Record<string, IFontDefinition> = {
	playfair: {
		googleFamily: "Playfair+Display:ital,wght@0,400;0,600;1,400",
		cssFamily: '"Playfair Display", serif',
		name: "Playfair Display",
	},
	cormorant: {
		googleFamily: "Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400",
		cssFamily: '"Cormorant Garamond", serif',
		name: "Cormorant Garamond",
	},
	lora: {
		googleFamily: "Lora:ital,wght@0,400;0,600;1,400",
		cssFamily: '"Lora", serif',
		name: "Lora",
	},
	cinzel: {
		googleFamily: "Cinzel:wght@400;600;700",
		cssFamily: '"Cinzel", serif',
		name: "Cinzel",
	},
	greatVibes: {
		googleFamily: "Great+Vibes",
		cssFamily: '"Great Vibes", cursive',
		name: "Great Vibes",
	},
	sacramento: {
		googleFamily: "Sacramento",
		cssFamily: '"Sacramento", cursive',
		name: "Sacramento",
	},
	inter: {
		googleFamily: "Inter:wght@300;400;500;600;700",
		cssFamily: '"Inter", sans-serif',
		name: "Inter",
	},
	outfit: {
		googleFamily: "Outfit:wght@300;400;500;600;700",
		cssFamily: '"Outfit", sans-serif',
		name: "Outfit",
	},
	montserrat: {
		googleFamily: "Montserrat:wght@300;400;500;600;700",
		cssFamily: '"Montserrat", sans-serif',
		name: "Montserrat",
	},
	quicksand: {
		googleFamily: "Quicksand:wght@400;500;600;700",
		cssFamily: '"Quicksand", sans-serif',
		name: "Quicksand",
	},
	dancingScript: {
		googleFamily: "Dancing+Script:wght@400;600;700",
		cssFamily: '"Dancing Script", cursive',
		name: "Dancing Script",
	},
	alexBrush: {
		googleFamily: "Alex+Brush",
		cssFamily: '"Alex Brush", cursive',
		name: "Alex Brush",
	},
	monsieurLaDoulaise: {
		googleFamily: "Monsieur+La+Doulaise",
		cssFamily: '"Monsieur La Doulaise", cursive',
		name: "Monsieur La Doulaise",
	},
	playfairDisplaySc: {
		googleFamily: "Playfair+Display+SC:wght@400;600;700",
		cssFamily: '"Playfair Display SC", serif',
		name: "Playfair Display SC",
	},
	cardo: {
		googleFamily: "Cardo:ital,wght@0,400;0,700;1,400",
		cssFamily: '"Cardo", serif',
		name: "Cardo",
	},
};

export const FONT_ALIASES: Record<string, string> = {
	serif: "playfair",
	sans: "inter",
};

export function loadGoogleFont(fontKey: string) {
	const key = FONT_ALIASES[fontKey] || fontKey;
	const font = FONTS_REGISTRY[key];
	if (!font) return;

	const linkId = `google-font-${key}`;
	if (document.getElementById(linkId)) return;

	const link = document.createElement("link");
	link.id = linkId;
	link.rel = "stylesheet";
	link.href = `https://fonts.googleapis.com/css2?family=${font.googleFamily}&display=swap`;
	document.head.appendChild(link);
}

export function useTenant() {
	const route = useRoute();
	const { sanitizeTenant, isPremium } = useAuthStore();
	const music = useMusicStore();

	// 1. Mudado para aceitar null em vez de um objeto vazio enganoso
	const tenant = ref<ITenant | null>(null);
	const products = ref<IProduct[]>([]);
	const messages = ref<IMessage[]>([]);
	const rsvps = ref<IRsvp[]>([]);
	const purchases = ref<IPurchase[]>([]);
	const gallery = ref<IGalleryImage[]>([]);
	const faqs = ref<IFaq[]>([]);
	const schedules = ref<IScheduleItem[]>([]);

	// Começa como true se houver slug na rota para evitar flashes da cor rosa padrão antes do fetch terminar
	const loading = ref(!!route.params.slug);
	const error = ref<string | null>(null);

	const fetchTenant = async (slug: string) => {
		// Proteção 1: Se o slug for inválido, não faz nada
		if (!slug || slug.trim() === "") return;

		loading.value = true;
		error.value = null;
		try {
			const data = await TenantService.getBySlug(slug);

			if (data) {
				products.value = data?.products || [];
				messages.value = data.messages || [];
				rsvps.value = data?.rsvps || [];
				purchases.value = await PurchaseService.listByTenant(data.$id);
				gallery.value = data?.gallery || [];
				faqs.value = sortBy(data?.faqs || [], "order");
				schedules.value = sortBy(data?.schedules || [], "hour");

				tenant.value = sanitizeTenant(data);

				music.musicUrl = data.music_url ?? null;
				music.isPremium = isPremium;
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

	const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
		hex = hex.replace(/^#/, "");
		if (hex.length === 3) {
			hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
		}
		const r = Number.parseInt(hex.substring(0, 2), 16) / 255;
		const g = Number.parseInt(hex.substring(2, 4), 16) / 255;
		const b = Number.parseInt(hex.substring(4, 6), 16) / 255;

		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		let h = 0;
		let s = 0;
		const l = (max + min) / 2;

		if (max !== min) {
			const d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch (max) {
				case r:
					h = (g - b) / d + (g < b ? 6 : 0);
					break;
				case g:
					h = (b - r) / d + 2;
					break;
				case b:
					h = (r - g) / d + 4;
					break;
			}
			h /= 6;
		}

		return {
			h: Math.round(h * 360),
			s: Math.round(s * 100),
			l: Math.round(l * 100),
		};
	};
 
	const hslToHex = (h: number, s: number, l: number): string => {
		s /= 100;
		l /= 100;
		const k = (n: number) => (n + h / 30) % 12;
		const a = s * Math.min(l, 1 - l);
		const f = (n: number) => {
			const color = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
			return Math.round(255 * color)
				.toString(16)
				.padStart(2, "0");
		};
		return `#${f(0)}${f(8)}${f(4)}`;
	};

	const applyTheme = (
		color: string,
		titleFont?: string | null,
		bodyFont?: string | null,
		textColor?: string | null,
	) => {
		console.log("applyTheme executing with:", { color, titleFont, bodyFont, textColor });
		if (color) {
			document.documentElement.style.setProperty("--color-primary", color);
		}
		if (textColor) {
			try {
				const { h, s } = hexToHsl(textColor);
				console.log(`Setting slate variables for textColor ${textColor}: H=${h}, S=${s}`);
				document.documentElement.style.setProperty("--color-slate-950", hslToHex(h, s, 8));
				document.documentElement.style.setProperty("--color-slate-900", hslToHex(h, s, 12));
				document.documentElement.style.setProperty("--color-slate-800", hslToHex(h, s, 20));
				document.documentElement.style.setProperty("--color-slate-700", hslToHex(h, s, 30));
				document.documentElement.style.setProperty("--color-slate-600", textColor);
				document.documentElement.style.setProperty("--color-slate-500", hslToHex(h, s, 55));
				document.documentElement.style.setProperty("--color-slate-400", hslToHex(h, s, 70));
				document.documentElement.style.setProperty("--color-slate-300", hslToHex(h, s, 82));
				document.documentElement.style.setProperty("--color-slate-200", hslToHex(h, s, 90));
				document.documentElement.style.setProperty("--color-slate-100", hslToHex(h, s, 95));
				document.documentElement.style.setProperty("--color-slate-50", hslToHex(h, s, 98));
			} catch (e) {
				console.error("Invalid text color format", e);
			}
		} else {
			console.log("No textColor provided, resetting slate to defaults");
			for (const [shade, hex] of Object.entries(DEFAULT_SLATE_COLORS)) {
				document.documentElement.style.setProperty(`--color-slate-${shade}`, hex);
			}
		}

		if (titleFont) loadGoogleFont(titleFont);
		if (bodyFont) loadGoogleFont(bodyFont);

		const resolvedTitleKey = FONT_ALIASES[titleFont || ""] || titleFont || "";
		const resolvedBodyKey = FONT_ALIASES[bodyFont || ""] || bodyFont || "";

		const titleFamily =
			FONTS_REGISTRY[resolvedTitleKey]?.cssFamily ||
			'"Playfair Display", serif';
		const bodyFamily =
			FONTS_REGISTRY[resolvedBodyKey]?.cssFamily || '"Inter", sans-serif';

		document.documentElement.style.setProperty("--font-title", titleFamily);
		document.documentElement.style.setProperty("--font-body", bodyFamily);
	};

	// Watch tenant dynamically to apply theme updates reactively
	watch(
		tenant,
		(newTenant) => {
			if (newTenant && newTenant.primary_color) {
				applyTheme(
					newTenant.primary_color,
					newTenant.title_font,
					newTenant.body_font,
					newTenant.text_color,
				);
			}
		},
		{ deep: true, immediate: true },
	);

	onMounted(() => {
		const currentSlug = route.params.slug as string;
		if (currentSlug) {
			if (tenant.value?.slug === currentSlug) {
				loading.value = false;
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
