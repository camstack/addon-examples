# CamStack addon examples

Two packages that show how an addon is built, tested, and published.

| Package | What it shows |
| --- | --- |
| [`packages/hello-notifier`](packages/hello-notifier) | One addon in one package. `log-destination` provider, keychain `password` setting, `ctx.eventBus` + `EventCategory`, `constructor() { super({}) }`. |
| [`packages/example-bundle`](packages/example-bundle) | One package, three addons. Placement, a shared runner group, capabilities, a pip requirements file, and the rest of the manifest keys. |

The matching guide is the docs page `develop/addon-examples`.

## Run

Node 22 or newer.

```bash
npm install
npm run build
npm test
npm run validate
```

`validate` checks `camstack.addons[]` against the keys in `@camstack/types`
and checks each capability name against `KNOWN_CAP_NAMES`. It is the
standalone equivalent of `camstack develop validate`. That CLI reads a
camstack-server checkout; this script does not.

## package.json

Both packages are ESM (`"type": "module"`). Names follow
`@camstack/addon-<name>`. Keywords include `camstack`, `addon`, and
`camstack-addon` so a hub search can see them.

| Field | Role |
| --- | --- |
| `main` / `exports` | Point at `dist/`. The hub loads each addon's `camstack.addons[].entry`, not the package barrel. |
| `files` | What `npm publish` ships: `dist`, `README.md`, `CHANGELOG.md`, plus `assets` and `python` when those exist. The hub shows the README and changelog before install. |
| `engines` | `node >= 22`. |
| `peerDependencies` | `@camstack/types` — the hub already has it. This build leaves `@camstack/types` external. |
| `devDependencies` | The compiler, vite, vitest, and a pinned `@camstack/types` so `npm test` typechecks. |
| `camstack` | The manifest. See the bundle README for every key. |
| `scripts.build` | `tsc --noEmit` then `vite build`. |
| `scripts.test` | `vitest run`. |
| `scripts.validate` | The manifest check. |
| `scripts.deploy` | `camstack deploy .` against a dev hub. The `camstack` CLI is installed on the operator machine; it is not a dependency of these packages. |

### What the hub provides, and what a bundle may inline

From `tools/build/vite-lib.preset.ts` in camstack-server:

* Always host-resolved: `@camstack/system` (and subpaths), `@camstack/ui-library`, `@camstack/shm-ring`, and `@camstack/types/*` subpaths such as `@camstack/types/node`.
* `framework` builds also leave `@camstack/types`, `@camstack/sdk`, `zod`, and `@trpc/server` / `@trpc/client` external. These examples do that, and declare `@camstack/types` as a peer.
* `self-contained` builds (the mode current addons in that repo pass) inline `@camstack/types`, `zod`, and `@camstack/sdk`. They still peer or externalise `@camstack/system` and `@camstack/ui-library`. Add those peers when your source imports them.

Do not put secrets in `dependencies`, scripts, or the manifest. A `password` settings field is stored by the keychain.

## Publish

The hub installs the version behind the npm dist-tag `latest` (the `beta`
channel prefers `beta`, then `latest`). An agent installs the version the
hub is running.

```bash
npm run build
npm run test
npm publish --workspace @camstack/addon-hello-notifier --access public
npm publish --workspace @camstack/addon-example-bundle --access public
```

The first publish of a version moves `latest`. To point `latest` at a
version that is already in the registry:

```bash
npm dist-tag add @camstack/addon-hello-notifier@0.1.0 latest
```

`.github/workflows/publish.yml` is off until `NPM_TOKEN` is wired.

## Install on a hub

After publish, the Addons page (or `camstack deploy` from a checkout of
this repo) installs the package into the hub's addons directory. The hub
then starts one runner per addon, or one shared runner when `execution.group`
matches. Deploy from a package directory:

```bash
npm run deploy -w @camstack/addon-hello-notifier
```

These addons are examples. `example-exporter` becomes a real log
destination if you install the bundle on a hub.
