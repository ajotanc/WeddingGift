<script setup lang="ts">
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

const props = defineProps<{
	open: boolean;
	title?: string;
	description?: string;
}>();

const emit = defineEmits<(e: "update:open", v: boolean) => void>();
</script>

<template>
	<Dialog :open="props.open" @update:open="emit('update:open', $event)">
		<DialogContent aria-describedby="modal-description">
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