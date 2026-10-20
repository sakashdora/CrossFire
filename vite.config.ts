import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import deployment from './vercel.json';
// @ts-expect-error Build-only JavaScript; verified independently by security tests.
import { validatePublicEnvironment } from './scripts/build-security.mjs';

// https://vitejs.dev/config/
export default defineConfig(({command,mode}) => {
  if(command==='build') validatePublicEnvironment(loadEnv(mode,process.cwd(),'VITE_'));
  return {
  plugins: [react()],
  preview: { headers: Object.fromEntries(deployment.headers[0].headers.map(header => [header.key,header.value])) },
  build: {
    sourcemap: false,
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
}; });
