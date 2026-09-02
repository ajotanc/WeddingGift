<script setup lang="ts">
import dayjs from "dayjs";
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import "dayjs/locale/pt-br";
import { useTenant } from "@/composables/useTenant";
import { EFFECT_CONFIGS, type Particle } from "@/lib/effect";
import { formatMoney, getProductPrice } from "@/lib/money";
import { generatePixPayload, isMobile } from "@/lib/utils";
import { EmailService } from "@/services/email.service";
import { GalleryService } from "@/services/gallery.service";
import type { IGalleryImage } from "@/services/gallery.service";
import { PaymentService } from "@/services/payment.service";
import { type IProduct, ProductService } from "@/services/product.service";
import { type MethodType, PurchaseService } from "@/services/purchase.service";
import { AppwriteException } from "appwrite";
import { type IWeatherData, WeatherService } from "@/services/weather.service";
import { useAuthStore } from "@/stores/auth";
import { ChevronUp, Loader2 } from "lucide-vue-next";
import { toast } from "vue-sonner";

import GuestProfileModal from "@/components/GuestProfileModal.vue";
import Modal from "@/components/reusable/Modal.vue";
import CountdownTimer from "@/components/ui/CountdownTimer.vue";
// UI Components
import GoogleAuthButton from "@/components/ui/GoogleAuthButton.vue";
import QrcodeSvg from "qrcode.vue";

import DressCodeSection from "@/components/public/DressCodeSection.vue";
import FaqSection from "@/components/public/FaqSection.vue";
import FooterSection from "@/components/public/FooterSection.vue";
import GallerySection from "@/components/public/GallerySection.vue";
// Modular Public Section Components
import HistorySection from "@/components/public/HistorySection.vue";
import LocationSection from "@/components/public/LocationSection.vue";
import ProductsSection from "@/components/public/ProductsSection.vue";
import QuizSection from "@/components/public/QuizSection.vue";
import RsvpMessageSection from "@/components/public/RsvpMessageSection.vue";
import ScheduleSection from "@/components/public/ScheduleSection.vue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRoute } from "vue-router";

dayjs.locale("pt-br");

const route = useRoute();
const isDesktop = computed(() => !isMobile());

const {
	tenant,
	products,
	purchases,
	messages,
	rsvps,
	gallery,
	faqs,
	quizzes,
	loading,
	error,
	fetchTenant,
} = useTenant();
const authStore = useAuthStore();

const currentUser = computed(() => authStore.user);
const showProfileModal = ref(false);

const currentQty = computed(() => {
	if (!selectedProduct.value) return 1;
	return quotaQuantities.value[selectedProduct.value.$id] || 1;
});

const productList = computed(() => {
	const productPix = {
		$id: "custom-pix-amount",
		type: "quota",
		name: "Contribuição Livre",
		price: "10",
		desired_quantity: 9999,
		claimed_quantity: 0,
		is_custom_amount: true,
		category: "pix",
	} as IProduct;

	return [productPix, ...products.value];
});

const requireAuth = async (): Promise<boolean> => {
	if (currentUser.value) return true;
	try {
		await authStore.loginWithGoogle(window.location.href, window.location.href);
		return true;
	} catch (err) {
		console.error("Erro na autenticação", err);
		return false;
	}
};

const logout = async () => {
	await authStore.logout();
};

// Modals State
const showPixModal = ref(false);
const showLinksModal = ref(false);
const selectedProduct = ref<IProduct | null>(null);
const quotaQuantities = ref<Record<string, number>>({});
const pixPayload = ref({ payload: "", base64: "" });
const isGeneratingMpPix = ref(false);
const mpPixData = ref<{
	qr_code: string;
	qr_code_base64: string;
	paymentId?: number;
} | null>(null);
const customPixAmount = ref<number>(10);

const isCustomPix = computed(() =>
	Boolean(
		selectedProduct.value?.category === "pix" &&
			selectedProduct.value?.is_custom_amount,
	),
);

const activePixPrice = computed(() => {
	if (isCustomPix.value) {
		return Math.max(1, Number(customPixAmount.value) || 10);
	}
	if (!selectedProduct.value) return 0;
	return getProductPrice(selectedProduct.value, currentQty.value);
});

