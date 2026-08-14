<script setup lang="ts">
import {
	AlertCircle,
	Mic,
	Pause,
	Play,
	RotateCcw,
	Square,
} from "lucide-vue-next";
import { computed, onUnmounted, ref } from "vue";

const props = withDefaults(
	defineProps<{
		maxDurationSeconds?: number;
	}>(),
	{
		maxDurationSeconds: 60,
	},
);

const emit = defineEmits<{
	(e: "recorded", file: File): void;
	(e: "clear"): void;
}>();

const isRecording = ref(false);
const isPaused = ref(false);
const recordingTime = ref(0);
const audioBlob = ref<Blob | null>(null);
const audioUrl = ref<string | null>(null);
const isPlayingPreview = ref(false);
const errorMessage = ref<string | null>(null);

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let timerInterval: ReturnType<typeof setInterval> | null = null;
let audioElement: HTMLAudioElement | null = null;

const formattedTime = computed(() => {
	const mins = Math.floor(recordingTime.value / 60);
	const secs = recordingTime.value % 60;
	return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
});

const progressPercentage = computed(() => {
	return Math.min(100, (recordingTime.value / props.maxDurationSeconds) * 100);
});

const startRecording = async () => {
	errorMessage.value = null;
	audioChunks = [];
	audioBlob.value = null;
	if (audioUrl.value) {
		URL.revokeObjectURL(audioUrl.value);
		audioUrl.value = null;
	}

	if (!window.isSecureContext) {
		errorMessage.value =
			"O acesso ao microfone exige conexão segura (HTTPS). No celular, acesse via HTTPS.";
		return;
	}

	if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
		errorMessage.value =
			"Seu navegador não suporta gravação de áudio ou o acesso está desabilitado.";
		return;
	}

	try {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

		let mimeType = "audio/webm;codecs=opus";
		if (!MediaRecorder.isTypeSupported(mimeType)) {
			if (MediaRecorder.isTypeSupported("audio/mp4")) {
				mimeType = "audio/mp4";
			} else if (MediaRecorder.isTypeSupported("audio/webm")) {
				mimeType = "audio/webm";
			} else if (MediaRecorder.isTypeSupported("audio/ogg")) {
				mimeType = "audio/ogg";
			} else {
				mimeType = "";
			}
		}

		const options = mimeType ? { mimeType } : undefined;
		mediaRecorder = new MediaRecorder(stream, options);

		mediaRecorder.ondataavailable = (event) => {
			if (event.data && event.data.size > 0) {
				audioChunks.push(event.data);
			}
		};

		mediaRecorder.onstop = () => {
			const finalMime = mediaRecorder?.mimeType || "audio/webm";
			const blob = new Blob(audioChunks, { type: finalMime });
			audioBlob.value = blob;
			audioUrl.value = URL.createObjectURL(blob);

			const ext = blob.type.includes("mp4") ? "mp4" : "webm";
			const file = new File([blob], `recado_audio_${Date.now()}.${ext}`, {
				type: blob.type || "audio/webm",
			});
			emit("recorded", file);

			for (const track of stream.getTracks()) {
				track.stop();
			}
		};

		mediaRecorder.start(200);
		isRecording.value = true;
		isPaused.value = false;
		recordingTime.value = 0;

		timerInterval = setInterval(() => {
			recordingTime.value += 1;
			if (recordingTime.value >= props.maxDurationSeconds) {
				stopRecording();
			}
		}, 1000);
	} catch (err: unknown) {
		console.error("Erro ao acessar microfone:", err);
		if (err instanceof DOMException || err instanceof Error) {
			if (
				err.name === "NotAllowedError" ||
				err.name === "PermissionDeniedError"
			) {
				errorMessage.value =
					"Permissão negada. Ative a permissão de microfone nas configurações do seu navegador para este site.";
				return;
			}
			if (err.name === "NotFoundError") {
				errorMessage.value = "Nenhum microfone encontrado no dispositivo.";
				return;
			}
			if (err.name === "NotReadableError") {
				errorMessage.value = "O microfone está em uso por outro aplicativo.";
				return;
			}
		}
		errorMessage.value =
			"Não foi possível acessar o microfone. Verifique as permissões do seu navegador.";
	}
};

const stopRecording = () => {
	if (mediaRecorder && isRecording.value) {
		mediaRecorder.stop();
		isRecording.value = false;
		isPaused.value = false;
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}
};

const togglePause = () => {
	if (!mediaRecorder) return;

	if (isPaused.value) {
		mediaRecorder.resume();
		isPaused.value = false;
		timerInterval = setInterval(() => {
			recordingTime.value += 1;
			if (recordingTime.value >= props.maxDurationSeconds) {
				stopRecording();
			}
		}, 1000);
	} else {
		mediaRecorder.pause();
		isPaused.value = true;
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}
};

