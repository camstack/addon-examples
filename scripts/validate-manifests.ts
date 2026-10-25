/**
 * Manifest check for this repo — the standalone stand-in for
 * `camstack develop validate` / MCP `validate_addon`.
 *
 * Those tools read the camstack-server workspace catalogue. Here the
 * capability names are checked against `KNOWN_CAP_NAMES` from
 * `@camstack/types`, and every manifest key is checked by
 * `camstackPackageSchema`.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { KNOWN_CAP_NAMES } from '@camstack/types'
import { camstackPackageSchema } from './manifest-schema.js'

export interface ManifestFinding {
  readonly level: 'error' | 'warn'
  readonly message: string
}

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const knownCaps = new Set<string>(KNOWN_CAP_NAMES)

function isEntryMap(value: unknown): value is Readonly<Record<string, string>> {
  if (typeof value !== 'object' || value === null) return false
  return Object.values(value).every((item) => typeof item === 'string')
}

function readPackageJson(pkgDir: string): unknown {
  const text = readFileSync(join(pkgDir, 'package.json'), 'utf8')
  return JSON.parse(text)
}

function packageNameOf(raw: unknown): string {
  if (typeof raw !== 'object' || raw === null) return '(unreadable)'
  const name = Reflect.get(raw, 'name')
  return typeof name === 'string' ? name : '(unnamed)'
}

function camstackOf(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) return undefined
  return Reflect.get(raw, 'camstack')
}

async function entrySources(pkgDir: string): Promise<Readonly<Record<string, string>> | null> {
  const source = join(pkgDir, 'src', 'entries.ts')
  if (!existsSync(source)) return null
  const loaded: unknown = await import(pathToFileURL(source).href)
  if (typeof loaded !== 'object' || loaded === null) return null
  const map = Reflect.get(loaded, 'ENTRY_SOURCES')
  return isEntryMap(map) ? map : null
}

function checkAddonFiles(
  pkgDir: string,
  addonId: string,
  addon: {
    readonly entry?: string | undefined
    readonly icon?: string | undefined
    readonly description?: string | undefined
    readonly python?: { readonly requirements: string } | undefined
    readonly capabilities?: readonly { readonly name: string }[] | undefined
  },
  sources: Readonly<Record<string, string>> | null,
): readonly ManifestFinding[] {
  const findings: ManifestFinding[] = []
  if (addon.description === undefined || addon.description.trim() === '') {
    findings.push({
      level: 'warn',
      message: `${addonId}: description missing`,
    })
  }
  if (addon.entry !== undefined) {
    const match = /^\.\/dist\/(.+)\.js$/.exec(addon.entry)
    const key = match?.[1]
    if (key === undefined) {
      findings.push({
        level: 'error',
        message: `${addonId}: entry must look like ./dist/<vite-entry>.js`,
      })
    } else if (sources === null || sources[key] === undefined) {
      findings.push({
        level: 'error',
        message: `${addonId}: vite entry "${key}" is not in src/entries.ts`,
      })
    } else if (!existsSync(join(pkgDir, sources[key]))) {
      findings.push({
        level: 'error',
        message: `${addonId}: entry source missing (${sources[key]})`,
      })
    }
  }
  if (addon.icon !== undefined && !existsSync(join(pkgDir, addon.icon))) {
    findings.push({ level: 'error', message: `${addonId}: icon not found (${addon.icon})` })
  }
  if (addon.python !== undefined && !existsSync(join(pkgDir, addon.python.requirements))) {
    findings.push({
      level: 'error',
      message: `${addonId}: python requirements file missing (${addon.python.requirements})`,
    })
  }
  for (const cap of addon.capabilities ?? []) {
    if (!knownCaps.has(cap.name)) {
      findings.push({
        level: 'error',
        message: `${addonId}: unknown capability "${cap.name}"`,
      })
    }
  }
  return findings
}

/** Validate one addon package directory. */
export async function validatePackageDir(pkgDir: string): Promise<readonly ManifestFinding[]> {
  const raw = readPackageJson(pkgDir)
  const name = packageNameOf(raw)
  const parsed = camstackPackageSchema.safeParse(camstackOf(raw))
  if (!parsed.success) {
    return parsed.error.issues.map((issue) => ({
      level: 'error' as const,
      message: `${name}: ${issue.path.join('.') || 'camstack'}: ${issue.message}`,
    }))
  }
  if (!existsSync(join(pkgDir, 'vite.config.ts'))) {
    return [{ level: 'error', message: `${name}: vite.config.ts missing` }]
  }
  const sources = await entrySources(pkgDir)
  const findings: ManifestFinding[] = []
  if (sources === null) {
    findings.push({ level: 'error', message: `${name}: src/entries.ts must export ENTRY_SOURCES` })
  }
  for (const addon of parsed.data.addons) {
    findings.push(...checkAddonFiles(pkgDir, addon.id, addon, sources))
  }
  return findings
}

function packageDirs(): readonly string[] {
  const root = join(repoRoot, 'packages')
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(root, entry.name))
    .filter((dir) => existsSync(join(dir, 'package.json')))
}

async function main(): Promise<void> {
  const dirs = packageDirs()
  const findings: ManifestFinding[] = []
  for (const dir of dirs) {
    findings.push(...(await validatePackageDir(dir)))
  }
  for (const finding of findings) {
    process.stderr.write(`${finding.level}: ${finding.message}\n`)
  }
  const errors = findings.filter((finding) => finding.level === 'error')
  if (errors.length > 0) {
    process.stderr.write(`validate: ${errors.length} error(s)\n`)
    process.exitCode = 1
    return
  }
  process.stdout.write(`validate: ok (${dirs.length} packages)\n`)
}

const entryArg = process.argv[1]
const invokedDirectly = entryArg !== undefined && fileURLToPath(import.meta.url) === resolve(entryArg)
if (invokedDirectly) {
  main().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err)
    process.stderr.write(`validate: ${message}\n`)
    process.exitCode = 1
  })
}