const updatePixPaymentData = async () => {
	if (!selectedProduct.value || !showPixModal.value) return;

	const price = activePixPrice.value;
	mpPixData.value = null;

	if (tenant.value?.mp_access_token && currentUser.value) {
		isGeneratingMpPix.value = true;
		try {
			const mpRes = await PaymentService.createGiftPixPayment({
				tenantId: tenant.value.$id,
				productId: selectedProduct.value.$id,
				productName: selectedProduct.value.name,
				quantity: 1,
				price,
				guestName: currentUser.value.name,
				guestEmail: currentUser.value.email,
				guestId: currentUser.value.$id,
			});
			mpPixData.value = {
				qr_code: mpRes.qr_code,
				qr_code_base64: mpRes.qr_code_base64,
				paymentId: mpRes.paymentId,
			};
		} catch (err) {
			console.warn("Mercado Pago PIX indisponível, usando PIX estático:", err);
		} finally {
			isGeneratingMpPix.value = false;
		}
	}

	if (!mpPixData.value?.qr_code && tenant.value?.pix_key) {
		pixPayload.value = await generatePixPayload(
			tenant.value.pix_key,
			tenant.value.couple_name || "Noivos",
			String(price),
			`Presente: ${selectedProduct.value.name}`,
			selectedProduct.value.$id,
		);
	}
};

watch(
	[activePixPrice, showPixModal],
	() => {
		if (showPixModal.value && selectedProduct.value) {
			updatePixPaymentData();
		}
	},
	{ immediate: false },
);

const openPixModal = async (data: { product: IProduct; quantity?: number }) => {
	if (!currentUser.value) return;
	selectedProduct.value = data.product;
	const qty = data.quantity || 1;
	quotaQuantities.value[data.product.$id] = qty;
	if (data.product.category === "pix") {
		customPixAmount.value = 10;
	}
	showPixModal.value = true;
	await updatePixPaymentData();
};

const openLinksModal = async (data: {
	product: IProduct;
	quantity?: number;
}) => {
	if (!currentUser.value) return;
	if (data.product.links && data.product.links.length > 0) {
		selectedProduct.value = data.product;
		quotaQuantities.value[data.product.$id] = data.quantity || 1;
		showLinksModal.value = true;
	}
};

const copyPix = () => {
	const codeToCopy = mpPixData.value?.qr_code || pixPayload.value.payload;
	if (codeToCopy) {
		navigator.clipboard.writeText(codeToCopy);
		toast.success("Chave PIX copiada!");
	} else {
		toast.error("Nenhum código PIX disponível.");
	}
};

const confirmingPurchase = ref(false);

const confirmPurchase = async (method: MethodType) => {
	if (!tenant.value || !selectedProduct.value) return;
	if (!authStore.guest) {
		toast.error("Por favor, identifique-se para confirmar a sua reserva.");
		requireAuth();
		return;
	}

	confirmingPurchase.value = true;
	const qty = quotaQuantities.value[selectedProduct.value.$id] || 1;
	const finalPrice = isCustomPix.value
		? activePixPrice.value
		: getProductPrice(selectedProduct.value, qty);

	try {
		let updatedProduct = selectedProduct.value;

		if (!isCustomPix.value) {
			updatedProduct = await ProductService.updateQuantity(
				selectedProduct.value.$id,
				{
					claimed_quantity: (selectedProduct.value.claimed_quantity || 0) + qty,
				},
			);

			const productIndex = products.value.findIndex(
				(p) => p.$id === updatedProduct.$id,
			);

			if (productIndex !== -1) {
				products.value[productIndex] = updatedProduct;
			}
		}

		const newGift = await PurchaseService.create({
			tenant: tenant.value.$id,
			guest: authStore.guest,
			product: updatedProduct,
			quantity: qty,
			price_paid: String(finalPrice),
			method,
		});

		purchases.value.push(newGift);

		// Dispara e-mail de confirmação de presente para o convidado
		if (authStore.guest?.email && tenant.value) {
			EmailService.sendGiftConfirmation({
				guest_name: authStore.guest.name,
				guest_email: authStore.guest.email,
				couple_name: tenant.value.couple_name,
				product_name: updatedProduct.name,
				quantity: qty,
				total_paid: finalPrice,
				image_url: updatedProduct.image_url,
				method,
			}).catch((err: unknown) => {
				const msg = err instanceof Error ? err.message : "Erro desconhecido";
				console.error("Erro ao enviar e-mail de presente:", msg);
			});
		}

		toast.success("Presente confirmado! Muito obrigado pelo carinho.");
	} catch (err) {
		console.error("Erro ao confirmar compra:", err);
		if (err instanceof AppwriteException) {
			if (err.code === 401 || err.code === 403) {
				toast.error(
					"Sua identificação expirou ou não foi reconhecida pelo navegador. Por favor, identifique-se novamente.",
				);
				requireAuth();
				return;
			}
			toast.error(`Erro ao confirmar presente: ${err.message}`);
		} else if (err instanceof Error) {
			toast.error(`Erro ao confirmar presente: ${err.message}`);
		} else {
			toast.error("Erro ao confirmar presente. Tente novamente.");
		}
	} finally {
		confirmingPurchase.value = false;
		showPixModal.value = false;
		showLinksModal.value = false;
	}
};

