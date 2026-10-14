import { defineConfig } from 'vite';

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/lagan-bloom/' : '/',
  server: {
    port: 5173,
    watch: { usePolling: true, interval: 300 },
  },
}));
