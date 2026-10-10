import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: {
    preset: process.env.NITRO_PRESET || "netlify",
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});