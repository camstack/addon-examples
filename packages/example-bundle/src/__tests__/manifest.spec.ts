import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { validatePackageDir } from '../../../../scripts/validate-manifests.js'

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

interface ExecutionBlock {
  readonly placement?: string
  readonly group?: string
}

function executionOf(id: string): ExecutionBlock {
  const raw: unknown = JSON.parse(readFileSync(join(pkgDir, 'package.json'), 'utf8'))
  if (typeof raw !== 'object' || raw === null) throw new Error('package.json')
  const camstack = Reflect.get(raw, 'camstack')
  if (typeof camstack !== 'object' || camstack === null) throw new Error('camstack')
  const addons = Reflect.get(camstack, 'addons')
  if (!Array.isArray(addons)) throw new Error('addons')
  const addon = addons.find((item) => {
    return typeof item === 'object' && item !== null && Reflect.get(item, 'id') === id
  })
  if (typeof addon !== 'object' || addon === null) throw new Error(id)
  const execution = Reflect.get(addon, 'execution')
  if (typeof execution !== 'object' || execution === null) return {}
  const placement = Reflect.get(execution, 'placement')
  const group = Reflect.get(execution, 'group')
  return {
    ...(typeof placement === 'string' ? { placement } : {}),
    ...(typeof group === 'string' ? { group } : {}),
  }
}

describe('example-bundle manifest', () => {
  it('matches the platform manifest keys and known capabilities', async () => {
    const findings = await validatePackageDir(pkgDir)
    const errors = findings.filter((finding) => finding.level === 'error')
    expect(errors).toEqual([])
  })

  it('keeps devices on their own runner and co-locates the observers', () => {
    expect(executionOf('example-devices')).toEqual({ placement: 'any-node' })
    expect(executionOf('example-listener').group).toBe('example-observers')
    expect(executionOf('example-exporter').group).toBe('example-observers')
  })
})
