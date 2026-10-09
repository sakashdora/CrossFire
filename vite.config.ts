import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const path = id.replace(/\\/g, '/');
          if (!path.includes('/node_modules/')) return;
          if (path.includes('/@supabase/')) return 'supabase';
          if (/\/(framer-motion|motion-dom|motion-utils)\//.test(path)) return 'motion';
          if (/\/(react|react-dom|scheduler)\//.test(path)) return 'react';
        },
      },
    },
  },
  server: {
    port: 3000,
    open: false,
  }
});
