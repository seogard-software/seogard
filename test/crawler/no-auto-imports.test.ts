import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

/**
 * Le crawler tourne sous `tsx`, SANS les auto-imports de Nuxt. Un symbole de
 * `shared/utils` appele sans import explicite passe le typecheck (Nuxt le resout au
 * niveau des types) puis leve un ReferenceError A L'APPEL, en production — donc
 * charger le module ne suffit pas a le detecter.
 */
const ROOT = resolve(__dirname, '../..')

function filesIn(dir: string, keep: (name: string) => boolean): string[] {
  const out: string[] = []
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry)
      if (statSync(full).isDirectory()) walk(full)
      else if (keep(entry)) out.push(full)
    }
  }
  walk(join(ROOT, dir))
  return out
}

/** Noms exportes par shared/utils — ce sont eux que Nuxt auto-importe ailleurs. */
function sharedExports(): Set<string> {
  const names = new Set<string>()
  for (const file of filesIn('shared/utils', n => /\.ts$/.test(n) && !/\.test\.ts$/.test(n))) {
    const code = readFileSync(file, 'utf8')
    for (const m of code.matchAll(/export\s+(?:async\s+)?function\s+(\w+)/g)) names.add(m[1]!)
    for (const m of code.matchAll(/export\s+const\s+(\w+)/g)) names.add(m[1]!)
  }
  return names
}

describe('le crawler n utilise aucun auto-import', () => {
  const exported = sharedExports()

  it('trouve les exports de shared/utils', () => {
    expect(exported.size).toBeGreaterThan(20)
  })

  it('tout symbole de shared/utils appele dans crawler/ est importe explicitement', () => {
    const offenders: string[] = []

    for (const file of filesIn('crawler', n => /\.ts$/.test(n) && !/\.test\.ts$/.test(n))) {
      const code = readFileSync(file, 'utf8')
      // Ce que le fichier importe, quelle qu'en soit la source.
      const imported = new Set<string>()
      for (const block of code.matchAll(/import\s*\{([^}]+)\}\s*from/g)) {
        for (const raw of block[1]!.split(',')) {
          const name = raw.replace(/^\s*type\s+/, '').split(/\s+as\s+/)[0]!.trim()
          if (name) imported.add(name)
        }
      }
      // Ce qu'il definit lui-meme : un homonyme local n'est pas une faute.
      const local = new Set<string>()
      for (const m of code.matchAll(/(?:function|const|let|class)\s+(\w+)/g)) local.add(m[1]!)

      for (const call of code.matchAll(/\b(\w+)\s*\(/g)) {
        const name = call[1]!
        if (!exported.has(name) || imported.has(name) || local.has(name)) continue
        offenders.push(`${file.slice(ROOT.length + 1)} appelle ${name}() sans l importer`)
      }
    }

    expect(
      [...new Set(offenders)],
      'Le crawler tourne sous tsx sans auto-imports : ces appels leveront un ReferenceError en production.',
    ).toEqual([])
  })
})
