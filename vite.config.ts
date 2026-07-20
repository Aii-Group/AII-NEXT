import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

const vendorChunkGroups = [
  {
    name: 'vendor-react',
    test: /node_modules[\\/](react|react-dom|scheduler)\//,
    priority: 40,
  },
  {
    name: 'vendor-router',
    test: /node_modules[\\/]@tanstack[\\/](react-router|router|history)/,
    priority: 35,
  },
  {
    name: 'vendor-i18n',
    test: /node_modules[\\/](react-i18next|i18next)([\\/]|$)/,
    priority: 30,
  },
  {
    name: 'vendor-dayjs',
    test: /node_modules[\\/]dayjs([\\/]|$)/,
    priority: 26,
  },
  {
    name: 'vendor-antd',
    test: /node_modules[\\/](antd|@ant-design|rc-)/,
    priority: 25,
  },
  {
    name: 'vendor-icons',
    test: /node_modules[\\/]@icon-park/,
    priority: 25,
  },
  {
    name: 'vendor-axios',
    test: /node_modules[\\/]axios/,
    priority: 20,
  },
  {
    name: 'vendor-state',
    test: /node_modules[\\/]zustand/,
    priority: 20,
  },
];

export default defineConfig(({ command }) => {
  const isBuild = command === 'build';

  return {
    base: '/',
    server: {
      host: '0.0.0.0',
      port: 3000,
      open: true,
      cors: true,
      proxy: {},
    },
    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
      }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom', 'dayjs'],
    },
    optimizeDeps: {
      include: ['dayjs'],
      exclude: ['@icon-park/react'],
    },
    build: {
      target: 'es2022',
      cssCodeSplit: true,
      sourcemap: false,
      reportCompressedSize: false,
      modulePreload: { polyfill: false },
      chunkSizeWarningLimit: 600,
      rolldownOptions: {
        output: {
          codeSplitting: { groups: vendorChunkGroups },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
          ...(isBuild && {
            minify: {
              compress: {
                dropConsole: true,
                dropDebugger: true,
              },
            },
          }),
        },
      },
    },
  };
});
