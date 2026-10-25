import { defineConfig, type UserConfig } from 'vite'
import { ENTRY_SOURCES } from './src/entries.ts'

/**
 * Host packages stay outside the bundle.
 *
 * camstack-server `tools/build/vite-lib.preset.ts` has two modes.
 * `framework` externalises `@camstack/types`, `@camstack/system`,
 * `@camstack/sdk`, `@camstack/ui-library`, `zod`, and `@trpc/*`.
 * `self-contained` (what current addons in that repo pass) inlines
 * `@camstack/types`, `zod`, and `@camstack/sdk`, and still externalises
 * `@camstack/system` and `@camstack/ui-library` because they own native
 * code or the React singleton. `@camstack/shm-ring` and every
 * `@camstack/types/*` subpath stay host-resolved in both modes.
 *
 * This example uses the framework list so the published file imports
 * `@camstack/types` from the hub instead of inlining it.
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
