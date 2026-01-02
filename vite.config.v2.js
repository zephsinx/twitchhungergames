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
      ],
    }),
  ],
  build: {
    outDir: "dist-v2",
    assetsDir: "assets",
    rollupOptions: {
      input: {
        main: "./index-v2.html",
      },
    },
  },
  server: {
    port: 5174,
  },
});
