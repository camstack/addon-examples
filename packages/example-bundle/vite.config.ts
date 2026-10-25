import { defineConfig, type UserConfig } from 'vite'
import { ENTRY_SOURCES } from './src/entries.ts'

/**
 * Same host-external list as hello-notifier. See that vite.config.ts
 * for which packages the hub resolves and which a self-contained addon
 * build in camstack-server would inline instead.
 */
const HOST_EXTERNALS: ReadonlyArray<RegExp> = [
  /^@camstack\/types(\/.*)?$/,
  /^@camstack\/system(\/.*)?$/,
  /^@camstack\/sdk(\/.*)?$/,
  /^@camstack\/ui-library(\/.*)?$/,
  /^@camstack\/shm-ring(\/.*)?$/,
  /^zod(\/.*)?$/,
  /^@trpc\/server(\/.*)?$/,
  /^@trpc\/client(\/.*)?$/,
  /^node:/,
]

const config: UserConfig = {
  build: {
    target: 'node22',
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    sourcemap: false,
    ssr: true,
    lib: {
      entry: ENTRY_SOURCES,
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [...HOST_EXTERNALS],
      output: {
        manualChunks: () => null,
      },
    },
  },
}

export default defineConfig(config)
