import path from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // catnip-* tags are web components from the Catnip design system, not Vue components
          isCustomElement: (tag) => tag.startsWith("catnip-")
        }
      }
    })
  ],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") }
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.spec.js"]
  }
});
