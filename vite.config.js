import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  publicDir: "assets",
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: "data/**/*",
          dest: "data",
        },
        {
          src: "js/event-handlers.js",
          dest: "js",
        },
      ],
    }),
  ],
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: {
        main: "./index.html",
      },
    },
  },
});
