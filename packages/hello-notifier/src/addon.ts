import {
  BaseAddon,
  type AddonInitResult,
  type ConfigUISchema,
  createEvent,
  EventCategory,
  logDestinationCapability,
} from '@camstack/types'
import { HELLO_NOTIFIER_ADDON_ID, createHelloLogDestination } from './sink.js'
import { HELLO_NOTIFIER_SETTINGS } from './settings.js'

export interface HelloNotifierConfig {
  readonly endpoint: string
  readonly token: string
}

/**
 * One addon, one capability. Registration matches addon-notifiers:
 * `BaseAddon`, `super({})` defaults, and a `providers` array whose
 * `capability` is the definition object.
 */
export class HelloNotifierAddon extends BaseAddon<HelloNotifierConfig> {
  constructor() {
    super({ endpoint: '', token: '' })
  }

  protected globalSettingsSchema(): ConfigUISchema {
    return HELLO_NOTIFIER_SETTINGS
  }

  protected async onInitialize(): Promise<AddonInitResult> {
    const provider = createHelloLogDestination({
      endpoint: this.config.endpoint,
      tokenConfigured: this.config.token !== '',
      logger: this.ctx.logger.child('log-destination'),
    })
    this.ctx.eventBus.emit(
      createEvent(
        EventCategory.ProviderStarted,
        { type: 'addon', id: this.ctx.id },
        { providerId: HELLO_NOTIFIER_ADDON_ID, type: 'log-destination' },
      ),
    )
    this.ctx.logger.info('hello-notifier ready', {
      meta: { endpoint: this.config.endpoint, tokenConfigured: this.config.token !== '' },
    })
    return {
      providers: [{ capability: logDestinationCapability, provider }],
    }
  }
}

export default HelloNotifierAddon
