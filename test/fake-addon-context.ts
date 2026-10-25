/**
 * Typed AddonContext for example specs.
 *
 * `@camstack/types` keeps an equivalent helper under
 * `src/addon/__tests__/fake-addon-context.ts` and does not export it.
 * Members a spec does not use throw, so a path that reaches an unwired
 * service fails by name.
 */
import { createRequire } from 'node:module'
import type { AddonContext, EventFilter, IEventBus, SystemEvent } from '@camstack/types'

const require = createRequire(import.meta.url)

type SettingsView = NonNullable<AddonContext['settings']>

export interface CapturedLog {
  readonly level: 'debug' | 'info' | 'warn' | 'error'
  readonly message: string
  readonly extras: unknown
}

export interface FakeAddonContextOptions {
  readonly id?: string
  readonly localNodeId?: string
  readonly store?: Readonly<Record<string, unknown>>
}

export interface FakeAddonHarness {
  readonly ctx: AddonContext
  readonly lines: readonly CapturedLog[]
  readonly events: readonly SystemEvent[]
}

function unused(name: string): () => never {
  return () => {
    throw new Error(`${name} is not part of this test`)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Load the CJS tRPC client. `@camstack/types` types `AddonApi` against that
 * build; an ESM import of `@trpc/client` is a different unique symbol and
 * does not assign.
 */
function createApi(): AddonContext['api'] {
  const loaded: unknown = require('@trpc/client')
  if (!isRecord(loaded)) throw new Error('@trpc/client did not load')
  const create = loaded['createTRPCClient']
  if (typeof create !== 'function') throw new Error('createTRPCClient is missing')
  const unwired = (): (() => never) => () => {
    throw new Error('ctx.api is not wired in this test')
  }
  return create({ links: [unwired] })
}

function recordingLogger(lines: CapturedLog[]): AddonContext['logger'] {
  const push = (level: CapturedLog['level'], message: string, extras: unknown): void => {
    lines.push({ level, message, extras })
  }
  const logger: AddonContext['logger'] = {
    debug: (message, extras) => push('debug', message, extras),
    info: (message, extras) => push('info', message, extras),
    warn: (message, extras) => push('warn', message, extras),
    error: (message, extras) => push('error', message, extras),
    child: () => logger,
    withTags: () => logger,
  }
  return logger
}

function fakeDevices(): AddonContext['kernel']['devices'] {
  return {
    create: unused('kernel.devices.create'),
    allocateDeviceId: unused('kernel.devices.allocateDeviceId'),
    createContext: unused('kernel.devices.createContext'),
    loadConfig: unused('kernel.devices.loadConfig'),
    persistInitialConfig: unused('kernel.devices.persistInitialConfig'),
    setName: unused('kernel.devices.setName'),
    setLocation: unused('kernel.devices.setLocation'),
    setDisabled: unused('kernel.devices.setDisabled'),
    register: unused('kernel.devices.register'),
    remove: unused('kernel.devices.remove'),
    decommission: unused('kernel.devices.decommission'),
    applyDerivedSpec: unused('kernel.devices.applyDerivedSpec'),
    getAll: unused('kernel.devices.getAll'),
    getChildren: unused('kernel.devices.getChildren'),
  }
}

function fakeSettings(store: Readonly<Record<string, unknown>>): SettingsView {
  return {
    readAddonStore: async () => ({ ...store }),
    writeAddonStore: unused('settings.writeAddonStore'),
    readDeviceStoreBatch: unused('settings.readDeviceStoreBatch'),
    listDeviceStoreIds: unused('settings.listDeviceStoreIds'),
    readDeviceStore: unused('settings.readDeviceStore'),
    writeDeviceStore: unused('settings.writeDeviceStore'),
    clearDeviceStore: unused('settings.clearDeviceStore'),
    getSection: unused('settings.getSection'),
    setSection: unused('settings.setSection'),
    readDeviceRuntimeState: unused('settings.readDeviceRuntimeState'),
    writeDeviceRuntimeState: unused('settings.writeDeviceRuntimeState'),
    clearDeviceRuntimeState: unused('settings.clearDeviceRuntimeState'),
  }
}

class RecordingBus implements IEventBus {
  readonly events: SystemEvent[] = []
  private handlers: Array<{
    readonly category: string | undefined
    readonly handler: (event: SystemEvent) => void
  }> = []

  emit(event: SystemEvent): void {
    this.events.push(event)
    const matched = this.handlers.filter(
      (entry) => entry.category === undefined || entry.category === event.category,
    )
    for (const entry of matched) entry.handler(event)
  }

  subscribe(filter: EventFilter, handler: (event: SystemEvent) => void): () => void {
    const category = typeof filter.category === 'string' ? filter.category : undefined
    const entry = { category, handler }
    this.handlers = [...this.handlers, entry]
    return () => {
      this.handlers = this.handlers.filter((item) => item !== entry)
    }
  }

  getRecent(_filter?: EventFilter, _limit?: number): readonly SystemEvent[] {
    return this.events
  }
}

/** Build a context plus the log lines and bus events the spec asserts on. */
export function createFakeAddonContext(options: FakeAddonContextOptions = {}): FakeAddonHarness {
  const lines: CapturedLog[] = []
  const bus = new RecordingBus()
  const ctx: AddonContext = {
    id: options.id ?? 'test-addon',
    logger: recordingLogger(lines),
    eventBus: bus,
    addonConfig: {},
    dataDir: '/tmp/camstack-example-addon',
    nodeDataDir: '/tmp/camstack-example',
    kernel: { localNodeId: options.localNodeId ?? 'hub', devices: fakeDevices() },
    settings: fakeSettings(options.store ?? {}),
    api: createApi(),
    deps: {
      ensureBinary: unused('deps.ensureBinary'),
      ensureFfmpeg: unused('deps.ensureFfmpeg'),
      ensurePython: unused('deps.ensurePython'),
      installPythonPackages: unused('deps.installPythonPackages'),
      installPythonRequirements: unused('deps.installPythonRequirements'),
      getDepsDir: unused('deps.getDepsDir'),
    },
    getNativeProvider: unused('getNativeProvider'),
    fetchDevice: unused('fetchDevice'),
    useCapability: unused('useCapability'),
    acquireCapability: unused('acquireCapability'),
    onCapabilityStateChange: unused('onCapabilityStateChange'),
    addDisposer: () => () => undefined,
  }
  return { ctx, lines, events: bus.events }
}
