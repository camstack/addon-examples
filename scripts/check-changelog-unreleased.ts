/**
 * Refuse a release whose `## [Unreleased]` section has no entry.
 *
 * Every package keeps its operator-visible changes under `## [Unreleased]`
 * until a release moves them under the new version. Publishing with that
 * section empty ships a version nobody can read about.
 *
 * Usage: tsx scripts/check-changelog-unreleased.ts
 */
import * as fs from 'node:fs'
import * as path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const PACKAGES = path.join(ROOT, 'packages')

/** The lines of `## [Unreleased]` that are entries (a `- ` bullet). */
export function unreleasedEntries(changelog: string): readonly string[] {
  const lines = changelog.split('\n')
  const start = lines.findIndex((line) => /^##\s+\[Unreleased\]/i.test(line))
  if (start === -1) return []
  const entries: string[] = []
  for (const line of lines.slice(start + 1)) {
    if (/^##\s/.test(line)) break
    if (/^\s*-\s+\S/.test(line)) entries.push(line.trim())
  }
  return entries
}

function main(): void {
  const problems: string[] = []
  for (const dir of fs.readdirSync(PACKAGES)) {
    const file = path.join(PACKAGES, dir, 'CHANGELOG.md')
    if (!fs.existsSync(file)) {
      problems.push(`packages/${dir}: CHANGELOG.md is missing`)
    } else if (unreleasedEntries(fs.readFileSync(file, 'utf8')).length === 0) {
      problems.push(`packages/${dir}: "## [Unreleased]" has no entry`)
    }
  }
  if (problems.length > 0) {
    console.error(`check-changelog-unreleased: ${problems.length} problem(s)`)
    for (const problem of problems) console.error(`  - ${problem}`)
    process.exit(1)
  }
  console.log('check-changelog-unreleased: ok')
}

if (process.argv[1] === import.meta.filename) main()
