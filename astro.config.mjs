import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import robotsTxt from "astro-robots-txt";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
	integrations: [
		tailwind(),
		react(),
		sitemap({
			filter: (page) => !page.includes('/admin') && !page.includes('/login'),
		}),
		robotsTxt({
			policy: [
				{ userAgent: "*", allow: "/" },
				{ userAgent: "*", disallow: ["/admin", "/login"] }
			],
			sitemap: "https://haion-consulting.es/sitemap-index.xml",
		}),
	],
	site: "https://haion-consulting.es/",
	trailingSlash: "ignore",
});
