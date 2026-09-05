<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
	ArrowDownNarrowWide,
	ArrowUpDown,
	ArrowUpNarrowWide,
} from "lucide-vue-next";
import { computed } from "vue";

export type PriceSortOrder = "default" | "asc" | "desc";

const props = withDefaults(
	defineProps<{
		modelValue?: PriceSortOrder;
		showTextOnMobile?: boolean;
	}>(),
	{
		modelValue: "default",
		showTextOnMobile: false,
	},
);

const emit = defineEmits<{
	(e: "update:modelValue", value: PriceSortOrder): void;
	(e: "change", value: PriceSortOrder): void;
}>();

const title = computed(() => {
	if (props.modelValue === "default")
		return "Clique para ordenar por menor preço";
	if (props.modelValue === "asc") return "Clique para ordenar por maior preço";
	return "Clique para voltar à ordem padrão";
});

const label = computed(() => {
	if (props.modelValue === "default") return "Preço";
	if (props.modelValue === "asc") return "Menor";
	return "Maior";
});

// Alterna os estados ciclicamente: Padrão -> Menor -> Maior -> Padrão
const toggleSort = () => {
	let nextValue: PriceSortOrder = "default";
	if (props.modelValue === "default") {
		nextValue = "asc";
	} else if (props.modelValue === "asc") {
		nextValue = "desc";
	} else {
		nextValue = "default";
	}

	emit("update:modelValue", nextValue);
	emit("change", nextValue);
};
</script>

<template>
  <Button
    type="button"
    variant="outline"
    :size="showTextOnMobile ? 'default' : 'icon'"
    @click="toggleSort"
    :title="title"
    aria-label="Ordenar produtos por preço"
    class="cursor-pointer group text-xs uppercase tracking-wider font-semibold transition-all duration-300"
    :class="modelValue !== 'default'
      ? 'bg-primary/10 text-primary border-primary/40 font-bold hover:bg-primary/15 hover:text-primary shadow-xs'
      : 'hover:border-slate-300 text-slate-500'"
  >
    <ArrowUpDown v-if="modelValue === 'default'" class="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
    <ArrowDownNarrowWide v-else-if="modelValue === 'asc'" class="w-4 h-4 text-primary" />
    <ArrowUpNarrowWide v-else class="w-4 h-4 text-primary" />

    <span v-if="showTextOnMobile">
      {{ label }}
    </span>
  </Button>
</template>
