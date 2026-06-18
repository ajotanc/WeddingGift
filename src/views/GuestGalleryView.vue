<script setup lang="ts">
import FormGroup from "@/components/reusable/FormGroup.vue";
import Modal from "@/components/reusable/Modal.vue";
import GoogleAuthButton from "@/components/ui/GoogleAuthButton.vue";
import ImageGallery from "@/components/ui/ImageGallery.vue";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm/useConfirm";
import { Input } from "@/components/ui/input";
import { useTenant } from "@/composables/useTenant";
import { DATABASE_ID, realtime } from "@/lib/appwrite";
import { TABLE_GALLERY } from "@/lib/collections";
import { GalleryService, type IGalleryImage } from "@/services/gallery.service";
import { GuestService } from "@/services/guest.service";
import { useAuthStore } from "@/stores/auth";
import imageCompression from "browser-image-compression";
import { ArrowLeft, Camera, Loader2, Image, X } from "lucide-vue-next";
import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";

import { toast } from "vue-sonner";

const { tenant, gallery, loading, error } = useTenant();
const authStore = useAuthStore();
const { confirm } = useConfirm();

const currentUser = computed(() => authStore.user);
const currentGuest = computed(() => authStore.guest);

const isAdmin = computed(() => {
	return (
		!!authStore.user &&
		!!tenant.value &&
		authStore.user.$id === tenant.value.$id
	);
});

// Filter images to show in the guest gallery (couple's public photos and guest photos)
const publicImages = computed(() => {
	return gallery.value.filter((img) => img.is_public || img.guest);
});

// Require login to upload or view
const requireAuth = async (): Promise<boolean> => {
	if (currentGuest.value || currentUser.value) return true;
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

// Realtime connection logic
const channel = `databases.${DATABASE_ID}.collections.${TABLE_GALLERY}.documents`;
// biome-ignore lint/suspicious/noExplicitAny: Appwrite Realtime unsubscribe is typed dynamically due to differences in SDK wrappers
let unsubscribe: any = null;

const subscribeRealtime = async () => {
	const sub = await realtime.subscribe(channel, (response) => {
		const event = response.events[0];
		const doc = response.payload as IGalleryImage;

		if (doc.tenant !== tenant.value?.$id) return;

		if (event.includes(".create")) {
			if (!gallery.value.some((img) => img.$id === doc.$id)) {
				// Resolve guest if relation is a flat ID
				if (doc.guest && typeof doc.guest === "string") {
					const guestId = doc.guest;
					if (authStore.guest && authStore.guest.$id === guestId) {
						doc.guest = authStore.guest;
					} else {
						GuestService.get(guestId)
							.then((g) => {
								doc.guest = g;
							})
							.catch(() => { });
					}
				}
				gallery.value.unshift(doc);
			}
		} else if (event.includes(".update")) {
			const index = gallery.value.findIndex((img) => img.$id === doc.$id);
			if (index !== -1) {
				const oldGuest = gallery.value[index].guest;
				if (
					doc.guest &&
					typeof doc.guest === "string" &&
					oldGuest &&
					oldGuest.$id === doc.guest
				) {
					doc.guest = oldGuest;
				}
				gallery.value[index] = doc;
			}
		} else if (event.includes(".delete")) {
			gallery.value = gallery.value.filter((img) => img.$id !== doc.$id);
		}
	});
	unsubscribe = sub.unsubscribe;
};

const hasCamera = ref(true);

const checkCameraSupport = async () => {
	try {
		if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
			hasCamera.value = false;
			return;
		}
		const devices = await navigator.mediaDevices.enumerateDevices();
		const videoDevices = devices.filter((device) => device.kind === "videoinput");
		hasCamera.value = videoDevices.length > 0;
	} catch (e) {
		console.error("Camera detection failed:", e);
		hasCamera.value = false;
	}
};

const videoRef = ref<HTMLVideoElement | null>(null);
const showCameraModal = ref(false);
let activeStream: MediaStream | null = null;

const startCamera = async () => {
	try {
		const stream = await navigator.mediaDevices.getUserMedia({
			video: { facingMode: "environment" },
			audio: false,
		});
		activeStream = stream;
		showCameraModal.value = true;
		nextTick(() => {
			if (videoRef.value) {
				videoRef.value.srcObject = stream;
			}
		});
	} catch (e) {
		console.error("Camera access failed:", e);
		toast.error("Erro ao acessar câmera", {
			description: "Por favor, garanta que deu permissão para acessar a câmera no navegador.",
		});
	}
};

const stopCamera = () => {
	if (activeStream) {
		for (const track of activeStream.getTracks()) {
			track.stop();
		}
		activeStream = null;
	}
	showCameraModal.value = false;
};

onMounted(async () => {
	await subscribeRealtime();
	await checkCameraSupport();
});

onUnmounted(() => {
	if (unsubscribe) unsubscribe();
	stopCamera();
});

