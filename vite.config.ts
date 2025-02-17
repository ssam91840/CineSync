import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  envPrefix: ['VITE_', 'SOURCE_', 'DESTINATION_', 'USE_', 'LOG_', 'MAX_', 'SKIP_', 'EXTRAS_', 'DB_', 'TMDB_'],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
});
