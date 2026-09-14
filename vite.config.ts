import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function generatePrecacheManifestPlugin(): Plugin {
  return {
    name: 'generate-precache-manifest',
    generateBundle(_options, bundle) {
      const assets: string[] = [
        './',
        './index.html',
        './manifest.json',
        './favicon.png',
        './apple-touch-icon.png',
        './icon.png',
        './icon.svg',
        './icon-192.png',
        './icon-512.png',
        './icon-maskable-192.png',
        './icon-maskable-512.png'
      ];

      for (const fileName of Object.keys(bundle)) {
        if (
          fileName.endsWith('.js') ||
          fileName.endsWith('.css') ||
          fileName.endsWith('.html') ||
          fileName.endsWith('.png') ||
          fileName.endsWith('.svg') ||
          fileName.endsWith('.woff2')
        ) {
          const relativePath = `./${fileName}`;
          if (!assets.includes(relativePath)) {
            assets.push(relativePath);
          }
        }
      }

      this.emitFile({
        type: 'asset',
        fileName: 'precache-manifest.json',
        source: JSON.stringify(assets, null, 2),
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), generatePrecacheManifestPlugin()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('motion')) return 'vendor-motion';
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
          }
        }
      }
    }
  }
});
