import {
  BaseAddon,
  type AddonInitResult,
  createEvent,
  deviceProviderCapability,
  EventCategory,
} from '@camstack/types'
import { EXAMPLE_DEVICES_ADDON_ID } from './catalog.js'
import { createExampleDeviceProvider } from './provider.js'

/** Fake device provider. Its own runner: the manifest sets no `execution.group`. */
export class ExampleDevicesAddon extends BaseAddon<Record<string, never>> {
  constructor() {
    super({})
  }

  protected async onInitialize(): Promise<AddonInitResult> {
    const provider = createExampleDeviceProvider({
      onRegistered: (device) => {
        this.ctx.logger.info('example device registered', {
          tags: { deviceId: device.id, deviceName: device.name },
        })
        this.ctx.eventBus.emit(
          createEvent(
            EventCategory.DeviceRegistered,
            { type: 'device', id: device.id, addonId: this.ctx.id, deviceId: device.id },
            { deviceId: device.id, providerId: EXAMPLE_DEVICES_ADDON_ID, name: device.name },
          ),
        )
      },
    })
    await provider.start()
    return { providers: [{ capability: deviceProviderCapability, provider }] }
  }
}

export default ExampleDevicesAddon
