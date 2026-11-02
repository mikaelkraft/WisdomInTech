import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { inspectorServer } from "@react-dev-inspector/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  base: '/',
  build: {
    chunkSizeWarningLimit: 2000,
  },
  plugins: [
    tsconfigPaths(),
    react(),
    command === 'serve' ? inspectorServer() : null
  ].filter(Boolean),
  server: {
    port: "4028",
    host: "0.0.0.0",
    strictPort: true,
    allowedHosts: ['.amazonaws.com', '.builtwithrocket.new'],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
}));
