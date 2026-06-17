<script setup lang="ts">
import { ref, computed } from 'vue';
import { PopoverRoot, PopoverTrigger, PopoverContent } from 'reka-ui';
import { Check, ChevronsUpDown } from 'lucide-vue-next';

interface Option {
  label: string;
  value: string;
}

const props = defineProps<{
  modelValue: string;
  options: Option[];
  placeholder?: string;
  emptyText?: string;
}>();

const emit = defineEmits<(e: 'update:modelValue', val: string) => void>();

const open = ref(false);
const searchQuery = ref('');

const filteredOptions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return props.options;
  return props.options.filter((opt) =>
    opt.label.toLowerCase().includes(query)
  );
});

const currentLabel = computed(() => {
  const found = props.options.find((opt) => opt.value === props.modelValue);
  return found ? found.label : (props.placeholder ?? 'Selecionar...');
});

const handleSelect = (value: string) => {
  emit('update:modelValue', value);
  open.value = false;
  searchQuery.value = '';
};
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child>
      <button type="button" role="combobox" :aria-expanded="open"
        class="flex h-12 w-full items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-left cursor-pointer">
        <span class="truncate">{{ currentLabel }}</span>
        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-400" />
      </button>
    </PopoverTrigger>

    <!-- AJUSTADO: :style garante que o dropdown herda 100% da largura do botão pai -->
    <PopoverContent align="center" :side-offset="6"
      class="w-full z-50 rounded-2xl border border-slate-100 bg-white p-1 shadow-xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
      :style="{ width: 'var(--radix-popover-trigger-width)' }">
      <!-- Input de Busca -->
      <div class="flex items-center border-b border-slate-100/80 px-3 py-2">
        <input v-model="searchQuery" type="text" :placeholder="placeholder ?? 'Buscar...'"
          class="flex h-8 w-full rounded-md bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400" />
      </div>

      <!-- Lista de Opções -->
      <div class="max-h-[220px] overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
        <div v-if="filteredOptions.length === 0" class="py-4 text-center text-sm text-slate-400 font-light">
          {{ emptyText ?? 'Nenhum resultado encontrado.' }}
        </div>

        <button v-else v-for="option in filteredOptions" :key="option.value" type="button"
          @click="handleSelect(option.value)"
          class="relative flex w-full cursor-pointer select-none items-center rounded-xl py-2.5 pl-9 pr-3 text-sm font-medium text-slate-600 outline-none hover:bg-slate-50/80 hover:text-slate-900 transition-colors text-left">
          <span class="absolute left-3 flex h-4 w-4 items-center justify-center">
            <Check v-if="modelValue === option.value" class="h-4 w-4 text-primary stroke-[2.5]" />
          </span>
          <span class="truncate">{{ option.label }}</span>
        </button>
      </div>
    </PopoverContent>
  </PopoverRoot>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #f1f5f9;
  border-radius: 9999px;
}
</style>