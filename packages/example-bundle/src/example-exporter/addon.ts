import { BaseAddon, type AddonInitResult, logDestinationCapability } from '@camstack/types'
import { createExampleExportSink } from './sink.js'

/** Log sink that shares the `example-observers` runner with the listener. */
export class ExampleExporterAddon extends BaseAddon<Record<string, never>> {
  constructor() {
    super({})
  }

  protected async onInitialize(): Promise<AddonInitResult> {
    const sink = createExampleExportSink(this.ctx.logger.child('export'))
    this.ctx.logger.info('example-exporter ready')
    return {
      providers: [{ capability: logDestinationCapability, provider: sink.provider }],
    }
  }
}

export default ExampleExporterAddon
