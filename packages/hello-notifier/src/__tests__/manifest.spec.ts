import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { addonDeclarationSchema } from '../../../../scripts/manifest-schema.js'
import { validatePackageDir } from '../../../../scripts/validate-manifests.js'

const pkgDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

describe('hello-notifier manifest', () => {
  it('matches the platform manifest keys and known capabilities', async () => {
    const findings = await validatePackageDir(pkgDir)
    const errors = findings.filter((finding) => finding.level === 'error')
    expect(errors).toEqual([])
  })

  it('rejects a key the declaration does not list', () => {
    const parsed = addonDeclarationSchema.safeParse({ id: 'x', widgets: [] })
    expect(parsed.success).toBe(false)
  })
})