watch(
	() => authStore.guest,
	(guest) => {
		if (guest && !guest.phone) {
			showProfileModal.value = true;
		}
	},
	{ immediate: true },
);

// Toggle Gallery Like (emitted by GallerySection)
const toggleGalleryLike = async (img: IGalleryImage) => {
	const guestId = authStore.guest?.$id;
	if (!guestId) {
		toast.error("Erro", {
			description: "Você precisa estar identificado para curtir as fotos.",
		});
		return;
	}

	const originalLikes = [...(img.likes || [])];
	const isLiked = img.likes?.includes(guestId);

	if (isLiked) {
		img.likes = img.likes?.filter((id) => id !== guestId);
	} else {
		img.likes = [...(img.likes || []), guestId];
	}

	try {
		await GalleryService.updateLikes(img.$id, img.likes || []);
	} catch (err) {
		img.likes = originalLikes;
		toast.error("Erro", { description: "Falha ao atualizar curtida." });
	}
};

const getTimelineItems = computed(() => {
	if (!tenant.value?.schedules) return [];
	return [...tenant.value.schedules].sort((a, b) => {
		const parseTime = (t: string) => {
			const [h, m] = (t || "").split(":").map(Number);
			return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
		};
		return parseTime(a.hour) - parseTime(b.hour);
	});
});

const homePrivateImages = computed(() => {
	return gallery.value.filter((img) => !img.guest && !img.is_public);
});

const isWithin7DaysOfEvent = computed(() => {
	if (!tenant.value?.event_date) return false;
	const eventDate = dayjs(tenant.value.event_date).startOf("day");
	const today = dayjs().startOf("day");
	const diffDays = eventDate.diff(today, "day");
	return diffDays <= 7;
});

const weatherData = ref<IWeatherData | null>(null);
const weatherLoading = ref(false);
const weatherError = ref(false);
const isWeatherExpanded = ref(false);

const loadWeather = async () => {
	const lat = tenant.value?.event_latitude;
	const lng = tenant.value?.event_longitude;
	const date = tenant.value?.event_date;

	if (!lat || !lng || !date) {
		return;
	}

	weatherLoading.value = true;
	weatherError.value = false;

	try {
		const res = await WeatherService.getForecast(lat, lng, date);
		weatherData.value = res;
	} catch (e) {
		console.error("Error loading weather forecast:", e);
		weatherError.value = true;
	} finally {
		weatherLoading.value = false;
	}
};

watch(
	[
		() => tenant.value?.event_latitude,
		() => tenant.value?.event_longitude,
		() => tenant.value?.event_date,
	],
	([lat, lng, date]) => {
		if (lat && lng && date) {
			loadWeather();
		}
	},
	{ immediate: true },
);

// Scroll Navigation & Scroll To Top
const currentSection = ref("home");
const showBackToTop = ref(false);

const activeSections = computed(() => {
	if (!tenant.value) return [];
	const list = [{ id: "home", label: "Início" }];
	if (tenant.value.couple_history)
		list.push({ id: "history", label: "Nossa História" });
	if (tenant.value.show_schedule && tenant.value.schedules?.length)
		list.push({ id: "schedule", label: "Cronograma" });
	if (tenant.value.show_gallery)
		list.push({ id: "gallery", label: "Galeria de Fotos" });
	if (currentUser.value) {
		list.push({ id: "gifts", label: "Lista de Presentes" });
		if (isDesktop.value) {
			list.push({ id: "rsvp", label: "Presença & Recados" });
		} else {
			list.push({ id: "rsvp", label: "Confirmar Presença" });
			list.push({ id: "messages", label: "Mural de Recados" });
		}
	}
	if (tenant.value.event_location)
		list.push({ id: "location", label: "Local do Evento" });
	if (tenant.value.show_dress_code && tenant.value.dress_code_text)
		list.push({ id: "dresscode", label: "Guia de Trajes" });
	if (tenant.value.show_quiz && quizzes.value?.length)
		list.push({ id: "quiz", label: "Quiz do Casal" });
	if (tenant.value.show_faq && faqs.value?.length)
		list.push({ id: "faq", label: "Dúvidas Frequentes" });
	return list;
});

