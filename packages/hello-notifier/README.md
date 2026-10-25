# @camstack/addon-hello-notifier

One npm package, one addon (`hello-notifier`). It provides `log-destination`,
the smallest output capability: `write` is the only required method.
`addon-notifiers` registers the same way — `BaseAddon`, `constructor() { super({}) }`,
and `onInitialize` returns `{ providers: [{ capability, provider }] }` —
but `notification-output` has a large admin surface, so this example uses
`log-destination` instead.

The settings form has a `password` field (`token`). `storage` is left unset,
so the keychain keeps the value. The sink receives only
`tokenConfigured: boolean` and never logs the secret.

`execution.group` is omitted. The runner id is the addon id
(`resolveRunnerId` in `@camstack/types`, addon.ts:1669-1674).

See the bundle package README for every other manifest key.
