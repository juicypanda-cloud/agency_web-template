import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

const devIdentityPlugin = (): Plugin => ({
  name: 'dev-identity-banner',
  configureServer() {
    const cwd = process.cwd();
    console.log(`\n  [vite] Project folder: ${cwd}`);
    console.log('  [vite] Expect: Studio Nova template. If not, you are in a different project.\n');
  },
});

/** Prints the exact URL — many people type `localhost3000` without `http://` or `:`. */
const devUrlHintPlugin = (): Plugin => ({
  name: 'dev-url-hint',
  configureServer(server) {
    server.httpServer?.once('listening', () => {
      const addr = server.httpServer?.address();
      if (!addr || typeof addr === 'string') return;
      const port = addr.port;
      const raw = addr.address;
      const loopback = raw === '::' || raw === '0.0.0.0' || raw === '::1' ? '127.0.0.1' : raw;
      const url = `http://${loopback}:${port}/`;
      console.log('\n\x1b[1m\x1b[36m  Paste this full URL into the browser bar:\x1b[0m');
      console.log(`\x1b[1m  ${url}\x1b[0m`);
      console.log('\x1b[33m  (needs "http://" and ":" — not "localhost3000")\x1b[0m\n');
    });
  },
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), devIdentityPlugin(), devUrlHintPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '127.0.0.1',
      open: process.env.CI === 'true' || process.env.VITE_NO_OPEN === '1' ? false : true,
      strictPort: process.env.VITE_STRICT_PORT === '0' ? false : true,
      hmr:
        process.env.DISABLE_HMR === 'true' ||
        process.env.DISABLE_HMR === '1' ||
        process.env.VITE_DISABLE_HMR === '1'
          ? false
          : true,
    },
  };
});
