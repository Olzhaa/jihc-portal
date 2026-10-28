import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Public college website (jihc.edu.kz): `npm run site:build`.
export default defineConfig({
  root: "site",
  base: "./",
  plugins: [react(), tailwindcss()],
  // Tailwind runs through its Vite plugin; skip the Next.js PostCSS config.
  css: { postcss: { plugins: [] } },
  build: { outDir: "../site-dist", emptyOutDir: true },
});
