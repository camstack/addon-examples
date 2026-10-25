import { EventCategory } from '@camstack/types'
import { describe, expect, it } from 'vitest'
import { createFakeAddonContext } from '../../../../test/fake-addon-context.js'
import { HelloNotifierAddon } from '../addon.js'
import { HELLO_NOTIFIER_SETTINGS } from '../settings.js'

const SECRET = 'super-secret-value'

interface LogWrite {
  write(entry: {
    timestamp: Date
    level: 'info'
    scope: string[]
    message: string
    tags?: Record<string, string>
  }): Promise<void>
}

function isLogWrite(value: object): value is LogWrite {
  return 'write' in value && typeof value.write === 'function'
}

describe('hello-notifier settings', () => {
  it('keeps the token on a password field with keychain storage', () => {
    const field = HELLO_NOTIFIER_SETTINGS.sections
      .flatMap((section) => section.fields)
      .find((item) => item.key === 'token')
    expect(field).toBeDefined()
    if (field === undefined || field.type !== 'password') {
      throw new Error('token field must be type password')
    }
    expect(field.storage).toBeUndefined()
  })
})

describe('HelloNotifierAddon', () => {
  it('emits provider.started and never logs the token', async () => {
    const harness = createFakeAddonContext({
      id: 'hello-notifier',
      store: { endpoint: 'https://example.invalid/hook', token: SECRET },
    })
    const addon = new HelloNotifierAddon()
    const result = await addon.initialize(harness.ctx)
    const provider = result?.providers?.[0]?.provider
    if (provider === undefined || !isLogWrite(provider)) {
      throw new Error('expected a log-destination provider')
    }
    await provider.write({
      timestamp: new Date(),
      level: 'info',
      scope: ['example'],
      message: 'ping',
      tags: { deviceId: '7' },
    })

    expect(harness.events.some((event) => event.category === EventCategory.ProviderStarted)).toBe(
      true,
    )
    const dumped = JSON.stringify(harness.lines)
    expect(dumped).not.toContain(SECRET)
    expect(dumped).toContain('ping')
    expect(dumped).toContain('"deviceId":7')
  })
})
