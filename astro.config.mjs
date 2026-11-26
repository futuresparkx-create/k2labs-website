import { defineConfig } from "astro/config";

// GitHub Pages project site: served at
//   https://futuresparkx-create.github.io/k2labs-website/
export default defineConfig({
  site: "https://futuresparkx-create.github.io",
  base: "/k2labs-website",
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ta"],
    routing: {
      prefixDefaultLocale: false, // English stays at /, Tamil served from /ta/
    },
  },
});
