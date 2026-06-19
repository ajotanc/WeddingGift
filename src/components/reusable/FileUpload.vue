<script setup lang="ts">
import {
	File,
	FileSpreadsheet,
	FileText,
	Image as ImageIcon,
	Loader2,
	Search,
	UploadCloud,
	X,
} from "lucide-vue-next";
import { computed, ref, watch } from "vue";

const fileInput = ref<HTMLInputElement | null>(null);
const isZoomed = ref(false);

const props = defineProps<{
	modelValue: string | null | undefined;
	accept?: string;
	maxSizeMb?: number;
	fileName?: string;
	uploading?: boolean;
	autoUpload?: boolean;
	multiple?: boolean;
}>();

const emit = defineEmits([
	"update:modelValue",
	"file-selected",
	"update:fileName",
	"auto-upload",
]);

const isDragging = ref(false);
const cacheKey = ref(Date.now());

// Monitora o estado de upload para atualizar a chave do cache da imagem localmente
watch(
	() => props.uploading,
	(newVal, oldVal) => {
		if (oldVal === true && newVal === false) {
			cacheKey.value = Date.now();
		}
	},
);

// URL com cache buster para garantir atualização visual imediata no preview
const previewUrl = computed(() => {
	if (!props.modelValue) return "";
	if (
		props.modelValue.startsWith("blob:") ||
		props.modelValue.startsWith("data:")
	) {
		return props.modelValue;
	}
	const separator = props.modelValue.includes("?") ? "&" : "?";
	return `${props.modelValue}${separator}t=${cacheKey.value}`;
});

// Formatador da mensagem de ajuda
const helperText = computed(() => {
	const types = props.accept?.includes("image/*")
		? "PNG, JPG, WEBP, GIF, AVIF"
		: props.accept
				?.replace(/\./g, "")
				.replace(/\*/g, "")
				.replace(/,/g, ", ")
				.toUpperCase() || "Arquivos";
	return `${types} / ${props.maxSizeMb ? `${props.maxSizeMb}MB` : ""}`;
});

const handleFiles = (files: FileList | null | undefined) => {
	if (!files || files.length === 0) return;

	if (props.multiple) {
		const filesArray: File[] = [];
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			if (props.maxSizeMb && file.size > props.maxSizeMb * 1024 * 1024) {
				alert(
					`Arquivo "${file.name}" muito grande! Máximo: ${props.maxSizeMb}MB`,
				);
				continue;
			}
			filesArray.push(file);
		}
		if (filesArray.length === 0) return;

		if (props.autoUpload) {
			emit("auto-upload", filesArray);
		} else {
			const firstFile = filesArray[0];
			emit("update:modelValue", URL.createObjectURL(firstFile));
			emit("update:fileName", firstFile.name);
			emit("file-selected", firstFile);
		}
	} else {
		const file = files[0];
		if (props.maxSizeMb && file.size > props.maxSizeMb * 1024 * 1024) {
			alert(`Arquivo muito grande! Máximo: ${props.maxSizeMb}MB`);
			return;
		}

		if (props.autoUpload) {
			emit("auto-upload", file);
		} else {
			emit("update:modelValue", URL.createObjectURL(file));
			emit("update:fileName", file.name);
			emit("file-selected", file);
		}
	}
};

const handleUpload = (event: Event) => {
	const target = event.target as HTMLInputElement;
	handleFiles(target.files);
};

const removeFile = () => {
	if (fileInput.value) {
		fileInput.value.value = "";
	}
	emit("update:modelValue", "");
	emit("update:fileName", "");
	emit("file-selected", null);
};

const fileIcon = computed(() => {
	if (!props.modelValue) return null;
	if (
		props.fileName?.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i) ||
		props.modelValue.startsWith("blob:") ||
		props.modelValue.startsWith("http")
	)
		return ImageIcon;
	if (props.fileName?.match(/\.(pdf)$/i)) return FileText;
	if (props.fileName?.match(/\.(xlsx|xls|csv)$/i)) return FileSpreadsheet;
	return File;
});

const closeZoomOverlay = (event: MouseEvent) => {
	event.stopImmediatePropagation();
	event.stopPropagation();
	isZoomed.value = false;
};
</script>

<template>
	<div class="relative">
		<div v-if="uploading"
			class="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
			<Loader2 class="w-8 h-8 text-primary animate-spin" />
		</div>

		<div v-if="!modelValue" @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false"
			@drop.prevent="handleFiles($event.dataTransfer?.files)" @click="fileInput?.click()"
			class="border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300"
			:class="isDragging ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'">
			<UploadCloud class="w-8 h-8 text-slate-400 mb-2" stroke-width="1.5" />
			<p class="text-sm font-medium text-slate-600">
				{{ props.multiple ? 'Clique ou arraste as fotos' : 'Clique ou arraste o arquivo' }}
			</p>
			<p class="text-[11px] text-slate-400 mt-1 uppercase tracking-wider">{{ helperText }}</p>
			<input type="file" ref="fileInput" :accept="accept" :multiple="multiple" class="hidden" @change="handleUpload" />
		</div>

		<div v-else class="relative rounded-2xl border border-slate-200 p-3 bg-white shadow-sm flex items-center gap-4">

			<div v-if="fileIcon === ImageIcon"
				class="group/img relative w-16 h-16 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0">
				<img :src="previewUrl" class="w-full h-full object-cover" />
				<button type="button" @click="isZoomed = true"
					class="absolute inset-0 bg-transparent backdrop-blur-[1px] hover:bg-black/10 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center text-white z-10 border-0 outline-none cursor-pointer">
					<Search class="w-6 h-6" />
				</button>
			</div>

			<div v-else class="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
				<component :is="fileIcon" class="w-6 h-6 text-slate-500" />
			</div>

			<div class="flex-1 min-w-0">
				<p class="text-sm font-medium text-slate-900 truncate">{{ fileName || 'Arquivo selecionado' }}</p>
				<p class="text-xs text-slate-500">{{ uploading ? 'Processando...' : 'Pronto' }}</p>
			</div>

			<button type="button" v-if="!uploading" @click="removeFile"
				class="p-2 text-slate-400 hover:text-red-500 bg-transparent border-0 outline-none transition-colors cursor-pointer">
				<X class="w-5 h-5" />
			</button>
		</div>

		<teleport to="body">
			<div v-if="isZoomed" @click.stop="closeZoomOverlay" @pointerdown.stop @pointerup.stop @mousedown.stop
				@mouseup.stop
				class="fixed inset-0 z-[100] backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer pointer-events-auto">
				<img :src="previewUrl" @click.stop class="max-w-full max-h-full object-contain rounded-lg cursor-default" />

				<button type="button" @click.stop="isZoomed = false"
					class="absolute top-6 right-6 text-slate-600 hover:text-slate-800 p-2 z-[999] bg-slate-200 border-0 outline-none transition-colors rounded-full cursor-pointer">
					<X class="w-8 h-8" />
				</button>
			</div>
		</teleport>
	</div>
</template>