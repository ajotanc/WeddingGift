/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				primary: "var(--color-primary)",
			},
			fontFamily: {
				sans: ["Outfit", "sans-serif"],
				serif: ["Playfair Display", "serif"],
			},
		},
	},
	plugins: [],
};
