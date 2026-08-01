import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve, relative, dirname } from 'node:path'

/**
 * L'image du worker doit contenir tout ce que son code importe.
 *
 * La liste des `COPY` est maintenue à la main : un import ajouté hors du périmètre
 * copié ne casse rien avant le déploiement, puis fait planter la flotte au démarrage.
 */

const ROOT = resolve(__dirname, '../..')
const DOCKERFILE = join(ROOT, 'crawler/Dockerfile')

/** Répertoires de premier niveau copiés dans l'image, lus depuis le Dockerfile. */
function copiedDirs(): Set<string> {
  const dockerfile = readFileSync(DOCKERFILE, 'utf8')
  const dirs = new Set<string>()
  for (const line of dockerfile.split('\n')) {
    const match = /^COPY\s+([^\s]+)\s+/.exec(line.trim())
    if (!match || match[1] === '--from=build') continue
    const source = match[1]!
    // `package.json yarn.lock ./` → fichiers isolés, pas un répertoire.
    if (!source.endsWith('/')) continue
    dirs.add(source.replace(/\/$/, ''))
  }
  return dirs
}

function sourceFiles(dir: string): string[] {
  const out: string[] = []
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry)
      if (statSync(full).isDirectory()) {
        if (entry !== 'node_modules') walk(full)
      }
      else if (/\.ts$/.test(entry) && !/\.test\.ts$/.test(entry)) {
        out.push(full)
      }
    }
  }
  walk(join(ROOT, dir))
  return out
}

/** Spécificateurs relatifs d'un fichier : `from '...'`, `import('...')`. */
function relativeImports(file: string): string[] {
  const code = readFileSync(file, 'utf8')
  const specifiers: string[] = []
  const patterns = [/from\s+['"](\.[^'"]+)['"]/g, /import\(\s*['"](\.[^'"]+)['"]\s*\)/g]
  for (const pattern of patterns) {
    for (const match of code.matchAll(pattern)) specifiers.push(match[1]!)
  }
  return specifiers
}

describe('image du worker — tout ce qui est importé doit être copié', () => {
  const copied = copiedDirs()

  it('le Dockerfile copie bien des répertoires (le parsing fonctionne)', () => {
    expect(copied.size).toBeGreaterThan(0)
  })

  it('aucun import ne sort du périmètre copié dans l image', () => {
    const escapes: string[] = []

    for (const dir of copied) {
      for (const file of sourceFiles(dir)) {
        for (const specifier of relativeImports(file)) {
          // Chemin du module, relatif à la racine du dépôt.
          const target = relative(ROOT, resolve(dirname(file), specifier))
          const topLevel = target.split('/')[0]!

          // Remonter au-dessus de la racine n'a pas de sens : ce serait déjà cassé
          // hors Docker, donc un autre test le verrait.
          if (topLevel === '..') continue

          // `server/database` et `server/utils` sont copiés séparément : on compare
          // sur le préfixe le plus long, pas sur le seul premier segment.
          const isCopied = [...copied].some(c => target === c || target.startsWith(`${c}/`))
          if (!isCopied) {
            escapes.push(`${relative(ROOT, file)} importe ${specifier} → ${target}`)
          }
        }
      }
    }

    expect(
      escapes,
      `Ces imports sortent des COPY de crawler/Dockerfile : le worker crashera au `
      + `demarrage (ERR_MODULE_NOT_FOUND) des le prochain deploiement.\n`
      + `Correctif : ajouter le COPY manquant dans crawler/Dockerfile.\n\n`
      + escapes.join('\n'),
    ).toEqual([])
  })
})
