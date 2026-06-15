import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/chemistry/backends': 'http://localhost:8000',
      '/chemistry/parse-smiles': 'http://localhost:8000',
      '/chemistry/run-hf': 'http://localhost:8000',
      '/chemistry/generate-hamiltonian': 'http://localhost:8000',
      '/chemistry/generate-chemistry-circuit': 'http://localhost:8000',
      '/chemistry/circuits': 'http://localhost:8000',
      '/chemistry/vqe': 'http://localhost:8000',
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  worker: {
    format: "es",
  },
}));
