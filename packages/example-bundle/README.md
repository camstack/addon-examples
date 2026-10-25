# @camstack/addon-example-bundle

One npm package, three addons. The package is the install unit
(`AddonPackageManifest`, `packages/types/src/interfaces/addon.ts:1375-1454`).
`camstack.bundle` (`addon.ts:1404-1418`, `AddonBundleManifest` at
`addon.ts:1456-1463`) is what the admin UI uses to draw them as one card.

| Addon | Runner | Capability |
| --- | --- | --- |
| `example-devices` | own process, `placement: any-node` | `device-provider` |
| `example-listener` | group `example-observers`, hub-only | none (event consumer) |
| `example-exporter` | same group, hub-only | `log-destination` |

The listener and the exporter share a runner because both are frame-free,
neither sits on a live camera path, and both only react to an event or a
log line. Co-location that exists only to save a process is confined to
addons like that (D29). `example-devices` is a device provider, so it stays
on its own runner. With no `group`, `resolveRunnerId` (`addon.ts:1669-1674`)
returns the addon id.

## Manifest keys

The block is `package.json` → `camstack`. Keys come from
`AddonDeclaration` (`addon.ts:1121-1321`). This repo's
`scripts/manifest-schema.ts` rejects any other key. There is no `widgets`
key; a widget is the `addon-widgets` capability, not a manifest field.

### Identity and display

| Key | In this package | Source |
| --- | --- | --- |
| `id` | each addon | `addon.ts:1123` |
| `entry` | `./dist/<vite entry>.js` | `addon.ts:1124-1125`. The vite name is `src/entries.ts`. |
| `name`, `version`, `description` | set on each addon | `addon.ts:1126-1135` |
| `icon`, `color` | svg under `assets/`, hex color | `addon.ts:1138-1141` |
| `category` | free-form string | `addon.ts:1142-1149` |

Package-level `displayName` and `description` are `addon.ts:1376-1388`.

### `execution` (`AddonExecution`, `addon.ts:1479-1607`)

`placement` (`AddonPlacement`, `addon.ts:1466-1473`):

| Value | Meaning |
| --- | --- |
| `hub-only` | Hub process only. Default when `execution` is omitted (`addon.ts:1207-1208`, `1611`). |
| `any-node` | Hub or an agent. `example-devices`. |
| `agent-only` | Agents only, no hub instance (`addon.ts:1220-1221`). Not used here. |

`group` (`addon.ts:1481-1489`): same string ⇒ one forked runner and one
broker. Omitted ⇒ dedicated runner. Do not set it on a device provider or
anything on the frame path just to reclaim RAM.

`heapProfile` (`addon.ts:1491-1506`): `light` (default) or `heavy`. A
runner is heavy if any co-located addon says `heavy`. All three addons
here say `light`.

Declared only from a measurement, so this package does not set them:

| Key | Flag | Source |
| --- | --- | --- |
| `maxOldSpaceMb` | `--max-old-space-size` | `addon.ts:1507-1519`. `0` lifts the cap. |
| `semiSpaceMb` | `--max-semi-space-size`, integer 1–256 | `addon.ts:1521-1541` |
| `initialOldSpaceMb` | `--initial-old-space-size`, integer 16–65536 | `addon.ts:1542-1557` |
| `rssBudgetMb` | watchdog budget, not a heap ceiling | `addon.ts:1558-1585` |

The runner takes the maximum of each number across the group.

`isolate` (`addon.ts:1586-1606`) is only for a `@camstack/system` builtin
that must leave the hub process. On any other package it is ignored.
These addons do not set it.

```json
"execution": { "placement": "hub-only", "isolate": true }
```

### Capabilities (`CapabilityDeclaration`, `interfaces/capability.ts:54-72`)

The manifest names the capability. Mode, kind, and auth live on the
`*.cap.ts`, not here.

| Key | Meaning |
| --- | --- |
| `name` | capability id, checked against `KNOWN_CAP_NAMES` |
| `dependsOn` | other capability names that must be up first (`capability.ts:57-58`) |
| `autoActivate` | turn the capability on for every device (`capability.ts:59-64`). `false` here. |
| `optional` | the addon may skip `registerProvider` for this name (`capability.ts:65-71`) |

`example-listener` sets `"capabilities": []`. A consumer that only
subscribes does not provide a capability.

### Python and host binaries

`python.requirements` (`addon.ts:1251-1276` and `1327-1334`) is a path
relative to the package root. The kernel pip-installs it before
`onInitialize`. `example-exporter` points at `python/requirements.txt`,
which lists no packages. `mayRequirePython` (`addon.ts:1238`) is the
matching hint.

`systemDependencies` (`addon.ts:1278-1308`, `1345-1373`) names a binary
and the package each host package manager knows it by. The runner does
not run apt itself. This example does not declare one, because a real
entry would install that package on the hub.

### Other declaration keys

Present or intentionally absent:

| Key | Notes | Source |
| --- | --- | --- |
| `protected` | `false` here. `true` means the package cannot be uninstalled. | `addon.ts:1186-1187` |
| `instanceMode` | `unique` or `multiple` | `addon.ts:1153-1154` |
| `mode` | `standalone`, `account`, or `broker` — integration wizard | `addon.ts:1155-1170` |
| `brokerKind` | broker id for device-adoption integrations | `addon.ts:1171-1178` |
| `supportsLocationImport` | locations the adoption flow can import | `addon.ts:1179-1185` |
| `slot` | pipeline slot or null | `addon.ts:1152`. Union in `types/pipeline.ts`. |
| `pages` | admin page. Needs a Module Federation `remoteEntry.js`, so this package does not declare one. | `AddonPageDeclaration`, `addon.ts:1062-1095` |
| `defaultConfig` | default values | `addon.ts:1310-1311`. The single-addon package sets it. |
| `passive` | `true` leaves the addon out of the inference pipeline | `addon.ts:1239-1240` |
| `labelOutputType` | classifier label kind | `addon.ts:1241-1249` |
| `requiredFeatures`, `inputClasses`, `outputClasses`, `requiredSteps`, `supportsCustomModels` | pipeline metadata | `addon.ts:1232-1238` |
| `storageLocations` | disks the kernel should seed | `addon.ts:1314-1320`. Shape: `interfaces/storage-location-declaration.ts:58-121`. |
| `nativeDependencies` | package-level native Node modules the installer rebuilds | `addon.ts:1420-1453` |
| `system` | package-level. Framework packages, not this one. | `addon.ts:1389-1402` |

### `pages` shape (not set on these addons)

```json
"pages": [{
  "id": "overview",
  "label": "Overview",
  "icon": "Boxes",
  "path": "/example",
  "remoteName": "addon_example_listener_page",
  "bundle": "remoteEntry.js",
  "section": "administration"
}]
```

## Tests

`@camstack/types` does not export a fake `AddonContext` (the one in the
server repo is under `src/addon/__tests__/`). Specs use
`test/fake-addon-context.ts` at the repo root. `npm test` runs vitest.
`npm run validate` checks this manifest.