let observer: IntersectionObserver | null = null;
const visibleSections = ref<Record<string, boolean>>({});

const customSmoothScroll = (targetY: number, duration = 350) => {
	if (typeof window === "undefined") return;
	const startPosition = window.scrollY;
	const distance = targetY - startPosition;

	if (Math.abs(distance) < 5) {
		window.scrollTo({ top: targetY, behavior: "instant" as ScrollBehavior });
		return;
	}

	let start: number | null = null;

	// Curva ágil e suave de desaceleração (ease-out cubic)
	const ease = (t: number) => 1 - (1 - t) ** 3;

	const step = (timestamp: number) => {
		if (!start) start = timestamp;
		const progress = timestamp - start;
		const time = Math.min(progress / duration, 1);
		window.scrollTo({
			top: startPosition + distance * ease(time),
			behavior: "instant" as ScrollBehavior,
		});
		if (progress < duration) {
			window.requestAnimationFrame(step);
		}
	};

	window.requestAnimationFrame(step);
};

const handleScroll = () => {
	if (typeof window !== "undefined") {
		showBackToTop.value = window.scrollY > 400;
		if (window.scrollY < 200) {
			currentSection.value = "home";
		}
	}
};

const scrollToTop = () => {
	customSmoothScroll(0, 350);
};

const setupScrollSpy = () => {
	if (typeof window === "undefined" || !("IntersectionObserver" in window))
		return;
	if (observer) {
		observer.disconnect();
	}

	window.removeEventListener("scroll", handleScroll);
	window.addEventListener("scroll", handleScroll, { passive: true });

	observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				visibleSections.value[entry.target.id] = entry.isIntersecting;
			}

			if (window.scrollY < 200) {
				currentSection.value = "home";
				return;
			}

			const intersecting = activeSections.value.filter(
				(s) => visibleSections.value[s.id],
			);
			if (intersecting.length > 0) {
				let bestSection = intersecting[0].id;
				let minDistance = Number.POSITIVE_INFINITY;
				for (const s of intersecting) {
					const el = document.getElementById(s.id);
					if (el) {
						const rect = el.getBoundingClientRect();
						const dist = Math.abs(rect.top - 80);
						if (dist < minDistance) {
							minDistance = dist;
							bestSection = s.id;
						}
					}
				}
				currentSection.value = bestSection;
			}
		},
		{
			rootMargin: "-80px 0px -40% 0px",
			threshold: 0,
		},
	);

	for (const section of activeSections.value) {
		const el = document.getElementById(section.id);
		if (el) {
			observer.observe(el);
		}
	}
};

watch(
	() => [loading.value, activeSections.value],
	() => {
		nextTick(() => {
			setupScrollSpy();
		});
	},
	{ immediate: true, deep: true, flush: "post" },
);

const scrollToSection = (id: string, event?: MouseEvent) => {
	if (event) {
		(event.currentTarget as HTMLElement)?.blur();
	}
	if (document.activeElement instanceof HTMLElement) {
		document.activeElement.blur();
	}
	if (id === "home") {
		customSmoothScroll(0, 350);
		return;
	}
	const el = document.getElementById(id);
	if (el) {
		const rect = el.getBoundingClientRect();
		const targetY = rect.top + window.scrollY - 60;
		customSmoothScroll(targetY, 350);
	}
};

// --- Premium Ambient Particle Effects ---
const effectCanvas = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;
let cleanupEffect: (() => void) | null = null;

let particles: Particle[] = [];

