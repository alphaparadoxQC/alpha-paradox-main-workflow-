import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const prerender = require("vite-plugin-prerender");

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/chemistry': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    prerender({
      staticDir: path.join(__dirname, "dist"),
      routes: ["/", "/builder", "/chemistry", "/pharma"],
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  worker: {
    format: "es",
  },
}));
