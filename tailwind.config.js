/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				primary: "var(--color-primary)",
				slate: {
					50: "var(--color-slate-50)",
					100: "var(--color-slate-100)",
					200: "var(--color-slate-200)",
					300: "var(--color-slate-300)",
					400: "var(--color-slate-400)",
					500: "var(--color-slate-500)",
					600: "var(--color-slate-600)",
					700: "var(--color-slate-700)",
					800: "var(--color-slate-800)",
					900: "var(--color-slate-900)",
					950: "var(--color-slate-950)",
				},
			},
			fontFamily: {
				sans: ["Outfit", "sans-serif"],
				serif: ["Playfair Display", "serif"],
			},
		},
	},
	plugins: [],
};
