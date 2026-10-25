/**
 * Strict checker for `package.json` `camstack`.
 *
 * The platform's source of truth is the TypeScript interfaces in
 * `@camstack/types` (`AddonDeclaration`, `AddonExecution`,
 * `AddonPackageManifest`). No Zod schema for that block is exported, so
 * this file lists the same keys and rejects anything else. Line numbers
 * below point at camstack-server `packages/types/src/interfaces/addon.ts`
 * unless another file is named.
 */
import { z } from 'zod'

const placementSchema = z.enum(['hub-only', 'agent-only', 'any-node'])

/** `AddonExecution` — addon.ts:1479-1607. `AddonPlacement` — addon.ts:1473. */
export const addonExecutionSchema = z
  .object({
    placement: placementSchema.optional(),
    group: z.string().min(1).optional(),
    heapProfile: z.enum(['light', 'heavy']).optional(),
    maxOldSpaceMb: z.number().optional(),
    semiSpaceMb: z.number().optional(),
    initialOldSpaceMb: z.number().optional(),
    rssBudgetMb: z.number().optional(),
    isolate: z.boolean().optional(),
  })
  .strict()

/** `CapabilityDeclaration` — interfaces/capability.ts:54-72. */
export const capabilityDeclarationSchema = z
  .object({
    name: z.string().min(1),
    dependsOn: z.array(z.string()).optional(),
    autoActivate: z.boolean().optional(),
    optional: z.boolean().optional(),
  })
  .strict()

/** `AddonPageDeclaration` — addon.ts:1062-1095. */
export const addonPageSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    icon: z.string().min(1),
    path: z.string().min(1),
    remoteName: z.string().min(1),
    bundle: z.string().min(1),
    section: z.string().optional(),
    sectionLabel: z.string().optional(),
  })
  .strict()

/** `AddonPythonRequirements` — addon.ts:1327-1334. */
export const addonPythonSchema = z
  .object({
    requirements: z.string().min(1),
  })
  .strict()

/** `AddonSystemDependencyPackages` — addon.ts:1364-1373. */
const systemPackagesSchema = z
  .object({
    apt: z.string().optional(),
    apk: z.string().optional(),
    dnf: z.string().optional(),
    brew: z.string().optional(),
  })
  .strict()

/** `AddonSystemDependency` — addon.ts:1345-1361. */
const systemDependencySchema = z
  .object({
    binary: z.string().min(1),
    packages: systemPackagesSchema,
    reason: z.string().optional(),
  })
  .strict()

/**
 * `StorageLocationDeclaration` — interfaces/storage-location-declaration.ts:58-121.
 * Declared on the addon at addon.ts:1320.
 */
const storageLocationSchema = z
  .object({
    id: z.string().min(1),
    displayName: z.string().min(1),
    description: z.string().optional(),
    cardinality: z.enum(['single', 'multi']),
    access: z.enum(['local-path', 'cap-mediated']).optional(),
    defaultsTo: z.string().optional(),
    defaultRoot: z.enum(['data', 'media', 'backup']).optional(),
  })
  .strict()

const requiredStepSchema = z
  .object({
    slot: z.string().min(1),
    outputClasses: z.array(z.string()),
    description: z.string(),
  })
  .strict()

/**
 * `AddonDeclaration` — addon.ts:1121-1321.
 * There is no `widgets` key. Widgets are a capability (`addon-widgets`),
 * not a manifest entry.
 */
export const addonDeclarationSchema = z
  .object({
    id: z.string().min(1),
    entry: z.string().min(1).optional(),
    name: z.string().optional(),
    version: z.string().optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
    category: z.string().optional(),
    slot: z
      .enum(['detector', 'cropper', 'classifier', 'refiner', 'audio-classifier'])
      .nullable()
      .optional(),
    instanceMode: z.enum(['unique', 'multiple']).optional(),
    mode: z.enum(['standalone', 'account', 'broker']).optional(),
    brokerKind: z.string().optional(),
    supportsLocationImport: z.boolean().optional(),
    protected: z.boolean().optional(),
    execution: addonExecutionSchema.optional(),
    capabilities: z.array(capabilityDeclarationSchema).optional(),
    pages: z.array(addonPageSchema).optional(),
    requiredFeatures: z.array(z.string()).optional(),
    inputClasses: z.array(z.string()).optional(),
    outputClasses: z.array(z.string()).optional(),
    requiredSteps: z.array(requiredStepSchema).optional(),
    supportsCustomModels: z.boolean().optional(),
    mayRequirePython: z.boolean().optional(),
    passive: z.boolean().optional(),
    labelOutputType: z.enum(['classification', 'face', 'plate', 'recognition']).optional(),
    python: addonPythonSchema.optional(),
    systemDependencies: z.array(systemDependencySchema).optional(),
    defaultConfig: z.record(z.string(), z.unknown()).optional(),
    storageLocations: z.array(storageLocationSchema).optional(),
  })
  .strict()

/** `AddonBundleManifest` — addon.ts:1456-1463. */
export const addonBundleSchema = z
  .object({
    displayName: z.string().min(1),
    description: z.string().optional(),
    icon: z.string().optional(),
  })
  .strict()

/** `AddonPackageManifest` — addon.ts:1375-1454. */
export const camstackPackageSchema = z
  .object({
    displayName: z.string().optional(),
    description: z.string().optional(),
    system: z.boolean().optional(),
    addons: z.array(addonDeclarationSchema).min(1),
    bundle: addonBundleSchema.optional(),
    nativeDependencies: z.record(z.string(), z.string()).optional(),
  })
  .strict()

export type CamstackPackageManifest = z.infer<typeof camstackPackageSchema>
export type AddonDeclarationInput = z.infer<typeof addonDeclarationSchema>
