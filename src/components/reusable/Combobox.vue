<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-vue-next";
import { computed, ref } from "vue";

interface Option {
	label: string;
	value: string;
}

const props = defineProps<{
	modelValue?: string;
	options: Option[];
	placeholder?: string;
	emptyText?: string;
}>();

const emit = defineEmits<(e: "update:modelValue", val: string) => void>();

const open = ref(false);

const currentLabel = computed(() => {
	const found = props.options.find((opt) => opt.value === props.modelValue);
	return found ? found.label : (props.placeholder ?? "Selecionar...");
});

const handleSelect = (value: string) => {
	emit("update:modelValue", value);
	open.value = false;
};
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button type="button" role="combobox" :aria-expanded="open" variant="outline"
        class="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-left cursor-pointer">
        <span class="truncate">{{ currentLabel }}</span>
        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50 text-slate-400" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="p-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl z-50"
      :style="{ width: 'var(--reka-popover-trigger-width)' }">
      <Command>
        <CommandInput class="h-9" :placeholder="placeholder ?? 'Buscar...'" />
        <CommandEmpty>{{ emptyText ?? 'Nenhum resultado.' }}</CommandEmpty>
        <CommandList class="max-h-[220px] overflow-y-auto p-1">
          <CommandGroup>
            <CommandItem v-for="option in options" :key="option.value" :value="option.value"
              @select="() => handleSelect(option.value)"
              class="relative flex w-full cursor-pointer items-center rounded-lg py-2.5 pl-9 pr-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-left">
              <span class="absolute left-3 flex h-4 w-4 items-center justify-center">
                <Check v-if="modelValue === option.value" class="h-4 w-4 text-primary" />
              </span>
              <span>{{ option.label }}</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>