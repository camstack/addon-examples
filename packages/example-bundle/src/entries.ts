/** Vite entry names. Each manifest `entry` is `./dist/<name>.js`. */
export const ENTRY_SOURCES = {
  index: 'src/index.ts',
  'example-devices': 'src/example-devices/addon.ts',
  'example-listener': 'src/example-listener/addon.ts',
  'example-exporter': 'src/example-exporter/addon.ts',
} as const