const initParticles = () => {
	if (cleanupEffect) {
		cleanupEffect();
	}

	const canvas = effectCanvas.value;
	if (!canvas) return;
	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	const resizeCanvas = () => {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
	};
	resizeCanvas();
	window.addEventListener("resize", resizeCanvas);

	const effect = tenant.value?.ambient_effect;
	if (!effect || effect === "none") return;

	const config = EFFECT_CONFIGS[effect];
	if (!config) return;

	const maxParticles = config.maxParticles;
	particles = [];

	const createParticle = (initY = false) => {
		const x = Math.random() * canvas.width;
		const y = config.createY(canvas.height, initY);
		const size = config.size();
		const speedX = config.speedX();
		const speedY = config.speedY();
		const opacity = config.opacity();

		const fadeSpeed = config.fadeSpeed
			? config.fadeSpeed(opacity, speedY, y, canvas.height)
			: undefined;

		const rotation = config.rotation ? config.rotation() : undefined;
		const rotationSpeed = config.rotationSpeed
			? config.rotationSpeed()
			: undefined;

		return {
			x,
			y,
			size,
			speedX,
			speedY,
			opacity,
			fadeSpeed,
			rotation,
			rotationSpeed,
		};
	};

	for (let i = 0; i < maxParticles; i++) {
		particles.push(createParticle(true));
	}

	const animate = () => {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		for (let i = 0; i < particles.length; i++) {
			const p = particles[i];

			config.updatePhysics(p, canvas.height);
			config.draw(ctx, p, canvas.height);

			if (config.shouldReset(p, canvas.width, canvas.height)) {
				particles[i] = createParticle(false);
			}
		}

		animationFrameId = requestAnimationFrame(animate);
	};

	animate();

	cleanupEffect = () => {
		window.removeEventListener("resize", resizeCanvas);
		if (animationFrameId) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
	};
};

watch([() => tenant.value?.ambient_effect, effectCanvas], () => {
	if (cleanupEffect) {
		cleanupEffect();
	}
	if (
		effectCanvas.value &&
		tenant.value?.ambient_effect &&
		tenant.value.ambient_effect !== "none"
	) {
		initParticles();
	}
});

const handleVisibility = () => {
	if (document.visibilityState === "visible" && route.params.slug) {
		fetchTenant(route.params.slug as string);
	}
};

onMounted(() => {
	document.addEventListener("visibilitychange", handleVisibility);
});

onUnmounted(() => {
	document.removeEventListener("visibilitychange", handleVisibility);

	if (observer) {
		observer.disconnect();
	}
	if (cleanupEffect) {
		cleanupEffect();
	}
});
</script>

