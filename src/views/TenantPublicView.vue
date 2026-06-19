<script setup lang="ts">
import ImageGallery from "@/components/ui/ImageGallery.vue";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
// 1. Importações dos componentes de UI (Shadcn) que estão faltando
import { Button } from "@/components/ui/button";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
} from "@/components/ui/carousel";
import { useConfirm } from "@/components/ui/confirm/useConfirm";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GalleryService } from "@/services/gallery.service";
import type { IGalleryImage } from "@/services/gallery.service";
import { type IWeatherData, WeatherService } from "@/services/weather.service";

import GuestProfileModal from "@/components/GuestProfileModal.vue";
import Modal from "@/components/reusable/Modal.vue";
import CountdownTimer from "@/components/ui/CountdownTimer.vue";
// 2. Importações de componentes específicos do seu projeto
import GoogleAuthButton from "@/components/ui/GoogleAuthButton.vue";
import LeafletMap from "@/components/ui/LeafletMap.vue";

import { useTenant } from "@/composables/useTenant";
import { generateThankYouMessage } from "@/lib/ai";
import { generatePixPayload, sortBy } from "@/lib/utils";
import { ConsentService } from "@/services/consent.service";
import { type IMessage, MessageService } from "@/services/message.service";
import { type MethodType, PurchaseService } from "@/services/purchase.service";
import { RsvpService } from "@/services/rsvp.service";
import { useAuthStore } from "@/stores/auth";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import * as z from "zod";

import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import FormGroup from "@/components/reusable/FormGroup.vue";
import ProductGallery from "@/components/ui/ProductGallery.vue";
import type { IGuest } from "@/services/guest.service";
import { type IProduct, ProductService } from "@/services/product.service";
import Autoplay from "embla-carousel-autoplay";
import QrcodeSvg from "qrcode.vue";
import { toast } from "vue-sonner";

dayjs.locale("pt-br");

const carouselPlugins = [
	Autoplay({
		delay: 4000,
		stopOnInteraction: false,
		stopOnMouseEnter: true,
	}),
];

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
const { confirm } = useConfirm();

const currentUser = computed(() => authStore.user);
const showProfileModal = ref(false);

const existingRsvp = computed(() => {
	if (!authStore.guest) return null;
	return rsvps.value.find((r) => {
		const guestId = typeof r.guest === "string" ? r.guest : r.guest?.$id;
		return guestId === authStore.guest?.$id;
	});
});

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

import { formatMoney, getProductPrice } from "@/lib/money";
import {
	ArrowUp,
	Cake,
	Camera,
	Clock,
	Cloud,
	CloudDrizzle,
	CloudLightning,
	CloudRain,
	CloudSun,
	Gift,
	GlassWater,
	Heart,
	MapPin,
	Music,
	Pause,
	Play,
	Snowflake,
	Sparkles,
	Sun,
	Utensils,
} from "lucide-vue-next";
import type { Component } from "vue";

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

const openPixModal = async (product: IProduct, quantity = 1) => {
	if (!currentUser.value) return;
	selectedProduct.value = product;
	quotaQuantities.value[product.$id] = quantity;
	showPixModal.value = true;
};

