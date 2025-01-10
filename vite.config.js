import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";

export default defineConfig({
  plugins: [
    // vue(),
    vueJsx(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "ol/ol.css";`,
      },
    },
  },
  resolve: {
    alias: {
      // 如果需要的话，可以在这里添加别名
    },
  },
  server: {
    open: true,
    host: "0.0.0.0",
    port: 3000,
  },
  build: {
    rollupOptions: {
      external: ["ol"],
      output: {
        globals: {
          ol: "ol",
        },
      },
    },
  },
});
