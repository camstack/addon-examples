import type { InferProvider, IScopedLogger, logDestinationCapability } from '@camstack/types'

export const EXAMPLE_EXPORTER_ADDON_ID = 'example-exporter'
const MEMORY_LIMIT = 50

export type ExampleExportSink = InferProvider<typeof logDestinationCapability>

export interface ExportLine {
  readonly level: string
  readonly message: string
}

function remember(lines: readonly ExportLine[], line: ExportLine): readonly ExportLine[] {
  const next = [...lines, line]
  return next.length > MEMORY_LIMIT ? next.slice(next.length - MEMORY_LIMIT) : next
}

/** Co-located log sink. `describeRead` says the ring is not a queryable store. */
export function createExampleExportSink(logger: IScopedLogger): {
  readonly provider: ExampleExportSink
  readonly lines: () => readonly ExportLine[]
} {
  let stored: readonly ExportLine[] = []
  const provider: ExampleExportSink = {
    write: async (entry) => {
      stored = remember(stored, { level: entry.level, message: entry.message })
      logger.info('exported log line', { meta: { message: entry.message, level: entry.level } })
    },
    describeRead: async () => ({
      readable: false,
      reason: 'The example exporter keeps a process-local ring.',
      filters: {
        deviceId: false,
        addonId: false,
        nodeId: false,
        tags: false,
        level: false,
        text: false,
        timeRange: false,
      },
      retentionDays: null,
    }),
  }
  return { provider, lines: () => stored }
}
