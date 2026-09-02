<script setup lang="ts">
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { HTMLAttributes } from "vue";

const props = withDefaults(
	defineProps<{
		open: boolean;
		title?: string;
		description?: string;
		preventAutofocus?: boolean;
		class?: HTMLAttributes["class"];
	}>(),
	{
		preventAutofocus: true,
	},
);

const emit = defineEmits<(e: "update:open", v: boolean) => void>();
</script>

<template>
	<Dialog :open="props.open" @update:open="emit('update:open', $event)">
		<DialogContent :class="props.class" aria-describedby="modal-description"
			@open-auto-focus="(e) => { if (props.preventAutofocus) e.preventDefault(); }">
			<DialogHeader v-if="props.title || props.description">
				<DialogTitle v-if="props.title">{{ props.title }}</DialogTitle>

				<DialogDescription :class="{ 'hidden': !props.description }">
					{{ props.description }}
				</DialogDescription>
			</DialogHeader>

			<slot />
		</DialogContent>
	</Dialog>
</template>