<script setup lang="ts">
import { ref } from 'vue'
import { Check, ChevronsUpDown } from 'lucide-vue-next'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const props = defineProps<{
  options: { label: string; value: string }[]
  placeholder?: string
  emptyText?: string
}>()

const model = defineModel<string>()

const open = ref(false)
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :aria-expanded="open"
        class="w-full h-12 justify-between rounded-xl bg-white border-slate-200 font-normal hover:bg-slate-50 transition-all text-slate-700"
        :class="{ 'text-slate-500': !model }"
      >
        {{ model
          ? options.find((opt) => opt.value === model)?.label
          : (placeholder || 'Selecione...') }}
        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[--reka-popover-trigger-width] p-0 rounded-xl shadow-lg border-slate-200 bg-white z-50">
      <Command class="rounded-xl border-none bg-white">
        <CommandInput class="h-11" :placeholder="placeholder || 'Pesquisar...'" />
        <CommandEmpty>{{ emptyText || 'Nenhum resultado.' }}</CommandEmpty>
        <CommandList>
          <CommandGroup>
            <CommandItem
              v-for="option in options"
              :key="option.value"
              :value="option.value"
              @select="() => {
                model = option.value
                open = false
              }"
              class="rounded-lg cursor-pointer my-1"
            >
              <Check
                :class="cn(
                  'mr-2 h-4 w-4',
                  model === option.value ? 'opacity-100' : 'opacity-0'
                )"
              />
              {{ option.label }}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>
