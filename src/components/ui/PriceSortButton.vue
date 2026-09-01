<script setup lang="ts">
import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  ArrowUpDown,
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
  if (props.modelValue === "default") return "Clique para ordenar por menor preço";
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
  <button
    type="button"
    @click="toggleSort"
    :title="title"
    aria-label="Ordenar produtos por preço"
    class="h-11 px-3.5 rounded-xl border flex items-center justify-center gap-1.5 shrink-0 transition-all duration-300 cursor-pointer shadow-xs text-xs uppercase tracking-wider font-semibold group"
    :class="modelValue !== 'default'
      ? 'bg-primary/10 text-primary border-primary/40 font-bold shadow-xs'
      : 'bg-white text-slate-500 border-slate-200/80 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300'"
  >
    <ArrowUpDown v-if="modelValue === 'default'" class="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
    <ArrowDownNarrowWide v-else-if="modelValue === 'asc'" class="w-3.5 h-3.5 text-primary" />
    <ArrowUpNarrowWide v-else class="w-3.5 h-3.5 text-primary" />

    <span :class="{ 'hidden min-[360px]:inline': !showTextOnMobile }">
      {{ label }}
    </span>
  </button>
</template>
