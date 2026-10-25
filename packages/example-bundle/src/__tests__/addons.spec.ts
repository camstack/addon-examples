import { createEvent, EventCategory } from '@camstack/types'
import { describe, expect, it } from 'vitest'
import { createFakeAddonContext } from '../../../../test/fake-addon-context.js'
import { ExampleDevicesAddon } from '../example-devices/addon.js'
import { readDeviceName } from '../example-devices/catalog.js'
import { ExampleExporterAddon } from '../example-exporter/addon.js'
import { ExampleListenerAddon } from '../example-listener/addon.js'

interface DeviceList {
  getDevices(): Promise<readonly { id: string; name: string; type: string }[]>
}

interface LogWrite {
  write(entry: {
    timestamp: Date
    level: 'info'
    scope: string[]
    message: string
  }): Promise<void>
}

function isDeviceList(value: object): value is DeviceList {
  return 'getDevices' in value && typeof value.getDevices === 'function'
}

function isLogWrite(value: object): value is LogWrite {
  return 'write' in value && typeof value.write === 'function'
}

describe('example devices', () => {
  it('refuses a blank name', () => {
    expect(() => readDeviceName({ name: '  ' })).toThrow(/config.name/)
  })

  it('seeds two devices and emits device.registered', async () => {
    const harness = createFakeAddonContext({ id: 'example-devices' })
    const addon = new ExampleDevicesAddon()
    const result = await addon.initialize(harness.ctx)
    const provider = result?.providers?.[0]?.provider
    if (provider === undefined || !isDeviceList(provider)) {
      throw new Error('expected a device provider')
    }
    const devices = await provider.getDevices()
    expect(devices).toHaveLength(2)
    const registered = harness.events.filter(
      (event) => event.category === EventCategory.DeviceRegistered,
    )
    expect(registered).toHaveLength(2)
    expect(JSON.stringify(harness.lines)).toContain('"deviceId":1')
  })
})

describe('example listener', () => {
  it('records a device.registered event', async () => {
    const harness = createFakeAddonContext({ id: 'example-listener' })
    const addon = new ExampleListenerAddon()
    await addon.initialize(harness.ctx)
    harness.ctx.eventBus.emit(
      createEvent(
        EventCategory.DeviceRegistered,
        { type: 'device', id: 4, deviceId: 4 },
        { deviceId: 4, providerId: 'example-devices', name: 'Porch' },
      ),
    )
    expect(addon.heardDevices()).toEqual([
      { deviceId: 4, providerId: 'example-devices', name: 'Porch' },
    ])
  })
})

describe('example exporter', () => {
  it('records a log line without throwing', async () => {
    const harness = createFakeAddonContext({ id: 'example-exporter' })
    const addon = new ExampleExporterAddon()
    const result = await addon.initialize(harness.ctx)
    const provider = result?.providers?.[0]?.provider
    if (provider === undefined || !isLogWrite(provider)) {
      throw new Error('expected a log destination')
    }
    await provider.write({
      timestamp: new Date(),
      level: 'info',
      scope: ['example'],
      message: 'exported',
    })
    expect(JSON.stringify(harness.lines)).toContain('exported')
  })
})
