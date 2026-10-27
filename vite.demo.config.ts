import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Static, in-browser demo of the portal for GitHub Pages: `npm run demo:build`.
export default defineConfig({
  root: "demo",
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: "next/link", replacement: path.resolve(__dirname, "demo/shims/next-link.tsx") },
      { find: "next/navigation", replacement: path.resolve(__dirname, "demo/shims/next-navigation.ts") },
      { find: "next-auth/react", replacement: path.resolve(__dirname, "demo/shims/next-auth-react.ts") },
      { find: "@", replacement: path.resolve(__dirname, "src") },
    ],
  },
  // Tailwind runs through its Vite plugin; skip the Next.js PostCSS config.
  css: { postcss: { plugins: [] } },
  build: { outDir: "../demo-dist", emptyOutDir: true },
});
