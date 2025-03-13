import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import webExtension, { readJsonFile } from 'vite-plugin-web-extension'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

const manifest = readJsonFile('src/manifest.json')

function generateManifest() {
  const pkg = readJsonFile('package.json')
  return {
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    ...manifest,
  }
}

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [
      react(),
      webExtension({
        manifest: generateManifest,
        additionalInputs: [
          ...manifest.web_accessible_resources.map(el => el.resources).flat(),
        ],
      }),
      tailwindcss(),
      NodeGlobalsPolyfillPlugin({
        process: true,
        buffer: true,
      }),
      NodeModulesPolyfillPlugin(),
      tsconfigPaths(),
    ],
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
    },
    build: {
      sourcemap: true,
      target: 'esnext',
      rollupOptions: {
        plugins: [
          // Enable rollup polyfills plugin
          // used during production bundling
          nodePolyfills(),
        ],
      },
    },
  }
})
