import { DeviceType } from '@camstack/types'

export const EXAMPLE_DEVICES_ADDON_ID = 'example-devices'

export interface ExampleDevice {
  readonly id: number
  readonly stableId: string
  readonly name: string
  readonly type: string
}

export const SEED_DEVICES: readonly ExampleDevice[] = [
  { id: 1, stableId: 'example-lamp', name: 'Example lamp', type: DeviceType.Light },
  { id: 2, stableId: 'example-sensor', name: 'Example sensor', type: DeviceType.Sensor },
]

export function nextDeviceId(devices: readonly ExampleDevice[]): number {
  let max = 0
  for (const device of devices) {
    if (device.id > max) max = device.id
  }
  return max + 1
}

export function readDeviceName(config: Readonly<Record<string, unknown>>): string {
  const name = config['name']
  if (typeof name !== 'string' || name.trim() === '') {
    throw new Error('example-devices: config.name must be a non-empty string')
  }
  return name.trim()
}
