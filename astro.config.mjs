import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind(),
    sitemap(),
    robotsTxt({
      policy: [{ userAgent: "*", allow: "/" }],
      sitemap:
        "https://jborrsad.github.io/haion_landing_pages/sitemap-index.xml",
    }),
  ],
  site: "https://jborrsad.github.io/haion_landing_pages/",
  base: "/haion_landing_pages",
});
