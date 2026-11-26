import typography from '@tailwindcss/typography';

export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#1D2E6E",
          orange: "#F26522",
          sky: "#5BB8D4",
          dark: "#07101f",
          off: "#F5F3EE",
          grey: "#9ca3af"
        }
      }
    }
  },
  plugins: [typography],
};