const openLinksModal = async (product: IProduct, quantity = 1) => {
	if (!currentUser.value) return;
	if (product.links && product.links.length > 0) {
		selectedProduct.value = product;
		quotaQuantities.value[product.$id] = quantity;
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

// RSVP Validation Schema
const rsvpSchema = toTypedSchema(
	z.object({
		totalAdults: z.number().min(1, "No mínimo 1 adulto"),
		totalChildren: z.number().min(0),
		status: z.enum(["confirmed", "declined"]),
		acceptedTerms: z
			.boolean()
			.refine((val) => val === true, "Você deve aceitar os termos"),
	}),
);

const { handleSubmit, errors, defineField } = useForm({
	validationSchema: rsvpSchema,
	initialValues: {
		totalAdults: 1,
		totalChildren: 0,
		status: "confirmed",
		acceptedTerms: false,
	},
});

const [totalAdults] = defineField("totalAdults");
const [totalChildren] = defineField("totalChildren");
const [status] = defineField("status");
const [acceptedTerms] = defineField("acceptedTerms");

watch(
	() => authStore.guest,
	(guest) => {
		if (guest && !guest.phone) {
			showProfileModal.value = true;
		}
	},
	{ immediate: true },
);

const rsvpLoading = ref(false);
const isEditingRsvp = ref(false);

const submitRsvp = handleSubmit(async (values) => {
	if (!tenant.value || !authStore.guest) return;
	rsvpLoading.value = true;
	try {
		let thankYouMessage = "";
		if (values.status === "confirmed") {
			thankYouMessage = await generateThankYouMessage(
				authStore.guest.name || "Convidado",
				tenant.value.couple_name,
			);
		}

		const payload = {
			tenant: tenant.value.$id,
			total_adults: values.totalAdults,
			total_children: values.totalChildren,
			status: values.status,
			guest: authStore.guest as IGuest,
			message: thankYouMessage,
		};

		if (existingRsvp.value) {
			await RsvpService.update(existingRsvp.value.$id, payload);
			Object.assign(existingRsvp.value, payload);
		} else {
			const created = await RsvpService.create(payload);
			rsvps.value.push(created);
		}

		// Log RSVP consent in immutable collection
		if (authStore.guest) {
			await ConsentService.log({
				user_id: authStore.guest.$id,
				email: authStore.guest.email,
				accepted_terms: true,
				accepted_terms_at: dayjs().toISOString()
			});
		}

		isEditingRsvp.value = false;
		toast.success("Sucesso", {
			description: "Sua resposta foi enviada com sucesso! Obrigado.",
		});
	} catch (err) {
		toast.error("Erro", {
			description: "Houve um erro ao enviar sua resposta. Tente novamente.",
		});
	} finally {
		rsvpLoading.value = false;
	}
});

// Emotional Messages
const messageContent = ref("");
const submitMessage = async () => {
	if (!tenant.value || !messageContent.value.trim() || !currentUser.value)
		return;

	try {
		const newMsg = await MessageService.create({
			tenant: tenant.value.$id,
			content: messageContent.value,
			guest: authStore.guest as IGuest,
		});

		// Add instantly to UI array without fetching
		messages.value.unshift(newMsg);

		messageContent.value = "";
		toast.success("Sua mensagem foi enviada!");
	} catch (err) {
		toast.error("Erro ao enviar mensagem.");
	}
};

const deleteMessage = (msgId: string) => {
	confirm({
		title: "Apagar Mensagem",
		description: "Tem certeza de que deseja apagar esta mensagem do mural?",
		confirmText: "Sim, apagar",
		cancelText: "Não",
		confirm: async () => {
			try {
				await MessageService.delete(msgId);
				messages.value = messages.value.filter((m) => m.$id !== msgId);
				toast.success("Mensagem apagada com sucesso.");
			} catch (err) {
				toast.error("Erro ao apagar mensagem.");
			}
		},
	});
};

const toggleLike = async (msg: IMessage) => {
	const guestId = authStore.guest?.$id;
	if (!guestId) return;

	const originalLikes = [...(msg.likes || [])];
	const isLiked = msg.likes?.includes(guestId);

	if (isLiked) {
		msg.likes = msg.likes?.filter((id) => id !== guestId);
	} else {
		msg.likes = [...(msg.likes || []), guestId];
	}

	try {
		msg.likes?.length && (await MessageService.likes(msg.$id, msg.likes));
	} catch (err) {
		msg.likes = originalLikes;

		toast.error("Falha ao curtir.");
	}
};

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
	return sortBy(tenant.value.schedules, "hour").map((item) => ({
		time: item.hour,
		title: item.title,
		description: item.description,
		icon: item.icon,
	}));
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

const getWeatherIcon = (iconName: string): Component => {
	const icons: Record<string, Component> = {
		sun: Sun,
		"cloud-sun": CloudSun,
		cloud: Cloud,
		"cloud-rain": CloudRain,
		"cloud-drizzle": CloudDrizzle,
		"cloud-lightning": CloudLightning,
		snowflake: Snowflake,
	};
	return icons[iconName] || Cloud;
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

const activeLightboxImage = ref<string | null>(null);

const closeLightbox = () => {
	activeLightboxImage.value = null;
};

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
		// Easing cubic ease-in-out para maior suavidade
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
		const targetY = rect.top + window.scrollY - 40; // desconta o scroll-mt-10 (64px)
		customSmoothScroll(targetY, 800);
	}
};

const showMusicTip = ref(true);

const isYouTubeUrl = (url?: string | null): boolean => {
	if (!url) return false;
	return url.includes("youtube.com") || url.includes("youtu.be");
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
				: Math.random() * 2.5 + 1.2; // Smaller, more delicate petals
		const speedX =
			effect === "rose-petals"
				? Math.random() * 1.5 - 0.5
				: Math.random() * 0.6 - 0.3;
		const speedY =
			effect === "rose-petals"
				? Math.random() * 1.2 + 0.8
				: Math.random() * 0.7 + 0.5; // Slightly faster fall speed for sparkles to cover the screen
		const opacity =
			effect === "rose-petals"
				? Math.random() * 0.4 + 0.5
				: Math.random() * 0.5 + 0.5; // Sparkles start a bit brighter
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

				// Soft fade out near the bottom of the screen
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
				// Wobble effect simulating 3D flutter
				const wobble = Math.sin(Date.now() / 250 + p.y / 80) * 0.4 + 0.6;
				ctx.scale(wobble, 1);

				// Gradient color from deep rose base to soft pink tips
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

				// Twinkle modulation
				const currentOpacity = Math.max(
					0,
					p.opacity * (0.6 + 0.4 * Math.sin(Date.now() / 150 + p.x)),
				);

				ctx.save();
				ctx.translate(p.x, p.y);
				ctx.beginPath();
				// Draw a premium 4-pointed star
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
				<section id="history" v-if="tenant.couple_history" class="text-center max-w-3xl mx-auto scroll-mt-10">
					<h2 class="text-3xl font-serif text-slate-900 mb-8">Nossa História</h2>
					<div class="text-slate-600 font-light text-lg leading-relaxed text-left quill-content"
						v-html="tenant.couple_history"></div>
				</section>

				<!-- Event Timeline -->
				<section id="schedule" v-if="tenant.show_schedule && tenant.schedules && tenant.schedules.length > 0"
					class="space-y-12 max-w-3xl mx-auto scroll-mt-10">
					<div class="text-center mb-12">
						<h2 class="text-3xl font-serif text-slate-900 mb-4">Cronograma do Evento</h2>
						<p class="text-slate-500 font-light max-w-xl mx-auto text-base">
							Acompanhe a programação completa do nosso grande dia para não perder nenhum momento especial.
						</p>
					</div>

					<div class="relative border-l-2 ml-4 md:ml-0 space-y-12 py-4"
						:style="{ borderColor: tenant.primary_color + '33' }">
						<div v-for="item in getTimelineItems" :key="item.title" class="relative pl-6 md:pl-10">
							<!-- Icon Marker -->
							<div
								class="absolute -left-[17px] top-1.5 bg-white border-2 border-primary w-8 h-8 rounded-full flex items-center justify-center text-primary shadow-sm">
								<Clock v-if="item.icon === 'clock'" class="w-4 h-4" />
								<GlassWater v-else-if="item.icon === 'cheers'" class="w-4 h-4" />
								<Utensils v-else-if="item.icon === 'utensils'" class="w-4 h-4" />
								<Music v-else-if="item.icon === 'music'" class="w-4 h-4" />
								<Cake v-else-if="item.icon === 'cake'" class="w-4 h-4" />
								<Camera v-else-if="item.icon === 'camera'" class="w-4 h-4" />
								<Sparkles v-else-if="item.icon === 'sparkles'" class="w-4 h-4" />
								<MapPin v-else-if="item.icon === 'map-pin'" class="w-4 h-4" />
								<Gift v-else-if="item.icon === 'gift'" class="w-4 h-4" />
								<Heart v-else class="w-4 h-4" />
							</div>

							<!-- Content block -->
							<div class="flex flex-col md:flex-row md:items-start md:gap-3">
								<!-- Time Badge -->
								<span
									class="inline-block shrink-0 py-1 bg-primary/10 text-primary font-semibold text-sm rounded-full w-fit">
									{{ item.time }}
								</span>
								<div class="space-y-1.5 text-left">
									<h3 class="font-serif text-lg text-slate-800 font-medium">{{ item.title }}</h3>
									<p class="text-sm text-slate-500 font-light leading-relaxed max-w-xl">
										{{ item.description }}
									</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				<!-- Gallery -->
				<section id="gallery" v-if="tenant.show_gallery" class="space-y-12 scroll-mt-10">
					<div class="text-center mb-12">
						<h2 class="text-3xl font-serif text-slate-900 mb-4">Galeria de Fotos</h2>
						<p class="text-slate-500 font-light max-w-xl mx-auto text-base">
							Momentos especiais compartilhados por nós. Deixe o seu carinho curtindo suas fotos favoritas!
						</p>
					</div>

					<div v-if="homePrivateImages.length > 0">
						<ImageGallery :images="homePrivateImages" :carousel="true" :autoplay="true"
							:currentGuestId="authStore.guest?.$id || ''" @like="toggleGalleryLike" />
					</div>
					<div v-else
						class="text-center text-slate-400 py-12 bg-white/40 border border-dashed rounded-3xl text-sm font-light">
						Nenhuma foto em exibição na página inicial.
					</div>

					<!-- Guest Gallery Redirect Banner -->
					<div v-if="isWithin7DaysOfEvent"
						class="p-8 rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] text-center flex flex-col items-center justify-center gap-4 mx-auto">
						<Camera class="w-8 h-8 text-primary animate-pulse" />
						<h3 class="text-xl font-serif text-slate-900 font-medium">Galeria dos Convidados</h3>
						<p class="text-slate-500 font-light text-sm max-w-md">
							Queremos muito ver o dia sob os seus olhos! Clique abaixo para ver as fotos do evento e compartilhar os
							cliques que você tirou do nosso grande dia.
						</p>
						<router-link :to="`/${tenant.slug}/gallery`">
							<Button class="rounded-xl flex items-center gap-2">
								<Camera class="w-4 h-4" />
								Ver & Compartilhar Fotos
							</Button>
						</router-link>
					</div>
				</section>

				<!-- Event Location Map -->
				<section id="location" v-if="tenant.event_location" class="text-center scroll-mt-10">
					<h2 class="text-3xl font-serif text-slate-900 mb-6">Local do Evento</h2>

					<div
						class="relative bg-white p-2 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80 overflow-hidden">

						<LeafletMap :address="tenant.event_location" class="z-0" />

						<div v-if="tenant.event_latitude && tenant.event_longitude && tenant.event_date"
							class="absolute bottom-5 left-5 right-5 md:left-5 md:right-auto w-95 md:w-full max-w-xs z-10 flex flex-col items-start">

							<div v-if="isWeatherExpanded"
								class="bg-white/95 backdrop-blur border border-slate-100/80 p-4 md:p-5 rounded-2xl shadow-xl flex items-center justify-between gap-4 w-full cursor-pointer"
								@click="isWeatherExpanded = false">

								<div class="flex items-center gap-4 w-full">
									<div v-if="weatherLoading" class="text-sm text-slate-500 w-full text-center">Carregando...</div>

									<div v-else-if="weatherData" class="flex justify-between items-center w-full">
										<div class="flex items-center gap-3">
											<component :is="getWeatherIcon(weatherData.icon)" class="w-7 h-7 text-primary" />
											<div class="space-y-0.5">
												<h4 class="font-serif text-slate-800 text-sm text-left font-bold uppercase leading-none">
													Previsão de
													Amor</h4>
												<p class="text-xs text-left text-slate-500 font-light capitalize">{{ weatherData.description }}
												</p>
											</div>
										</div>

										<div class="text-right shrink-0 tabular-nums">
											<div class="text-lg font-bold text-primary">{{ Math.round(weatherData.maxTemp) }}°C</div>
											<div class="text-xs text-slate-400">Mín: {{ Math.round(weatherData.minTemp) }}°C</div>
										</div>
									</div>

									<div v-else-if="!weatherError" class="text-xs text-slate-500 font-light text-left">
										A previsão do tempo ficará disponível cerca de 14 dias antes do casamento.
									</div>
								</div>
							</div>

							<button v-else @click="isWeatherExpanded = true"
								class="bg-white/90 backdrop-blur border border-slate-100 p-3 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center">
								<CloudSun class="w-6 h-6 text-primary" />
							</button>
						</div>
					</div>

					<p class="text-slate-500 font-medium mt-4">{{ tenant.event_location }}</p>
				</section>

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
					<section id="gifts" class="scroll-mt-10">
						<div class="text-center mb-16">
							<h2 class="text-3xl font-serif text-slate-900 mb-6">Nossa Lista</h2>
							<p class="text-slate-500 font-light max-w-xl mx-auto text-lg leading-relaxed">Com muito carinho,
								selecionamos alguns itens e experiências. Fique à vontade para nos presentear com o que tocar o seu
								coração.</p>
						</div>

						<ProductGallery :products="products" :tenant="tenant" mode="public" :currentUser="currentUser"
							@open-pix="openPixModal" @open-links="openLinksModal" />

					</section>

					<!-- RSVP & Message Wall (2-column grid) -->
					<section class="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20">

						<!-- RSVP Column -->
						<div id="rsvp" class="lg:col-span-7 space-y-10 scroll-mt-10">
							<div class="mb-6">
								<h2 class="text-3xl font-serif text-slate-900 mb-4 tracking-tight">Confirme sua Presença</h2>
								<p class="text-slate-500 font-light leading-relaxed">Ficaremos imensamente felizes em celebrar esse
									momento único
									com você. Por favor, confirme abaixo.</p>
							</div>

							<!-- Formulário ou Confirmação -->
							<div v-if="existingRsvp && !isEditingRsvp"
								class="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80 text-center">
								<div
									class="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
									<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
									</svg>
								</div>
								<h3 class="text-2xl font-serif text-slate-900 mb-2">
									{{ existingRsvp.status === 'confirmed' ? 'Presença Confirmada!' : 'Não Poderá Ir' }}
								</h3>
								<p class="text-slate-500 font-light mb-6">
									{{ existingRsvp.status === 'confirmed'
										? `Obrigado por confirmar! Contamos com ${existingRsvp.total_adults}
									adulto(s)${existingRsvp.total_children > 0 ? ` e ${existingRsvp.total_children} criança(s)` : ''}.`
										: 'Sentiremos sua falta!' }}
								</p>
								<p v-if="existingRsvp.message"
									class="italic text-slate-600 font-serif mb-8 p-4 bg-slate-50/50 rounded-xl">
									"{{ existingRsvp.message }}"
								</p>
								<Button variant="outline" @click="isEditingRsvp = true">
									Alterar Resposta
								</Button>
							</div>

							<div v-else-if="!authStore.isPremium && rsvps.length >= 20 && !existingRsvp"
								class="bg-amber-50/70 p-8 rounded-3xl border border-amber-100 text-center shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
								<div
									class="w-12 h-12 bg-amber-100/80 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
									<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
											d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
									</svg>
								</div>
								<h3 class="text-lg font-serif text-amber-900 mb-2">Confirmações Suspensas</h3>
								<p class="text-sm text-amber-700 font-light leading-relaxed mb-1">
									Este casamento atingiu o limite de confirmações de presença permitidos no plano gratuito.
								</p>
								<p class="text-xs text-amber-600 font-light">
									Se você é o proprietário, faça o upgrade para o plano Premium no painel de controle.
								</p>
							</div>

							<form v-else @submit.prevent="submitRsvp"
								class="space-y-6 bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100/80">
								<div class="space-y-5">
									<div class="grid grid-cols-2 gap-5">
										<FormGroup label="Adultos" :error="errors.totalAdults">
											<Input v-model.number="totalAdults" type="number" min="1"
												class="rounded-xl border-slate-200 shadow-sm focus-visible:ring-primary/20 bg-slate-50/50 h-12" />
										</FormGroup>
										<FormGroup label="Crianças" :error="errors.totalChildren">
											<Input v-model.number="totalChildren" type="number" min="0"
												class="rounded-xl border-slate-200 shadow-sm focus-visible:ring-primary/20 bg-slate-50/50 h-12" />
										</FormGroup>
									</div>
									<FormGroup label="Você irá ao evento?">
										<div class="relative w-full">
											<select v-model="status"
												class="w-full h-12 px-4 bg-slate-50/50 border border-slate-200 rounded-xl text-base font-light text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">
												<option value="confirmed">Sim, estarei lá!</option>
												<option value="declined">Não poderei ir</option>
											</select>

											<div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
												</svg>
											</div>
										</div>
									</FormGroup>
								</div>
								
								<div class="space-y-1">
									<div class="flex items-start gap-2.5 py-1">
										<input type="checkbox" id="accept-rsvp-terms" v-model="acceptedTerms" class="w-4 h-4 mt-0.5 rounded border-slate-300 text-primary focus:ring-primary/20 accent-primary cursor-pointer" required />
										<label for="accept-rsvp-terms" class="text-xs text-slate-500 font-light leading-relaxed cursor-pointer select-none">
											Autorizo o tratamento de meus dados em conformidade com os <a href="/termos" target="_blank" class="underline text-primary font-medium">Termos de Uso</a> e <a href="/privacidade" target="_blank" class="underline text-primary font-medium">Política de Privacidade</a> (LGPD).
										</label>
									</div>
									<p v-if="errors.acceptedTerms" class="text-xs text-red-500 mt-1">{{ errors.acceptedTerms }}</p>
								</div>

								<Button type="submit" class="w-full" :disabled="rsvpLoading">
									{{ rsvpLoading ? 'Enviando...' : 'Confirmar Presença' }}
								</Button>
								<Button v-if="isEditingRsvp" type="button" variant="ghost" @click="isEditingRsvp = false"
									class="w-full mt-2 text-slate-500">
									Cancelar Edição
								</Button>
							</form>
						</div>

						<!-- Message Wall Column -->
						<div id="messages" class="lg:col-span-5 space-y-10 scroll-mt-10">
							<div class="mb-6">
								<h2 class="text-3xl font-serif text-slate-900 mb-4 tracking-tight">Mural de Recados</h2>
								<p class="text-slate-500 font-light leading-relaxed">Deixe uma mensagem carinhosa para os noivos.</p>
							</div>

							<div
								class="bg-white p-6 rounded-3xl border border-slate-100/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] mb-10 transition-shadow duration-300 hover:shadow-md flex flex-col gap-4">

								<!-- Convidado em cima -->
								<div class="flex items-center gap-3">
									<img v-if="authStore.guest?.photo_url" :src="authStore.guest.photo_url" alt="Foto"
										referrerpolicy="no-referrer" class="w-10 h-10 rounded-full border border-slate-100 shadow-sm" />
									<div v-else
										class="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center font-bold">
										{{ authStore.guest?.name?.charAt(0).toUpperCase() || 'C' }}
									</div>
									<div class="flex flex-col text-left">
										<span class="text-xs text-slate-400 font-light">Escrevendo como</span>
										<strong class="text-sm font-semibold text-slate-700 leading-none mt-1">{{ authStore.guest?.name
										}}</strong>
									</div>
								</div>

								<!-- Textarea embaixo -->
								<Textarea v-model="messageContent"
									class="w-full h-32 rounded-2xl bg-slate-50/50 border-slate-200 focus-visible:ring-primary/20 placeholder:text-slate-400 text-base font-light p-4 resize-none"
									placeholder="Escreva uma mensagem de carinho para os noivos..." />

								<!-- Botão embaixo -->
								<Button @click="submitMessage" :disabled="!messageContent.trim()" class="w-full h-12 rounded-xl">
									Publicar Recado
								</Button>
							</div>

							<!-- Messages Carousel -->
							<Carousel v-if="messages.length > 0" class="w-full relative cursor-grab active:cursor-grabbing pb-10"
								:opts="{ align: 'center', dragFree: true, loop: true }" :plugins="carouselPlugins">
								<CarouselContent class="py-2">
									<CarouselItem v-for="(msg, index) in messages" :key="msg.$id"
										class="basis-full md:basis-[672px] min-w-0 max-w-full select-none">
										<div
											class="h-full w-full max-w-full p-6 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col gap-6"
											:class="index % 2 === 0 ? 'bg-white border border-slate-100/80' : 'bg-primary border border-transparent'">

											<div class="flex items-center justify-between z-10 w-full max-w-full min-w-0"
												:class="index % 2 === 0 ? 'border-slate-50' : 'border-white/20'">
												<!-- Quote icon -->
												<svg class="w-8 h-8 shrink-0" :class="index % 2 === 0 ? 'text-primary/20' : 'text-white/20'"
													fill="currentColor" viewBox="0 0 24 24">
													<path
														d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
												</svg>

												<!-- Likes -->
												<div class="flex items-center justify-center">
													<Button variant="ghost" @click="toggleLike(msg)"
														class="!p-2 h-auto transition-all duration-300 hover:scale-125 active:scale-90" :class="[
															index % 2 === 0
																? 'text-slate-300 hover:text-red-500'
																: 'text-white/50 hover:text-white',
															msg.likes?.includes(authStore.guest?.$id || '') ? 'text-red-500 scale-100' : ''
														]">
														<svg class="w-6 h-6 transition-all duration-300"
															:fill="msg.likes?.includes(authStore.guest?.$id || '') ? 'currentColor' : 'none'"
															stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
																d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
														</svg>
													</Button>

													<span class="text-sm font-medium tabular-nums"
														:class="index % 2 === 0 ? 'text-slate-500' : 'text-white/80'">
														{{ msg.likes?.length || 0 }}
													</span>
												</div>
											</div>

											<p class="reveal-text font-serif italic leading-relaxed text-lg z-10 whitespace-pre-wrap break-words w-full min-w-0 max-w-full"
												:class="index % 2 === 0 ? 'text-slate-600' : 'text-white/90'">{{ msg.content }}</p>

											<div class="flex items-center gap-4 w-full pt-6 border-t mt-auto"
												:class="index % 2 === 0 ? 'border-slate-50' : 'border-white/20'">
												<img v-if="msg.guest.photo_url" :src="msg.guest.photo_url" referrerpolicy="no-referrer"
													class="w-12 h-12 shrink-0 rounded-full border-2 shadow-sm"
													:class="index % 2 === 0 ? 'border-slate-50' : 'border-white/20'" />
												<div v-else
													class="w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-sm font-bold border-2"
													:class="index % 2 === 0 ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-white/10 border-white/20 text-white'">
													{{ msg.guest.name?.charAt(0).toUpperCase() }}
												</div>
												<div class="flex flex-col min-w-0">
													<p class="text-sm font-medium tracking-wide truncate"
														:class="index % 2 === 0 ? 'text-slate-900' : 'text-white'">{{ msg.guest.name }}</p>
													<p class="text-xs font-light mt-0.5 truncate"
														:class="index % 2 === 0 ? 'text-slate-400' : 'text-white/70'">{{
															dayjs(msg.$createdAt).format('DD [de] MMMM [de] YYYY') }}</p>
												</div>

												<!-- Delete button -->
												<Button variant="ghost" v-if="currentUser && (currentUser.$id === msg.guest.$id)"
													@click="deleteMessage(msg.$id)" class="!p-2 h-auto ml-auto"
													:class="index % 2 === 0 ? 'text-slate-300 hover:text-red-500' : 'text-white/50 hover:text-white'">
													<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
															d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
													</svg>
												</Button>
											</div>
										</div>
									</CarouselItem>
								</CarouselContent>
							</Carousel>
						</div>
					</section>
				</template>

				<!-- FAQ Section -->
				<section id="faq" v-if="tenant.show_faq && faqs && faqs.length > 0" class="space-y-12 scroll-mt-10">
					<div class="text-center mb-12">
						<h2 class="text-3xl font-serif text-slate-900 mb-4">Dúvidas Frequentes</h2>
						<p class="text-slate-500 font-light max-w-xl mx-auto text-base">
							Caso tenha alguma dúvida sobre o evento, confira as perguntas mais comuns dos nossos convidados abaixo.
						</p>
					</div>

					<div class="max-w-3xl mx-auto">
						<Accordion type="single" collapsible class="w-full space-y-4">
							<AccordionItem v-for="faq in faqs" :key="faq.$id" :value="faq.$id"
								class="bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] rounded-2xl px-6 py-2 transition-shadow hover:shadow-md">
								<AccordionTrigger
									class="hover:no-underline font-serif text-base text-slate-800 font-medium py-4 text-left">
									{{ faq.question }}
								</AccordionTrigger>
								<AccordionContent class="text-slate-500 font-light leading-relaxed pb-4 text-left">
									{{ faq.answer }}
								</AccordionContent>
							</AccordionItem>
						</Accordion>
					</div>
				</section>

			</div>
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

		<!-- Lightbox Modal -->
		<Teleport to="body">
			<Transition name="fade">
				<div v-if="activeLightboxImage"
					class="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
					@click="closeLightbox">
					<button type="button" @click="closeLightbox"
						class="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full backdrop-blur transition-all border-0 outline-none cursor-pointer">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
					<img :src="activeLightboxImage"
						class="max-w-full max-h-[85vh] md:max-h-[90vh] object-contain rounded-2xl shadow-2xl cursor-default animate-zoom"
						@click.stop />
				</div>
			</Transition>
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

	<!-- Footer -->
	<footer class="border-t border-slate-100 bg-white py-12 px-6">
		<div
			class="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
			<div class="space-y-2">
				<img v-if="tenant?.logo_url" :src="tenant.logo_url" alt="tenant?.couple_name" class="h-16 mx-auto">
				<h3 class="font-serif text-2xl text-slate-900 tracking-tight">{{ tenant?.couple_name }}</h3>
				<p v-if="tenant?.event_date" class="text-sm text-slate-400 font-light">
					{{ dayjs(tenant?.event_date).format('DD [de] MMMM [de] YYYY') }}
				</p>
			</div>

			<div class="flex flex-col md:items-end gap-3">
				<p class="italic text-slate-500 font-serif text-sm max-w-xs text-center md:text-right">
					"Com carinho, obrigado por fazer parte da nossa história!"
				</p>
				<div class="flex items-center justify-center md:justify-end gap-1.5 text-xs text-slate-400 font-light mt-1">
					<span>{{ dayjs().format("YYYY") }} &copy;</span>
					<span>Desenvolvido com</span>
					<Heart class="w-3.5 h-3.5 fill-red-400 text-red-400 inline" />
					<span>por <a class="font-bold" href="https://instagram.com/ajotanc" target="_blank">AJOTA</a></span>
				</div>
			</div>
		</div>
	</footer>
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

@keyframes zoomIn {
	from {
		transform: scale(0.95);
		opacity: 0;
	}

	to {
		transform: scale(1);
		opacity: 1;
	}
}

.animate-zoom {
	animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