// Upload Logic
const isUploading = ref(false);
const caption = ref("");

const triggerCamera = async () => {
	if (!hasCamera.value) {
		toast.error("Câmera indisponível", {
			description: "Não foi possível detectar uma câmera disponível neste dispositivo.",
		});
		return;
	}
	await startCamera();
};

const triggerGallery = () => {
	document.getElementById("guest-gallery-input")?.click();
};

const capturePhoto = () => {
	if (!videoRef.value) return;
	const video = videoRef.value;
	const canvas = document.createElement("canvas");
	canvas.width = video.videoWidth || 640;
	canvas.height = video.videoHeight || 480;

	const ctx = canvas.getContext("2d");
	if (ctx) {
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
		canvas.toBlob(async (blob) => {
			if (blob) {
				const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
				stopCamera();
				await uploadCapturedFile(file);
			}
		}, "image/jpeg", 0.9);
	}
};

const uploadCapturedFile = async (file: File) => {
	if (!tenant.value) return;
	isUploading.value = true;
	try {
		toast.info("Publicando foto...");

		const newImg = await GalleryService.create(
			{
				tenant: tenant.value.$id,
				image_url: "",
				is_public: true,
				caption: caption.value,
				guest: authStore.guest || undefined,
				likes: [],
			},
			file,
		);

		if (!gallery.value.some((img) => img.$id === newImg.$id)) {
			newImg.guest = authStore.guest;
			gallery.value.unshift(newImg);
		}

		caption.value = "";
		toast.success("Foto publicada com sucesso!");
	} catch (err) {
		console.error("Upload failed:", err);
		toast.error("Falha ao publicar foto capturada. Tente novamente.");
	} finally {
		isUploading.value = false;
	}
};

const handleUpload = async (e: Event) => {
	const target = e.target as HTMLInputElement;
	const files = target.files;
	if (!files || files.length === 0 || !tenant.value) return;

	isUploading.value = true;
	try {
		const filesArray = Array.from(files);

		// Limit checking
		const publicImagesCount = gallery.value.filter(img => img.is_public).length;

		if (publicImagesCount + filesArray.length > 100) {
			toast.error("Limite atingido", {
				description: `Você pode enviar no máximo 100 fotos públicas. Espaço restante: ${100 - publicImagesCount}.`,
			});
			return;
		}

		for (let i = 0; i < filesArray.length; i++) {
			const file = filesArray[i];
			const displayIndex = i + 1;
			const totalFiles = filesArray.length;

			toast.info(`Publicando foto ${displayIndex} de ${totalFiles}...`);

			const newImg = await GalleryService.create(
				{
					tenant: tenant.value.$id,
					image_url: "",
					is_public: true,
					caption: caption.value,
					guest: authStore.guest || undefined,
				},
				file,
			);

			// Manually insert to make it responsive instantly if subscription is slow
			if (!gallery.value.some((img) => img.$id === newImg.$id)) {
				newImg.guest = authStore.guest;
				gallery.value.unshift(newImg);
			}
		}

		caption.value = "";
		toast.success(filesArray.length > 1 ? "Fotos publicadas com sucesso!" : "Foto publicada com sucesso!");
	} catch (err) {
		console.error("Upload failed:", err);
		toast.error("Falha ao publicar fotos. Tente novamente.");
	} finally {
		isUploading.value = false;
		target.value = "";
	}
};

