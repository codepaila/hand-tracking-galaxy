import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GitHub Pages serves this project site from a repository subpath.
const PAGES_BASE = "/hand-tracking-galaxy/";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // vite-plugin-singlefile inlines all JS/CSS and forces `base` back to "./"
  // through its own config hook, so a top-level `base` would be ignored. That
  // relative base already makes the single-file build portable, but it hides
  // the intended GitHub Pages subpath. Re-assert the base for production builds
  // via the plugin's `overrideConfig` escape hatch, while leaving the local dev
  // server at the root base.
  plugins: [
    react(),
    tailwindcss(),
    viteSingleFile(
      command === "build" ? { overrideConfig: { base: PAGES_BASE } } : {}
    ),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
}));
