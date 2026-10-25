import { DeviceType, type deviceProviderCapability, type InferProvider } from '@camstack/types'
import {
  type ExampleDevice,
  nextDeviceId,
  readDeviceName,
  SEED_DEVICES,
  EXAMPLE_DEVICES_ADDON_ID,
} from './catalog.js'

export type ExampleDeviceProvider = InferProvider<typeof deviceProviderCapability>

export interface ExampleDeviceEvents {
  onRegistered(device: ExampleDevice): void
}

const NOT_SUPPORTED = 'example-devices does not scan a network'

function summary(device: ExampleDevice): {
  id: number
  stableId: string
  addonId: string
  type: string
  name: string
  parentDeviceId: null
  online: true
  features: string[]
  config: Record<string, unknown>
} {
  const features: string[] = []
  const config: Record<string, unknown> = {}
  return {
    id: device.id,
    stableId: device.stableId,
    addonId: EXAMPLE_DEVICES_ADDON_ID,
    type: device.type,
    name: device.name,
    parentDeviceId: null,
    online: true,
    features,
    config,
  }
}

function findByStableId(devices: readonly ExampleDevice[], stableId: string): ExampleDevice {
  const found = devices.find((device) => device.stableId === stableId)
  if (found === undefined) throw new Error(`example-devices: unknown stableId ${stableId}`)
  return found
}

/** In-memory device-provider. Two devices exist as soon as `start` runs. */
export function createExampleDeviceProvider(events: ExampleDeviceEvents): ExampleDeviceProvider {
  let devices: readonly ExampleDevice[] = []
  let connected = false
  const seed = (): void => {
    if (devices.length > 0) return
    devices = SEED_DEVICES.map((device) => ({ ...device }))
    for (const device of devices) events.onRegistered(device)
  }
  return {
    start: async () => {
      connected = true
      seed()
    },
    stop: async () => {
      connected = false
    },
    getStatus: async () => ({ connected, deviceCount: devices.length }),
    getDevices: async () =>
      devices.map((device) => ({ id: String(device.id), name: device.name, type: device.type })),
    reloadDevice: async (input) => ({ deviceId: findByStableId(devices, input.stableId).id }),
    supportsDiscovery: async () => false,
    discoverDevices: async () => [],
    getDiscoveryParamsSchema: async () => null,
    getManualCreationType: async () => ({ deviceType: DeviceType.Generic }),
    adoptDiscoveredDevice: async () => {
      throw new Error(NOT_SUPPORTED)
    },
    supportsManualCreation: async () => true,
    getChildCreationSchema: async () => ({
      sections: [
        {
          id: 'identity',
          title: 'Device',
          fields: [{ type: 'text', key: 'name', label: 'Name' }],
        },
      ],
    }),
    createDevice: async (input) => {
      const name = readDeviceName(input.config)
      const device: ExampleDevice = {
        id: nextDeviceId(devices),
        stableId: `example-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name,
        type: input.type,
      }
      devices = [...devices, device]
      events.onRegistered(device)
      return summary(device)
    },
    testCreationField: async () => ({ status: 'ok', labels: ['example'] }),
  }
}
