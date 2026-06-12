<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Calendar as CalendarIcon } from 'lucide-vue-next'
import { CalendarDate, parseDate } from '@internationalized/date'
import { vMaska } from 'maska/vue'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const props = defineProps<{ modelValue?: string }>()
const emit = defineEmits(['update:modelValue'])

const popoverOpen = ref(false)

const dateValue = computed({
  get: () => {
    if (!props.modelValue) return undefined
    try {
      return parseDate(props.modelValue)
    } catch {
      return undefined
    }
  },
  set: (val: CalendarDate | undefined) => {
    if (!val) {
      emit('update:modelValue', '')
      return
    }
    emit('update:modelValue', val.toString())
    popoverOpen.value = false
  }
})

const displayValue = ref('')

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    try {
      const d = parseDate(newVal)
      const dd = String(d.day).padStart(2, '0')
      const mm = String(d.month).padStart(2, '0')
      const yyyy = d.year
      displayValue.value = `${dd}/${mm}/${yyyy}`
    } catch {
      displayValue.value = ''
    }
  } else {
    displayValue.value = ''
  }
}, { immediate: true })

const onInputBlur = () => {
  if (displayValue.value.length === 10) {
    const [dd, mm, yyyy] = displayValue.value.split('/')
    if (dd && mm && yyyy && yyyy.length === 4) {
      const iso = `${yyyy}-${mm}-${dd}`
      if (props.modelValue !== iso) {
        emit('update:modelValue', iso)
      }
    }
  } else if (!displayValue.value) {
    emit('update:modelValue', '')
  }
}
</script>

<template>
  <div class="relative flex items-center w-full">
    <CalendarIcon class="absolute left-4 h-5 w-5 text-slate-400 z-10 pointer-events-none" />
    <Input 
      v-model="displayValue"
      v-maska="'##/##/####'"
      placeholder="DD/MM/AAAA"
      class="pl-12 pr-12 w-full h-12 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-primary font-sans text-slate-900"
      @blur="onInputBlur"
      @keydown.enter="onInputBlur"
    />
    <Popover v-model:open="popoverOpen">
      <PopoverTrigger as-child>
        <Button type="button" variant="ghost" size="icon" class="absolute right-1 w-10 h-10 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100">
          <CalendarIcon class="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-auto p-0 bg-white border-slate-200 rounded-2xl shadow-xl z-50">
        <Calendar v-model="dateValue" locale="pt-BR" />
      </PopoverContent>
    </Popover>
  </div>
</template>
