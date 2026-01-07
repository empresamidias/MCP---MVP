import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
server: {
  port: 3001, // <--- TEM QUE SER A MESMA DO PROXY_PASS
  host: '0.0.0.0',
  allowedHosts: ['appmcp.jobdevsolutions.online'],
  hmr: {
    host: 'appmcp.jobdevsolutions.online',
    protocol: 'wss',
    clientPort: 443 // <--- FORÇA O NAVEGADOR A USAR A PORTA DO HTTPS
  }
},
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
