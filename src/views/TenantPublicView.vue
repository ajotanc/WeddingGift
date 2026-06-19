<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import { useTenant } from "@/composables/useTenant";
import { useAuthStore } from "@/stores/auth";
import { type IProduct, ProductService } from "@/services/product.service";
import { type MethodType, PurchaseService } from "@/services/purchase.service";
import { type IWeatherData, WeatherService } from "@/services/weather.service";
import { GalleryService } from "@/services/gallery.service";
import type { IGalleryImage } from "@/services/gallery.service";
import { generatePixPayload, sortBy } from "@/lib/utils";
import { formatMoney, getProductPrice } from "@/lib/money";
import { toast } from "vue-sonner";

// UI Components
import GoogleAuthButton from "@/components/ui/GoogleAuthButton.vue";
import CountdownTimer from "@/components/ui/CountdownTimer.vue";
import Modal from "@/components/reusable/Modal.vue";
import QrcodeSvg from "qrcode.vue";
import GuestProfileModal from "@/components/GuestProfileModal.vue";

// Modular Public Section Components
import HistorySection from "@/components/public/HistorySection.vue";
import ScheduleSection from "@/components/public/ScheduleSection.vue";
import GallerySection from "@/components/public/GallerySection.vue";
import LocationSection from "@/components/public/LocationSection.vue";
import ProductsSection from "@/components/public/ProductsSection.vue";
import RsvpMessageSection from "@/components/public/RsvpMessageSection.vue";
import FaqSection from "@/components/public/FaqSection.vue";
import FooterSection from "@/components/public/FooterSection.vue";

dayjs.locale("pt-br");

const {
	tenant,
	products,
	purchases,
	messages,
	rsvps,
	gallery,
	faqs,
	loading,
	error,
} = useTenant();
const authStore = useAuthStore();

const currentUser = computed(() => authStore.user);
const showProfileModal = ref(false);

