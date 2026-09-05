<script setup lang="ts">
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { PlayCircle } from "lucide-vue-next";
import { ref, watch } from "vue";

interface Props {
	open: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<(e: "update:open", value: boolean) => void>();

const videoRef = ref<HTMLVideoElement | null>(null);

// Pausa o vídeo quando o modal for fechado
const handleOpenChange = (isOpen: boolean): void => {
	if (!isOpen && videoRef.value) {
		videoRef.value.pause();
	}
	emit("update:open", isOpen);
};

// Monitora alterações na prop open para garantir que a reprodução pare ao fechar
watch(
	() => props.open,
	(isOpen: boolean) => {
		if (!isOpen && videoRef.value) {
			videoRef.value.pause();
		}
	},
);
</script>

<template>
	<Dialog :open="props.open" @update:open="handleOpenChange">
		<DialogContent
			class="sm:max-w-md w-full p-6 rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xl"
			aria-describedby="tutorial-video-description"
		>
			<DialogHeader class="text-left">
				<DialogTitle class="font-serif text-slate-900 flex items-center gap-2">
					<PlayCircle class="w-5 h-5 text-primary" />
					<span class="text-lg">Como Utilizar a Plataforma</span>
				</DialogTitle>
				<DialogDescription id="tutorial-video-description" class="text-sm text-slate-500 font-light leading-relaxed">
					Confira o passo a passo em vídeo para confirmar sua presença, presentear os noivos e deixar seus recados com carinho.
				</DialogDescription>
			</DialogHeader>

			<div class="relative w-full mx-auto rounded-2xl overflow-hidden bg-black border border-slate-100 shadow-inner flex items-center justify-center">
				<AspectRatio :ratio="9 / 16" class="w-full">
					<video
						ref="videoRef"
						class="w-full h-full aspect-[9/16] object-contain rounded-2xl"
						controls
						playsinline
						preload="metadata"
					>
						<source src="/videos/tutorial.mp4" type="video/mp4" />
						Seu navegador não suporta a reprodução deste vídeo.
					</video>
				</AspectRatio>
			</div>
		</DialogContent>
	</Dialog>
</template>
