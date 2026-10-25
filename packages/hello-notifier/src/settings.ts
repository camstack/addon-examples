import type { ConfigUISchema } from '@camstack/types'

/**
 * Global settings. `type: 'password'` is a keychain secret unless
 * `storage: 'inline'` is set (`ConfigFieldBase.storage`, config-ui.ts).
 * This field leaves `storage` unset, so the value stays in the keychain
 * and never in the environment.
 */
export const HELLO_NOTIFIER_SETTINGS: ConfigUISchema = {
  sections: [
    {
      id: 'delivery',
      title: 'Delivery',
      fields: [
        {
          type: 'text',
          key: 'endpoint',
          label: 'Endpoint',
          description: 'Recorded next to each accepted line. This example does not call it.',
        },
        {
          type: 'password',
          key: 'token',
          label: 'Token',
          description: 'Keychain secret. The addon never logs this value.',
          showToggle: true,
        },
      ],
    },
  ],
}