<template>
	<main class="min-h-screen font-sans text-slate-600 relative"
		:style="{ backgroundColor: tenant?.background_color || '#fafafa' }">
		<div v-if="loading"
			class="fixed inset-0 flex flex-col items-center justify-center p-6 text-center z-[999] animate-in fade-in-0 duration-500"
			:style="{ backgroundColor: tenant?.background_color || '#fafafa' }">
			<div class="relative flex items-center justify-center mb-6">
				<!-- Pulse decoration -->
				<div class="absolute w-16 h-16 rounded-full bg-primary/20 animate-ping duration-1000"></div>
				<!-- Spinner -->
				<div class="w-12 h-12 rounded-full border-4 border-slate-100 border-t-primary animate-spin"></div>
			</div>
			<h2 class="font-serif text-2xl md:text-3xl text-slate-900 tracking-wide mb-2">Carregando experiência</h2>
			<p class="text-slate-400 text-sm font-light tracking-wider animate-pulse">Preparando todos os detalhes com
				carinho...</p>
		</div>
		<div v-else-if="error" class="text-center p-20 text-red-500 font-medium">{{ error }}</div>
		<template v-else-if="tenant">
			<GoogleAuthButton @click="currentUser ? showProfileModal = true : requireAuth()" @logout="logout"
				:user="currentUser || undefined" :fill="false" class="button-google" />
			<!-- Canvas for Visual Effects -->
			<canvas ref="effectCanvas" class="fixed inset-0 w-full pointer-events-none z-[40]"></canvas>

			<!-- Header Hero -->
			<header id="home" :style="{ backgroundColor: tenant.background_color || 'transparent' }"
				class="relative flex items-center justify-center w-full h-dvh text-center overflow-hidden px-6 md:px-12">

				<!-- Background Image Layer -->
				<div v-if="tenant.background_image"
					class="absolute inset-0 bg-cover bg-center [-webkit-mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)] [mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)]"
					:style="{ backgroundImage: `url(${tenant.background_image})` }"></div>

				<!-- Blur Overlay Layer (Smooth fade to background_color at bottom) -->
				<div class="hidden absolute inset-0 bg-white/10"></div>
				<div
					class="hidden absolute inset-0 backdrop-blur-md [-webkit-mask-image:linear-gradient(to_top,black,transparent)] [mask-image:linear-gradient(to_top,black,transparent)]"
					:style="tenant.background_color ? { background: `linear-gradient(to top, ${tenant.background_color}, transparent)` } : {}"
					:class="!tenant.background_color ? 'bg-gradient-to-t from-slate-50 to-transparent' : ''">
				</div>

				<div class="relative flex flex-col items-center justify-center max-w-4xl z-10">
					<img v-if="tenant.logo_url" :src="tenant.logo_url" :alt="tenant.couple_name"
						class="w-32 h-32 md:w-40 md:h-40 object-contain mb-6 transition-all">

					<h1 class="text-[2.5rem] md:text-7xl font-serif text-slate-900 mb-6 tracking-tight leading-tight select-none">
						{{
							tenant.couple_name }}</h1>

					<p v-if="tenant?.quote"
						class="text-xs md:text-base text-slate-900/60 font-medium max-w-md leading-relaxed text-center mb-6">
						{{
							tenant?.quote }}</p>

					<!-- Event Date & Time Display -->
					<div v-if="tenant.event_date" class="text-primary font-serif font-bold italic text-xl tracking-wide">
						{{ dayjs(tenant.event_date).format('DD [de] MMMM [de] YYYY') }} às {{ tenant.event_time }}
					</div>

					<!-- Countdown -->
					<div v-if="tenant.event_date && tenant?.show_countdown !== false" class="mt-6">
						<CountdownTimer :eventDate="tenant.event_date" />
					</div>
					<div class="w-12 h-[1px] mx-auto mt-12 bg-primary/50"></div>
				</div>
			</header>

			<div class="max-w-5xl mx-auto p-6 md:p-12 lg:py-32 space-y-24 md:space-y-32">

				<!-- Couple History -->
				<HistorySection v-if="tenant.couple_history" :history-text="tenant.couple_history" />

				<!-- Event Timeline -->
				<ScheduleSection v-if="tenant.show_schedule && tenant.schedules && tenant.schedules.length > 0"
					:schedules="getTimelineItems" />

				<!-- Gallery -->
				<GallerySection v-if="tenant.show_gallery" :images="homePrivateImages"
					:is-within7-days-of-event="isWithin7DaysOfEvent" :slug="tenant.slug"
					:current-guest-id="authStore.guest?.$id || ''" @like="toggleGalleryLike" />

				<section v-if="!currentUser"
					class="text-center p-6 bg-white/50 backdrop-blur rounded-3xl border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] mt-12">
					<div class="max-w mx-auto space-y-6">
						<div
							class="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
							<svg class="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
							</svg>
						</div>
						<h2 class="text-2xl font-serif text-slate-900">Queremos muito sua participação!</h2>
						<p class="text-slate-500 font-light leading-relaxed">
							Para que possamos preparar tudo com muito carinho, identifique-se de forma rápida e segura. Assim você
							poderá confirmar sua presença (RSVP), escolher um presente especial de nossa lista e nos enviar uma
							mensagem de felicitações!
						</p>
						<GoogleAuthButton @click="requireAuth" :fill="true" class="mx-auto" />
					</div>
				</section>

				<template v-else>
					<!-- Products -->
					<ProductsSection :products="productList" :tenant="tenant" :current-user="currentUser" @open-pix="openPixModal"
						@open-links="openLinksModal" />

					<!-- RSVP & Message Wall -->
					<RsvpMessageSection :tenant="tenant" :rsvps="rsvps" :messages="messages" :current-user="currentUser" />
				</template>

				<!-- Event Location Map -->
				<LocationSection v-if="tenant.event_location" :event-location="tenant.event_location"
					:event-latitude="tenant.event_latitude" :event-longitude="tenant.event_longitude"
					:event-date="tenant.event_date" :event-time="tenant.event_time" :couple-name="tenant.couple_name"
					:weather-data="weatherData" :weather-loading="weatherLoading" :weather-error="weatherError"
					v-model:is-weather-expanded="isWeatherExpanded" />

				<!-- Dress Code Guide -->
				<DressCodeSection v-if="tenant.show_dress_code && tenant.dress_code_text"
					:dress-code-text="tenant.dress_code_text" />

				<!-- Couple Quiz -->
				<QuizSection v-if="tenant.show_quiz" :quizzes="quizzes" :couple-name="tenant.couple_name" />

				<!-- FAQ Section -->
				<FaqSection v-if="tenant.show_faq && faqs && faqs.length > 0" :faqs="faqs" />

			</div>

			<!-- Footer -->
			<FooterSection :tenant="tenant" />

		</template>
		<div v-else class="text-center p-20 space-y-4">
			<h2 class="text-2xl font-serif text-slate-800">Página não encontrada</h2>
			<p class="text-slate-500 max-w-md mx-auto">
				O link de casamento que você tentou acessar não existe ou ainda não foi configurado pelos noivos.
			</p>
			<router-link to="/" class="inline-block text-primary font-medium hover:underline pt-2">
				Voltar para o início
			</router-link>
		</div>

		<!-- PIX Modal -->
		<Modal v-model:open="showPixModal"
			:title="selectedProduct?.type === 'quota' ? 'Pagamento da Cota PIX' : 'Presentear com Valor (PIX)'">
			<div v-if="selectedProduct" class="space-y-5 pt-2 text-center">
				<p class="text-xs uppercase tracking-widest font-bold text-primary">Transferência PIX</p>
				<p class="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
					Escaneie o QR Code abaixo para presentear os noivos <strong>{{ tenant?.couple_name }}</strong> de forma direta
					e
					segura.
				</p>

				<div
					class="flex justify-center bg-white p-4 rounded-2xl border border-slate-100 max-w-[220px] mx-auto shadow-xs min-h-[190px] items-center">
					<div v-if="isGeneratingMpPix" class="flex flex-col items-center gap-2 py-6 text-slate-500">
						<Loader2 class="w-8 h-8 animate-spin text-primary" />
						<span class="text-xs">Gerando PIX no Mercado Pago...</span>
					</div>
					<template v-else>
						<img v-if="mpPixData?.qr_code_base64" :src="`data:image/png;base64,${mpPixData.qr_code_base64}`"
							alt="QR Code PIX Mercado Pago" class="w-[170px] h-[170px] object-contain" />
						<qrcode-svg v-else-if="mpPixData?.qr_code || pixPayload.payload"
							:value="mpPixData?.qr_code || pixPayload.payload" :size="170" level="H" />
						<p v-else class="text-xs text-slate-400">QR Code indisponível.</p>
					</template>
				</div>

				<div class="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100/80">
					<div v-if="isCustomPix" class="space-y-3 text-center">
						<p class="text-xs uppercase font-bold text-primary">Contribuição Livre</p>

						<div class="w-40 mx-auto">
							<Input v-model.number="customPixAmount" type="number" step="0.01" min="1"
								class="h-11 rounded-xl bg-white border-slate-200 text-center font-bold text-base text-slate-900 shadow-xs focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
						</div>

						<div class="flex justify-center gap-1.5 pt-1 flex-wrap">
							<button v-for="val in [25, 50, 100, 200]" :key="val" type="button" @click="customPixAmount = val"
								class="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
								:class="customPixAmount === val ? 'bg-primary text-white border-primary shadow-xs font-bold' : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50'">
								R$ {{ val }}
							</button>
						</div>
					</div>
					<template v-else>
						<p class="text-3xl font-serif font-bold text-slate-900 italic">
							{{ formatMoney(activePixPrice) }}
						</p>

						<div class="flex flex-col gap-0.5 pt-1">
							<p v-if="selectedProduct?.name" class="text-sm font-semibold text-primary">{{ selectedProduct.name }}</p>
							<p class="text-xs text-slate-400 font-light">
								Quantidade selecionada: {{ currentQty }}
								{{ selectedProduct?.type === 'quota' ? 'cota(s)' : 'unidade(s)' }}
							</p>
						</div>
					</template>
				</div>

				<div class="flex flex-col sm:flex-row gap-3 mt-4">
					<Button
						class="flex-1 rounded-xl text-primary border-primary hover:bg-slate-50 font-semibold text-xs uppercase tracking-wider py-2.5 h-11"
						variant="outline" @click="copyPix">
						Copiar Código Pix
					</Button>
					<Button v-if="!tenant?.mp_user_id"
						class="flex-1 rounded-xl text-white hover:brightness-105 active:scale-[0.98] transition-all font-semibold text-xs uppercase tracking-wider py-2.5 bg-primary border-primary h-11"
						:disabled="confirmingPurchase" @click="confirmPurchase('pix')">
						{{ confirmingPurchase ? 'Confirmando...' : 'Confirmar Envio' }}
					</Button>
				</div>

				<div v-if="mpPixData?.qr_code"
					class="flex items-center justify-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
					<span class="relative flex h-2 w-2">
						<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
						<span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
					</span>
					<span>Aguardando PIX... O presente é confirmado automaticamente ao pagar.</span>
				</div>
			</div>
		</Modal>

		<!-- Store Links Modal -->
		<Modal v-model:open="showLinksModal" :title="selectedProduct?.name">
			<div class="space-y-6 pt-4 text-center">
				<p class="text-xs text-primary uppercase tracking-widest font-bold">Comprar na Loja</p>
				<p class="text-sm text-slate-600 font-light max-w-xs mx-auto leading-relaxed">
					Escolha uma das lojas abaixo para adquirir as
					<strong class="text-primary">{{ currentQty }} unidade(s)</strong> de presente.
				</p>

				<div class="space-y-3 max-w-xs mx-auto">
					<a v-for="(link, i) in selectedProduct?.links" :key="i" :href="link.url" target="_blank"
						rel="noopener noreferrer"
						class="flex items-center justify-center text-center h-12 rounded-xl border border-slate-200 hover:border-primary hover:bg-slate-50/50 transition-all group px-4">
						<span
							class="text-xs font-semibold uppercase tracking-wider text-slate-700 group-hover:text-primary transition-colors">
							Ir para a {{ link.store }}
						</span>
					</a>
				</div>

				<div class="pt-4 border-t border-slate-200/60 mt-4 max-w-xs mx-auto">
					<p class="text-xs text-slate-600 mb-4 text-center leading-relaxed">
						Após finalizar a sua compra no site da loja, confirme a reserva abaixo:
					</p>
					<Button
						class="w-full rounded-xl text-white hover:brightness-105 active:scale-[0.98] transition-all font-semibold text-xs uppercase tracking-wider py-2.5 bg-primary border-primary"
						:disabled="confirmingPurchase" @click="confirmPurchase('link')">
						<span v-if="confirmingPurchase">Confirmando...</span>
						<span v-else>Confirmar Reserva</span>
					</Button>
				</div>
			</div>
		</Modal>

		<!-- Guest Profile Modal -->
		<GuestProfileModal v-model:open="showProfileModal" :tenantPurchases="purchases" />

		<!-- Teleport Floating Index Navigation -->
		<Teleport to="body">
			<!-- Floating Vertical Navigation (Editorial Index) -->
			<div v-if="activeSections.length > 1"
				class="fixed right-3 md:right-8 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-4 items-end pointer-events-none">
				<button v-for="section in activeSections" :key="section.id" @click="scrollToSection(section.id, $event)"
					class="group relative flex items-center justify-end pointer-events-auto cursor-pointer focus:outline-none bg-transparent border-0 outline-none select-none">

					<!-- Horizontal slide-hover tag -->
					<div
						class="absolute right-5 top-1/2 -translate-y-1/2 whitespace-nowrap hidden group-hover:flex items-center transition-all duration-200 pointer-events-none z-50">
						<span
							class="text-[10px] font-bold tracking-wider uppercase font-sans px-3 py-1.5 bg-white border border-slate-200 rounded-xl shadow-md text-slate-800">
							{{ section.label }}
						</span>
					</div>

					<!-- Fine vertical bar indicator -->
					<div class="w-1.5 h-7 rounded-full transition-all duration-300 shadow-sm" :class="currentSection === section.id
						? 'bg-primary scale-y-125'
						: 'bg-slate-300'">
					</div>
				</button>
			</div>
		</Teleport>

		<!-- Floating Back To Top Button -->
		<transition enter-active-class="transition duration-300 ease-out" enter-from-class="opacity-0 translate-y-3"
			enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-200 ease-in"
			leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-3">
			<button v-if="showBackToTop" @click="scrollToTop" type="button" aria-label="Voltar ao topo"
				class="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-primary hover:border-primary/40 hover:bg-white flex items-center justify-center transition-colors duration-200 cursor-pointer">
				<ChevronUp class="w-5 h-5" />
			</button>
		</transition>
	</main>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.button-google {
	position: absolute;
	z-index: 1;
	right: 1rem;
	top: 1rem;
}
</style>
