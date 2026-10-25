import type { InferProvider, IScopedLogger, logDestinationCapability } from '@camstack/types'

export const HELLO_NOTIFIER_ADDON_ID = 'hello-notifier'
const MEMORY_LIMIT = 50

export type HelloLogDestination = InferProvider<typeof logDestinationCapability>

export interface HelloLogDeps {
  readonly endpoint: string
  readonly tokenConfigured: boolean
  readonly logger: IScopedLogger
}

export interface AcceptedLine {
  readonly level: string
  readonly message: string
}

interface LogTags {
  readonly [key: string]: string
}

function numericDeviceId(tags: LogTags | undefined): number | undefined {
  const raw = tags?.['deviceId']
  if (raw === undefined || !/^[0-9]+$/.test(raw)) return undefined
  const value = Number(raw)
  return Number.isSafeInteger(value) ? value : undefined
}

function remember(lines: readonly AcceptedLine[], line: AcceptedLine): readonly AcceptedLine[] {
  const next = [...lines, line]
  return next.length > MEMORY_LIMIT ? next.slice(next.length - MEMORY_LIMIT) : next
}

/**
 * Smallest output provider: `log-destination.write` is the only required
 * method. The token is a boolean here — the secret string never enters
 * this function.
 */
export function createHelloLogDestination(deps: HelloLogDeps): HelloLogDestination {
  let lines: readonly AcceptedLine[] = []
  let warned = false
  return {
    write: async (entry) => {
      const deviceId = numericDeviceId(entry.tags)
      const tags = deviceId !== undefined ? { deviceId } : undefined
      lines = remember(lines, { level: entry.level, message: entry.message })
      if (!deps.tokenConfigured && !warned) {
        warned = true
        deps.logger.warn('delivery token is not set; lines stay in memory', { tags })
      }
      deps.logger.info('accepted log line', {
        tags,
        meta: { message: entry.message, endpoint: deps.endpoint },
      })
    },
    describeRead: async () => ({
      readable: false,
      reason: 'This example keeps a short in-memory ring and does not read it back.',
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
}