const currentQty = computed(() => {
	if (!selectedProduct.value) return 1;
	return quotaQuantities.value[selectedProduct.value.$id] || 1;
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

watch(
	[tenant, selectedProduct, quotaQuantities],
	async () => {
		if (!tenant.value || !selectedProduct.value) {
			pixPayload.value = { payload: "", base64: "" };
			return;
		}

		const qty = quotaQuantities.value[selectedProduct.value.$id] || 1;
		const finalPrice = getProductPrice(selectedProduct.value, qty);
		const message = `${tenant.value.couple_name} • ${selectedProduct.value.name}`;

		pixPayload.value = await generatePixPayload(
			tenant.value.pix_key,
			tenant.value.couple_name,
			String(finalPrice),
			message,
			selectedProduct.value.$id,
		);
	},
	{ immediate: true, deep: true },
);

const openPixModal = async (data: { product: IProduct; quantity?: number }) => {
	if (!currentUser.value) return;
	selectedProduct.value = data.product;
	quotaQuantities.value[data.product.$id] = data.quantity || 1;
	showPixModal.value = true;
};

const openLinksModal = async (data: { product: IProduct; quantity?: number }) => {
	if (!currentUser.value) return;
	if (data.product.links && data.product.links.length > 0) {
		selectedProduct.value = data.product;
		quotaQuantities.value[data.product.$id] = data.quantity || 1;
		showLinksModal.value = true;
	}
};

const copyPix = () => {
	navigator.clipboard.writeText(pixPayload.value.payload);
	toast.success("Chave PIX copiada!");
};

const confirmingPurchase = ref(false);

const confirmPurchase = async (method: MethodType) => {
	if (!tenant.value || !selectedProduct.value || !authStore.guest) return;

	confirmingPurchase.value = true;
	const qty = quotaQuantities.value[selectedProduct.value.$id] || 1;
	const finalPrice = getProductPrice(selectedProduct.value, qty);

	try {
		const updatedProduct = await ProductService.updatePublic(
			selectedProduct.value.$id,
			{
				claimed_quantity: selectedProduct.value.claimed_quantity + qty,
			},
		);

		const productIndex = products.value.findIndex(
			(p) => p.$id === updatedProduct.$id,
		);

		if (productIndex !== -1) {
			products.value[productIndex] = updatedProduct;
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

		toast.success("Presente confirmado! Muito obrigado pelo carinho.");
	} catch (error) {
		console.error(error);
		toast.error("Erro ao confirmar presente. Tente novamente.");
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
	return sortBy(tenant.value.schedules, "hour");
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
	if (
		!tenant.value?.event_latitude ||
		!tenant.value?.event_longitude ||
		!tenant.value?.event_date
	) {
		return;
	}

	weatherLoading.value = true;
	weatherError.value = false;

	try {
		const res = await WeatherService.getForecast(
			tenant.value.event_latitude,
			tenant.value.event_longitude,
			tenant.value.event_date,
		);
		weatherData.value = res;
	} catch (e) {
		console.error("Error loading weather forecast:", e);
		weatherError.value = true;
	} finally {
		weatherLoading.value = false;
	}
};

watch(
	tenant,
	(newTenant) => {
		if (newTenant) {
			loadWeather();
		}
	},
	{ immediate: true },
);

// Scroll Navigation & Scroll To Top
const currentSection = ref("home");

const activeSections = computed(() => {
	if (!tenant.value) return [];
	const list = [{ id: "home", label: "Início" }];
	if (tenant.value.couple_history)
		list.push({ id: "history", label: "Nossa História" });
	if (tenant.value.show_schedule && tenant.value.schedules?.length)
		list.push({ id: "schedule", label: "Cronograma" });
	if (tenant.value.show_gallery)
		list.push({ id: "gallery", label: "Galeria de Fotos" });
	if (tenant.value.event_location)
		list.push({ id: "location", label: "Local do Evento" });
	if (currentUser.value) {
		list.push({ id: "gifts", label: "Lista de Presentes" });
		list.push({ id: "rsvp", label: "Confirmar Presença" });
		list.push({ id: "messages", label: "Mural de Recados" });
	}
	if (tenant.value.show_faq && faqs.value?.length)
		list.push({ id: "faq", label: "Dúvidas Frequentes" });
	return list;
});

let observer: IntersectionObserver | null = null;
const visibleSections = ref<Record<string, boolean>>({});

const setupScrollSpy = () => {
	if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
	if (observer) {
		observer.disconnect();
	}

	observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				visibleSections.value[entry.target.id] = entry.isIntersecting;
			}

			const intersecting = activeSections.value.filter(
				(s) => visibleSections.value[s.id],
			);
			if (intersecting.length > 0) {
				currentSection.value = intersecting[intersecting.length - 1].id;
			}
		},
		{
			rootMargin: "-200px 0px -50% 0px",
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

const customSmoothScroll = (targetY: number, duration = 800) => {
	const startPosition = window.scrollY;
	const distance = targetY - startPosition;
	let start: number | null = null;

	const ease = (t: number) => {
		return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
	};

	const step = (timestamp: number) => {
		if (!start) start = timestamp;
		const progress = timestamp - start;
		const time = Math.min(progress / duration, 1);
		window.scrollTo(0, startPosition + distance * ease(time));
		if (progress < duration) {
			window.requestAnimationFrame(step);
		}
	};

	window.requestAnimationFrame(step);
};

const scrollToSection = (id: string) => {
	if (id === "home") {
		customSmoothScroll(0, 800);
		return;
	}
	const el = document.getElementById(id);
	if (el) {
		const rect = el.getBoundingClientRect();
		const targetY = rect.top + window.scrollY - 40;
		customSmoothScroll(targetY, 800);
	}
};

// --- Premium Ambient Particle Effects ---
const effectCanvas = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;
let particles: Array<{
	x: number;
	y: number;
	size: number;
	speedX: number;
	speedY: number;
	opacity: number;
	fadeSpeed?: number;
	rotation?: number;
	rotationSpeed?: number;
}> = [];

const initParticles = () => {
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

	const maxParticles = effect === "rose-petals" ? 25 : 60;
	particles = [];

	const createParticle = (initY = false) => {
		const x = Math.random() * canvas.width;
		const y = initY ? Math.random() * canvas.height : -10;
		const size =
			effect === "rose-petals"
				? Math.random() * 4 + 4
				: Math.random() * 2.5 + 1.2;
		const speedX =
			effect === "rose-petals"
				? Math.random() * 1.5 - 0.5
				: Math.random() * 0.6 - 0.3;
		const speedY =
			effect === "rose-petals"
				? Math.random() * 1.2 + 0.8
				: Math.random() * 0.7 + 0.5;
		const opacity =
			effect === "rose-petals"
				? Math.random() * 0.4 + 0.5
				: Math.random() * 0.5 + 0.5;
		const distanceToTravel = Math.max(50, canvas.height * 1.3 - y);
		const framesToBottom = distanceToTravel / speedY;
		const fadeSpeed =
			effect === "sparkles"
				? (opacity / framesToBottom) * (Math.random() * 0.4 + 0.8)
				: undefined;
		const rotation = effect === "rose-petals" ? Math.random() * 360 : undefined;
		const rotationSpeed =
			effect === "rose-petals" ? Math.random() * 0.02 - 0.01 : undefined;

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

			if (effect === "rose-petals") {
				p.y += p.speedY;
				p.x += p.speedX + Math.sin(p.y / 30) * 0.3;
				if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
					p.rotation += p.rotationSpeed;
				}

				let drawOpacity = p.opacity;
				if (p.y > canvas.height * 0.8) {
					const fadeProgress =
						(p.y - canvas.height * 0.8) / (canvas.height * 0.2);
					drawOpacity = p.opacity * Math.max(0, 1 - fadeProgress);
				}

				ctx.save();
				ctx.translate(p.x, p.y);
				if (p.rotation !== undefined) {
					ctx.rotate(p.rotation);
				}
				const wobble = Math.sin(Date.now() / 250 + p.y / 80) * 0.4 + 0.6;
				ctx.scale(wobble, 1);

				const gradient = ctx.createLinearGradient(0, p.size, 0, -p.size);
				gradient.addColorStop(0, `rgba(224, 30, 90, ${drawOpacity})`);
				gradient.addColorStop(0.5, `rgba(244, 143, 177, ${drawOpacity})`);
				gradient.addColorStop(1, `rgba(252, 228, 236, ${drawOpacity * 0.9})`);

				ctx.beginPath();
				ctx.moveTo(0, p.size);
				ctx.bezierCurveTo(
					-p.size * 1.5,
					p.size * 0.6,
					-p.size * 1.5,
					-p.size * 0.6,
					0,
					-p.size,
				);
				ctx.bezierCurveTo(
					p.size * 1.5,
					-p.size * 0.6,
					p.size * 1.5,
					p.size * 0.6,
					0,
					p.size,
				);
				ctx.closePath();

				ctx.fillStyle = gradient;
				ctx.shadowBlur = p.size * 0.4;
				ctx.shadowColor = `rgba(244, 143, 177, ${drawOpacity * 0.4})`;
				ctx.fill();
				ctx.restore();

				if (p.y > canvas.height + 10 || p.x < -10 || p.x > canvas.width + 10) {
					particles[i] = createParticle(false);
				}
			} else if (effect === "sparkles") {
				p.y += p.speedY;
				p.x += p.speedX;
				if (p.fadeSpeed !== undefined) {
					p.opacity -= p.fadeSpeed;
				}

				const currentOpacity = Math.max(
					0,
					p.opacity * (0.6 + 0.4 * Math.sin(Date.now() / 150 + p.x)),
				);

				ctx.save();
				ctx.translate(p.x, p.y);
				ctx.beginPath();
				for (let j = 0; j < 4; j++) {
					const angle = (j * Math.PI) / 2;
					const x1 = Math.cos(angle) * p.size * 2.2;
					const y1 = Math.sin(angle) * p.size * 2.2;

					const nextAngle = angle + Math.PI / 4;
					const x2 = Math.cos(nextAngle) * p.size * 0.5;
					const y2 = Math.sin(nextAngle) * p.size * 0.5;

					if (j === 0) {
						ctx.moveTo(x1, y1);
					} else {
						ctx.lineTo(x1, y1);
					}
					ctx.lineTo(x2, y2);
				}
				ctx.closePath();

				ctx.fillStyle = `rgba(253, 224, 71, ${currentOpacity})`;
				ctx.shadowBlur = p.size * 2;
				ctx.shadowColor = `rgba(250, 204, 21, ${currentOpacity})`;
				ctx.fill();
				ctx.restore();

				if (
					p.y > canvas.height + 10 ||
					p.opacity <= 0 ||
					p.x < -10 ||
					p.x > canvas.width + 10
				) {
					particles[i] = createParticle(false);
				}
			}
		}

		animationFrameId = requestAnimationFrame(animate);
	};

	animate();

	onUnmounted(() => {
		window.removeEventListener("resize", resizeCanvas);
		if (animationFrameId) cancelAnimationFrame(animationFrameId);
	});
};

watch([() => tenant.value?.ambient_effect, effectCanvas], () => {
	if (animationFrameId) {
		cancelAnimationFrame(animationFrameId);
	}
	if (
		effectCanvas.value &&
		tenant.value?.ambient_effect &&
		tenant.value.ambient_effect !== "none"
	) {
		initParticles();
	}
});

onMounted(() => {
	// ScrollSpy is handled by the IntersectionObserver watcher
});

onUnmounted(() => {
	if (observer) {
		observer.disconnect();
	}
});
</script>

<template>
	<main class="min-h-screen font-sans text-slate-600"
		:style="{ backgroundColor: tenant?.background_color || '#fafafa' }">
		<div v-if="loading" class="fixed inset-0 flex flex-col items-center justify-center p-6 text-center z-[999] animate-in fade-in-0 duration-500" :style="{ backgroundColor: tenant?.background_color || '#fafafa' }">
			<div class="relative flex items-center justify-center mb-6">
				<!-- Pulse decoration -->
				<div class="absolute w-16 h-16 rounded-full bg-pink-100 animate-ping duration-1000"></div>
				<!-- Spinner -->
				<div class="w-12 h-12 rounded-full border-4 border-slate-100 border-t-primary animate-spin"></div>
			</div>
			<h2 class="font-serif text-2xl md:text-3xl text-slate-900 tracking-wide mb-2">Carregando experiência</h2>
			<p class="text-slate-400 text-sm font-light tracking-wider animate-pulse">Preparando todos os detalhes com carinho...</p>
		</div>
		<div v-else-if="error" class="text-center p-20 text-red-500 font-medium">{{ error }}</div>
		<template v-else-if="tenant">

			<!-- Canvas for Visual Effects -->
			<canvas ref="effectCanvas" class="fixed inset-0 pointer-events-none z-[40]"></canvas>

			<!-- Header Hero -->
			<header id="home" :style="{ backgroundColor: tenant.background_color || 'transparent' }"
				class="relative flex items-center justify-center w-full h-dvh text-center overflow-hidden px-6">

				<!-- Background Image Layer -->
				<div v-if="tenant.background_image"
					class="absolute inset-0 bg-cover bg-center [-webkit-mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)] [mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)]"
					:style="{ backgroundImage: `url(${tenant.background_image})` }"></div>

				<!-- Blur Overlay Layer (Smooth fade to background_color at bottom) -->
				<div class="absolute inset-0 bg-white/20"></div>
				<div
					class="absolute inset-0 backdrop-blur-md [-webkit-mask-image:linear-gradient(to_top,black,transparent)] [mask-image:linear-gradient(to_top,black,transparent)]"
					:style="tenant.background_color ? { background: `linear-gradient(to top, ${tenant.background_color}, transparent)` } : {}"
					:class="!tenant.background_color ? 'bg-gradient-to-t from-zinc-50 to-transparent' : ''">
				</div>

				<div class="absolute top-0 left-0 w-full p-4 flex justify-end z-20">
					<GoogleAuthButton @click="currentUser ? showProfileModal = true : requireAuth()" @logout="logout"
						:user="currentUser || undefined" :fill="false" :themeColor="tenant.primary_color" />
				</div>

				<div class="relative flex flex-col items-center justify-center max-w-4xl z-10">
					<img v-if="tenant.logo_url" :src="tenant.logo_url" :alt="tenant.couple_name"
						class="w-40 h-40 object-contain mb-4">

					<h1 class="text-3xl font-serif text-slate-900 mb-4 tracking-tight"
						:class="tenant.logo_url ? 'md:text-6xl' : 'md:text-7xl'">{{ tenant.couple_name }}</h1>

					<p class="text-sm md:text-base text-slate-500 font-light max-w-[500px] leading-tight text-center">{{
						tenant?.quote || "Lista de Presentes & RSVP" }}</p>

					<!-- Event Date & Time Display -->
					<div v-if="tenant.event_date" class="mt-4 text-slate-600 font-medium text-lg">
						{{ dayjs(tenant.event_date).format('DD/MM/YYYY') }} às {{ tenant.event_time }}
					</div>

					<!-- Countdown -->
					<div v-if="tenant.event_date && tenant?.show_countdown !== false" class="mt-6">
						<CountdownTimer :eventDate="tenant.event_date" />
					</div>
					<div class="w-16 h-px bg-primary/40 mx-auto mt-10"></div>
				</div>
			</header>

			<div class="max-w-5xl mx-auto p-6 md:p-12 lg:py-32 space-y-24 md:space-y-32">

				<!-- Couple History -->
				<HistorySection v-if="tenant.couple_history" :history-text="tenant.couple_history" />

				<!-- Event Timeline -->
				<ScheduleSection v-if="tenant.show_schedule && tenant.schedules && tenant.schedules.length > 0"
					:primary-color="tenant.primary_color" :schedules="getTimelineItems" />

				<!-- Gallery -->
				<GallerySection v-if="tenant.show_gallery" :images="homePrivateImages"
					:is-within7-days-of-event="isWithin7DaysOfEvent" :slug="tenant.slug"
					:current-guest-id="authStore.guest?.$id || ''" @like="toggleGalleryLike" />

				<!-- Event Location Map -->
				<LocationSection v-if="tenant.event_location" :event-location="tenant.event_location"
					:event-latitude="tenant.event_latitude" :event-longitude="tenant.event_longitude"
					:event-date="tenant.event_date" :weather-data="weatherData" :weather-loading="weatherLoading"
					:weather-error="weatherError" v-model:is-weather-expanded="isWeatherExpanded" />

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
						<GoogleAuthButton @click="requireAuth" :fill="true" :themeColor="tenant.primary_color" class="mx-auto" />
					</div>
				</section>

				<template v-else>
					<!-- Products -->
					<ProductsSection :products="products" :tenant="tenant" :current-user="currentUser"
						@open-pix="openPixModal" @open-links="openLinksModal" />

					<!-- RSVP & Message Wall -->
					<RsvpMessageSection :tenant="tenant" :rsvps="rsvps" :messages="messages" :current-user="currentUser" />
				</template>

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
			<div v-if="selectedProduct" class="space-y-4 pt-4 text-center">
				<p class="text-slate-600">Escaneie o QR Code abaixo para presentear <strong>{{ tenant?.couple_name }}</strong>.
				</p>

				<div class="flex justify-center bg-white p-4 rounded-xl border">
					<qrcode-svg :value="pixPayload.payload" :size="200" level="H" />
				</div>

				<div class="space-y-2">
					<p class="text-3xl font-bold text-slate-900">
						{{ formatMoney(getProductPrice(selectedProduct, currentQty)) }}
					</p>

					<div class="flex flex-col gap-1">
						<p class="text-base font-medium text-slate-900">{{ selectedProduct.name }}</p>
						<p class="text-sm text-slate-500">
							Quantidade: {{ currentQty }}
							{{ selectedProduct.type === 'quota' ? 'cota(s)' : 'unidade(s)' }}
						</p>
					</div>
				</div>

				<div class="flex gap-3 mt-6">
					<Button class="flex-1" variant="outline" @click="copyPix">
						Pix Copia e Cola
					</Button>
					<Button class="flex-1" :disabled="confirmingPurchase" @click="confirmPurchase('pix')">
						{{ confirmingPurchase ? 'Confirmando...' : 'Já presenteei' }}
					</Button>
				</div>
			</div>
		</Modal>

		<!-- Store Links Modal -->
		<Modal v-model:open="showLinksModal" :title="selectedProduct?.name">
			<div class="space-y-6 pt-4 text-center">

				<p class="text-slate-500 text-sm">
					Escolha uma das lojas abaixo para adquirir as
					<strong class="text-slate-900">{{ currentQty }} unidade(s)</strong>.
				</p>

				<div class="space-y-4">
					<a v-for="(link, i) in selectedProduct?.links" :key="i" :href="link.url" target="_blank"
						class="flex items-center justify-center text-center h-11 rounded-xl border border-slate-200 hover:border-primary hover:bg-primary/5 transition-all group">
						<span class="text-sm font-medium text-slate-700 group-hover:text-primary transition-colors">{{ link.store
						}}</span>
					</a>
				</div>

				<div class="pt-2 border-t border-slate-100">
					<p class="text-sm text-slate-500 mb-3 text-center">
						Após finalizar a compra na loja, confirme abaixo:
					</p>
					<Button class="w-full" :disabled="confirmingPurchase" @click="confirmPurchase('link')">
						<span v-if="confirmingPurchase">Confirmando...</span>
						<span v-else>Já comprei {{ currentQty }} unidade(s)</span>
					</Button>
				</div>
			</div>
		</Modal>

		<!-- Guest Profile Modal -->
		<GuestProfileModal v-model:open="showProfileModal" :tenantPurchases="purchases" />

		<!-- Teleport Floating Dots -->
		<Teleport to="body">
			<!-- Floating Vertical Navigation (Dots) -->
			<div v-if="activeSections.length > 1"
				class="fixed right-2 md:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-1 md:gap-2 items-end pointer-events-none">
				<button v-for="section in activeSections" :key="section.id" @click="scrollToSection(section.id)"
					class="group relative flex items-center justify-end p-1.5 md:p-2 pointer-events-auto cursor-pointer focus:outline-none bg-transparent border-0 outline-none">
					<span
						class="absolute right-8 text-xs font-semibold px-2.5 py-1.5 bg-white/95 text-slate-800 border border-slate-100 rounded-xl shadow-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none font-sans">
						{{ section.label }}
					</span>
					<span class="w-2 h-2 rounded-full transition-all duration-300 border shadow-sm" :style="currentSection === section.id
						? { backgroundColor: tenant?.primary_color, borderColor: tenant?.primary_color, transform: 'scale(1.4)' }
						: { backgroundColor: 'white', borderColor: '#cbd5e1' }">
					</span>
				</button>
			</div>
		</Teleport>
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
</style>
