import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

export { default as Button } from "./Button.vue";

// Definimos os efeitos comuns aqui para não repetir código
const commonEffects =
	"rounded-xl shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-300 ease-in-out";

export const buttonVariants = cva(
	`inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive`,
	{
		variants: {
			variant: {
				// Default com o seu efeito
				default: `bg-primary text-white hover:bg-primary/90 ${commonEffects}`,

				// Outline com o seu efeito + cores solicitadas
				outline: `border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors ${commonEffects}`,

				destructive: `bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 ${commonEffects}`,
				secondary: `bg-secondary text-secondary-foreground hover:bg-secondary/80 ${commonEffects}`,
				ghost:
					"hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				default: "h-9 px-4 py-2 has-[>svg]:px-3",
				sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
				lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
				icon: "size-9",
				"icon-sm": "size-8",
				"icon-lg": "size-10",
				wg: "h-11 px-4 py-2 has-[>svg]:px-3",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "wg",
		},
	},
);
export type ButtonVariants = VariantProps<typeof buttonVariants>;
