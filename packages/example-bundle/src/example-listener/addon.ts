import { BaseAddon, EventCategory, type SystemEvent } from '@camstack/types'

export const EXAMPLE_LISTENER_ADDON_ID = 'example-listener'

export interface HeardDevice {
  readonly deviceId: number
  readonly providerId: string
  readonly name: string | undefined
}

function heardFrom(event: SystemEvent): HeardDevice | null {
  const deviceId = event.data['deviceId']
  const providerId = event.data['providerId']
  const name = event.data['name']
  if (typeof deviceId !== 'number' || typeof providerId !== 'string') return null
  return {
    deviceId,
    providerId,
    name: typeof name === 'string' ? name : undefined,
  }
}

/**
 * Consumer only. Same runner as `example-exporter` (`execution.group`),
 * which is allowed because neither addon touches frames.
 */
export class ExampleListenerAddon extends BaseAddon<Record<string, never>> {
  private heard: readonly HeardDevice[] = []

  constructor() {
    super({})
  }

  heardDevices(): readonly HeardDevice[] {
    return this.heard
  }

  protected async onInitialize(): Promise<void> {
    const unsubscribe = this.ctx.eventBus.subscribe(
      { category: EventCategory.DeviceRegistered },
      (event) => {
        const heard = heardFrom(event)
        if (heard === null) return
        this.heard = [...this.heard, heard]
        this.ctx.logger.info('heard device.registered', {
          tags: { deviceId: heard.deviceId },
          meta: { providerId: heard.providerId, name: heard.name },
        })
      },
    )
    this.ctx.addDisposer(unsubscribe)
    this.ctx.logger.info('example-listener subscribed', {
      meta: { category: EventCategory.DeviceRegistered },
    })
  }
}

export default ExampleListenerAddon