const togglePlayPreview = () => {
	if (!audioUrl.value) return;

	if (!audioElement) {
		audioElement = new Audio(audioUrl.value);
		audioElement.onended = () => {
			isPlayingPreview.value = false;
		};
	}

	if (isPlayingPreview.value) {
		audioElement.pause();
		isPlayingPreview.value = false;
	} else {
		audioElement.play();
		isPlayingPreview.value = true;
	}
};

const resetRecording = () => {
	if (isRecording.value) {
		stopRecording();
	}
	if (audioElement) {
		audioElement.pause();
		audioElement = null;
	}
	isPlayingPreview.value = false;
	audioBlob.value = null;
	if (audioUrl.value) {
		URL.revokeObjectURL(audioUrl.value);
		audioUrl.value = null;
	}
	recordingTime.value = 0;
	emit("clear");
};

onUnmounted(() => {
	if (timerInterval) clearInterval(timerInterval);
	if (audioUrl.value) URL.revokeObjectURL(audioUrl.value);
	if (audioElement) {
		audioElement.pause();
		audioElement = null;
	}
});
</script>

<template>
	<div class="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 sm:p-4 space-y-3 text-center shadow-xs">
		<div v-if="errorMessage" class="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-xl text-xs font-medium text-left">
			<AlertCircle class="w-4 h-4 shrink-0" />
			<span>{{ errorMessage }}</span>
		</div>

		<!-- Estado Inicial (Antes de Gravar) -->
		<div v-if="!isRecording && !audioBlob" class="py-2 sm:py-3 space-y-3">
			<div class="w-11 h-11 sm:w-12 sm:h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto shadow-xs">
				<Mic class="w-5 h-5 sm:w-6 sm:h-6" />
			</div>
			<div>
				<h4 class="font-serif font-bold text-slate-800 text-sm">Recado de Áudio</h4>
				<p class="text-xs text-slate-500 max-w-xs mx-auto mt-0.5">Clique abaixo para gravar sua mensagem de voz (máx: {{ maxDurationSeconds }}s).</p>
			</div>
			<button type="button" @click="startRecording"
				class="w-full mt-1 h-9 px-4 rounded-lg font-semibold uppercase tracking-wider text-[11px] bg-primary text-white border border-primary hover:brightness-105 active:scale-[0.98] transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer">
				<Mic class="w-3.5 h-3.5" />
				Iniciar Gravação
			</button>
		</div>

		<!-- Estado Gravando -->
		<div v-else-if="isRecording" class="py-2 space-y-3">
			<div class="flex items-center justify-center gap-2.5">
				<span class="relative flex h-3 w-3">
					<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
					<span class="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
				</span>
				<span class="text-xl font-bold text-slate-800 tabular-nums">{{ formattedTime }}</span>
				<span class="text-xs text-slate-400 font-medium">/ {{ maxDurationSeconds }}s</span>
			</div>

			<div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden max-w-xs mx-auto">
				<div class="bg-primary h-full transition-all duration-300" :style="{ width: `${progressPercentage}%` }"></div>
			</div>

			<div class="flex items-center w-full gap-2 pt-1">
				<button type="button" @click="togglePause"
					class="flex-1 h-9 px-2 sm:px-3 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer">
					<Pause v-if="!isPaused" class="w-3.5 h-3.5 text-slate-600 shrink-0" />
					<Play v-else class="w-3.5 h-3.5 text-slate-600 shrink-0" />
					<span>{{ isPaused ? 'Continuar' : 'Pausar' }}</span>
				</button>
				<button type="button" @click="stopRecording"
					class="flex-1 h-9 px-2 sm:px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs border border-rose-600 transition-colors cursor-pointer">
					<Square class="w-3 h-3 fill-current shrink-0" />
					<span>Finalizar</span>
				</button>
			</div>
		</div>

		<!-- Estado Pós-Gravação (Prévia do Áudio Pronto) -->
		<div v-else-if="audioBlob" class="py-1">
			<div class="bg-white border border-slate-200 p-2.5 sm:p-3 rounded-xl flex items-center justify-between gap-2 shadow-xs">
				<div class="flex items-center gap-2.5 min-w-0 flex-1">
					<button type="button" @click="togglePlayPreview" class="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shrink-0 shadow-xs hover:scale-105 transition-transform cursor-pointer">
						<Pause v-if="isPlayingPreview" class="w-3.5 h-3.5 fill-current" />
						<Play v-else class="w-3.5 h-3.5 fill-current ml-0.5" />
					</button>
					<div class="text-left min-w-0">
						<p class="text-[11px] font-bold text-slate-800 whitespace-nowrap">
							Áudio Gravado
						</p>
						<p class="text-[10px] text-slate-400">Duração: {{ formattedTime }}</p>
					</div>
				</div>

				<button type="button" @click="resetRecording"
					class="w-9 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 flex items-center justify-center shrink-0 shadow-xs transition-colors cursor-pointer"
					title="Regravar áudio"
					aria-label="Regravar áudio">
					<RotateCcw class="w-4 h-4" />
				</button>
			</div>
		</div>
	</div>
</template>
