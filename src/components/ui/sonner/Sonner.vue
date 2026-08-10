<script lang="ts" setup>
import { cn } from "@/lib/utils";
import {
	CircleCheckIcon,
	InfoIcon,
	Loader2Icon,
	OctagonXIcon,
	TriangleAlertIcon,
	XIcon,
} from "lucide-vue-next";
import type { ToasterProps } from "vue-sonner";
import { Toaster as Sonner, toast } from "vue-sonner";
import { onMounted, onUnmounted } from "vue";

const props = defineProps<ToasterProps>();

const handleToastClick = (e: MouseEvent) => {
	const target = e.target as HTMLElement | null;
	const toastEl = target?.closest("[data-sonner-toast]");
	if (toastEl) {
		const toastId = toastEl.getAttribute("data-styled-id") || toastEl.getAttribute("data-id");
		if (toastId) {
			toast.dismiss(toastId);
		} else {
			toast.dismiss();
		}
	}
};

onMounted(() => {
	document.addEventListener("click", handleToastClick);
});

onUnmounted(() => {
	document.removeEventListener("click", handleToastClick);
});
</script>

<template>
  <Sonner :class="cn('toaster group [&_[data-sonner-toast]]:cursor-pointer', props.class)" :style="{
    '--normal-bg': 'var(--popover)',
    '--normal-text': 'var(--popover-foreground)',
    '--normal-border': 'var(--border)',
    '--border-radius': 'var(--radius)',
  }" v-bind="props">
    <template #success-icon>
      <CircleCheckIcon class="size-4" />
    </template>
    <template #info-icon>
      <InfoIcon class="size-4" />
    </template>
    <template #warning-icon>
      <TriangleAlertIcon class="size-4" />
    </template>
    <template #error-icon>
      <OctagonXIcon class="size-4" />
    </template>
    <template #loading-icon>
      <div>
        <Loader2Icon class="size-4 animate-spin" />
      </div>
    </template>
    <template #close-icon>
      <XIcon class="size-4" />
    </template>
  </Sonner>
</template>