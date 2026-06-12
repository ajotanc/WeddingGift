<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-sans font-medium ring-offset-white transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:opacity-90 shadow-sm',
        destructive: 'bg-red-500 text-white hover:opacity-90 shadow-sm',
        outline: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 shadow-sm',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200/80',
        ghost: 'hover:bg-slate-100 hover:text-slate-900',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-12 px-6 py-2',
        sm: 'h-10 rounded-lg px-4',
        lg: 'h-14 rounded-2xl px-10 text-base',
        icon: 'h-12 w-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>

interface Props {
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: string
  disabled?: boolean
  as?: string
}

const props = defineProps<Props>()
</script>

<template>
  <component 
    :is="props.as || 'button'" 
    v-bind="$attrs"
    :class="cn(buttonVariants({ variant: props.variant, size: props.size }), props.class)" 
    :disabled="props.disabled"
  >
    <slot />
  </component>
</template>
