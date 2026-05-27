import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { hlsProxyPlugin } from './vite-hls-proxy';
import { teamLogoApiPlugin } from './vite-team-logo-api';
import { walletApiPlugin } from './vite-wallet-api';

export default defineConfig({
  plugins: [react(), teamLogoApiPlugin(), hlsProxyPlugin(), walletApiPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    // Allow localtunnel / cloudflare / ngrok hostnames (phone testing without domain)
    allowedHosts: [
      'localhost',
      '.localhost',
      '.loca.lt',
      '.trycloudflare.com',
      '.ngrok-free.app',
      '.ngrok.io',
      'ballpwal.org',
      'www.ballpwal.org',
    ],
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    allowedHosts: [
      'localhost',
      '.localhost',
      '.loca.lt',
      '.trycloudflare.com',
      '.ngrok-free.app',
      '.ngrok.io',
      'ballpwal.org',
      'www.ballpwal.org',
    ],
  },
});
