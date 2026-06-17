<script setup lang="ts">
import { CalendarDate } from "@internationalized/date";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-vue-next";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { computed, ref, watch } from "vue";

dayjs.extend(customParseFormat);

const props = defineProps<{ modelValue?: string | null }>();
const emit = defineEmits(["update:modelValue"]);

const popoverOpen = ref(false);

const dateValue = computed({
	get: () => {
		if (!props.modelValue) return undefined;
		const d = dayjs(props.modelValue, "YYYY-MM-DD", true);
		if (!d.isValid()) return undefined;
		return new CalendarDate(d.year(), d.month() + 1, d.date());
	},
	set: (val: CalendarDate | undefined) => {
		if (!val) {
			emit("update:modelValue", "");
			return;
		}
		const d = dayjs(`${val.year}-${val.month}-${val.day}`, "YYYY-M-D");
		emit("update:modelValue", d.format("YYYY-MM-DD"));
		popoverOpen.value = false;
	},
});

const displayValue = ref("");

watch(
	() => props.modelValue,
	(newVal) => {
		if (newVal) {
			const d = dayjs(newVal, "YYYY-MM-DD");
			displayValue.value = d.isValid() ? d.format("DD/MM/YYYY") : "";
		} else {
			displayValue.value = "";
		}
	},
	{ immediate: true },
);

const onInputBlur = () => {
	if (displayValue.value.length === 10) {
		const d = dayjs(displayValue.value, "DD/MM/YYYY", true);
		if (d.isValid()) {
			const iso = d.format("YYYY-MM-DD");
			if (props.modelValue !== iso) {
				emit("update:modelValue", iso);
			}
		}
	} else if (!displayValue.value) {
		emit("update:modelValue", "");
	}
};
</script>

<template>
	<div class="relative flex items-center w-full">
		<input v-model="displayValue" v-maska="'##/##/####'" type="text" placeholder="DD/MM/AAAA"
			class="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pr-12"
			@blur="onInputBlur" @keydown.enter="onInputBlur" />
		<Popover v-model:open="popoverOpen">
			<PopoverTrigger as-child>
				<Button type="button" variant="ghost" size="icon"
					class="absolute right-1 w-10 h-10 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100">
					<CalendarIcon class="h-4 w-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent class="w-auto p-0 bg-white border-slate-200 rounded-2xl shadow-xl z-50">
				<Calendar v-model="dateValue" locale="pt-BR" />
			</PopoverContent>
		</Popover>
	</div>
</template>
