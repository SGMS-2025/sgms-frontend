import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  const tunnelHost = env.VITE_TUNNEL_HOST || 'dev.gymsmart.site'
  const isTunnelMode = mode === 'tunnel' || env.VITE_USE_TUNNEL === 'true'
  
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      port: parseInt(env.VITE_PORT || '5173'),
      host: true,
      // allow both localhost for normal dev and the tunnel host for HTTPS dev
      allowedHosts: ['localhost', '127.0.0.1', tunnelHost],
      // HMR settings:
      // - In tunnel mode, point HMR to the public hostname over wss:443
      // - Otherwise, let Vite use defaults for localhost
      hmr: isTunnelMode
        ? {
            host: tunnelHost,
            protocol: 'wss',
            clientPort: 443,
          }
        : undefined,
    },
  }
})