const toggleGalleryLike = async (img: IGalleryImage) => {
	const guestId = authStore.guest?.$id || authStore.user?.$id;
	if (!guestId) {
		toast.error("Erro", {
			description: "Você precisa estar logado para curtir as fotos.",
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
		toast.error("Erro", { description: "Falha ao curtir imagem." });
	}
};

const deleteGalleryImage = (image: IGalleryImage) => {
	confirm({
		title: "Excluir Imagem",
		description: "Tem certeza de que deseja excluir esta imagem da galeria?",
		confirmText: "Sim, excluir",
		cancelText: "Não",
		confirm: async () => {
			try {
				await GalleryService.delete(image.$id);
				gallery.value = gallery.value.filter((img) => img.$id !== image.$id);
				toast.success("Imagem removida com sucesso!");
			} catch (err) {
				console.error(err);
				toast.error("Falha ao excluir a imagem.");
			}
		},
	});
};
</script>

<template>
	<main class="min-h-screen font-sans text-slate-600 pb-20"
		:style="{ backgroundColor: tenant?.background_color || '#fafafa' }">
		<div class="max-w-5xl mx-auto p-6 md:p-12 space-y-12">

			<!-- Top header bar -->
			<div class="flex items-center justify-between">
				<router-link :to="`/${$route.params.slug}`"
					class="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
					<ArrowLeft class="w-4 h-4" />
					Voltar para o Casamento
				</router-link>

				<!-- Auth state -->
				<GoogleAuthButton v-if="currentGuest || currentUser"
					@click="currentUser ? $router.push(`/${$route.params.slug}/admin`) : requireAuth()" @logout="logout"
					:user="currentUser || undefined" :fill="false" :themeColor="tenant?.primary_color" />
			</div>

			<!-- Loading / Error -->
			<div v-if="loading" class="flex justify-center p-20 text-slate-400 font-light animate-pulse">
				Carregando galeria...
			</div>
			<div v-else-if="error" class="text-center p-20 text-red-500 font-medium">
				{{ error }}
			</div>

			<!-- Main Panel -->
			<div v-else-if="tenant">
				<!-- Main title -->
				<div class="text-center space-y-4 mb-12">
					<h1 class="text-4xl md:text-5xl font-serif text-slate-900">Galeria dos Convidados</h1>
					<p class="text-slate-500 font-light text-base mx-auto">
						Compartilhe os momentos mais divertidos e românticos do casamento de
						<strong class="font-serif text-slate-800 text-lg">{{ tenant.couple_name }}</strong>.
					</p>
				</div>

				<!-- Auth check wall -->
				<div v-if="!currentGuest && !currentUser"
					class="max-w-md mx-auto text-center p-8 bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
					<div class="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
						<Camera class="w-8 h-8" />
					</div>
					<h2 class="text-2xl font-serif text-slate-900">Identifique-se para Entrar</h2>
					<p class="text-slate-500 text-sm font-light leading-relaxed">
						Para ver as fotos compartilhadas e enviar suas próprias fotos do casamento, faça login com o Google de forma
						simples e segura.
					</p>
					<GoogleAuthButton @click="requireAuth" :fill="true" :themeColor="tenant.primary_color" class="mx-auto" />
				</div>

				<!-- Authenticated Content -->
				<div v-else class="space-y-12">

					<!-- Upload Photo Panel -->
					<div
						class="max-w-xl mx-auto bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
						<h3 class="text-lg font-serif text-slate-900 font-medium flex items-center gap-2">
							<Camera class="w-5 h-5 text-primary" />
							Compartilhar Novo Momento
						</h3>

						<div class="space-y-4">
							<!-- Caption Input -->
							<FormGroup label="Legenda (Opcional)">
								<Input v-model="caption" placeholder="Escreva algo carinhoso, ex: Que casal lindo!" />
							</FormGroup>

							<!-- Upload trigger button -->
							<div class="relative w-full">
								<!-- Inputs -->
								<input type="file" accept="image/*" capture="environment" id="guest-camera-input" class="hidden"
									@change="handleUpload" :disabled="isUploading" />
								<input type="file" accept="image/*" multiple id="guest-gallery-input" class="hidden"
									@change="handleUpload" :disabled="isUploading" />

								<!-- Loading State -->
								<div v-if="isUploading"
									class="flex items-center justify-center gap-2 h-12 w-full bg-slate-100 text-slate-400 font-semibold text-sm rounded-xl select-none cursor-not-allowed">
									<Loader2 class="w-5 h-5 animate-spin" />
									Publicando...
								</div>

								<!-- Action Buttons -->
								<div v-else class="flex gap-2">
									<Button @click="triggerCamera" class="w-11 h-11" :disabled="!hasCamera">
										<Camera class="w-5 h-5" />
									</Button>
									<Button variant="outline" @click="triggerGallery" class="flex-1">
										<Image class="w-5 h-5" />
										Escolher Fotos
									</Button>
								</div>
							</div>
						</div>
					</div>

					<!-- Gallery Grid -->
					<div class="space-y-6">
						<div class="flex items-center justify-between border-b pb-4 border-slate-100">
							<h3 class="text-xl font-serif text-slate-900">Fotos Compartilhadas ({{ publicImages.length }})</h3>
						</div>

						<div v-if="publicImages.length > 0">
							<ImageGallery :images="publicImages" :carousel="false" :currentGuestId="currentGuest?.$id || ''"
								:isAdmin="isAdmin" @like="toggleGalleryLike" @delete="deleteGalleryImage" />
						</div>
						<div v-else
							class="py-16 text-center text-slate-400 border border-dashed border-slate-100 rounded-3xl bg-white/40 font-light">
							Nenhuma foto enviada ainda. Seja o primeiro a compartilhar um momento especial!
						</div>
					</div>

				</div>
			</div>
		</div>

		<!-- Camera Capture Modal -->
		<Modal :open="showCameraModal" @update:open="(val: boolean) => !val && stopCamera()" title="Tirar Foto"
			description="Posicione a câmera e capture um momento especial." class="max-w-md h-full flex flex-col">
			<div class="flex flex-col gap-4 pt-2">
				<div class="flex-1 h-full w-full bg-black rounded-3xl overflow-hidden border border-slate-200">
					<video ref="videoRef" autoplay playsinline class="w-full h-full object-cover"></video>
				</div>
				<Button @click="capturePhoto">
					<Camera class="w-5 h-5 mr-2" />
					Capturar Momento
				</Button>
			</div>
		</Modal>
	</main>
</template>
