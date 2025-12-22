import typography from '@tailwindcss/typography';

export default {
  content: ["./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6366F1",
        teal: "#14B8A6",
        amber: "#F59E0B",
        rose: "#FB7185"
      },
      backgroundImage: {
        'hero': "url('/hero-bg.svg')"
      }
    },
  },
  plugins: [typography],
};
