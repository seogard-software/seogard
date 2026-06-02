import type { PageMeta } from '../fetcher'
import { registerRule } from './engine'
import { normalizeForCompare, truncate } from './helpers'

// --- Helpers to derive old fields from headings[] ---

// Retourne le texte du premier H1 non vide (ignore les <h1></h1>)
// Exportés pour réutilisation par les prédicats de récupération (auto-resolve).
export function getH1(meta: PageMeta | null): string | null {
  const h1 = meta?.headings?.find(h => h.level === 1 && h.text.length > 0)
  return h1?.text ?? null
}

// Compte uniquement les H1 avec du texte (les H1 vides ne comptent pas comme H1 utiles)
export function getH1Count(meta: PageMeta | null): number {
  return meta?.headings?.filter(h => h.level === 1 && h.text.length > 0).length ?? 0
}

export function getHeadingLevels(meta: PageMeta | null): number[] {
  return meta?.headings?.map(h => h.level) ?? []
}

registerRule({
  id: 'h1_missing',
  run(ctx) {
    if (!ctx.oldMeta) return []
    if (!ctx.oldMeta.headings) return [] // old crawl didn't track this field
    const oldCount = getH1Count(ctx.oldMeta)
    const newCount = getH1Count(ctx.newMeta)
    if (oldCount > 0 && newCount === 0) {
      return [{
        type: 'h1_missing',
        severity: 'critical',
        message: `H1 tag removed (was: "${truncate(getH1(ctx.oldMeta) ?? '')}")`,
        previousValue: getH1(ctx.oldMeta),
        currentValue: null,
      }]
    }
    return []
  },
})

registerRule({
  id: 'h1_multiple',
  run(ctx) {
    if (!ctx.oldMeta) return []
    if (!ctx.oldMeta.headings) return []
    const oldCount = getH1Count(ctx.oldMeta)
    const newCount = getH1Count(ctx.newMeta)
    if (newCount > 1 && oldCount <= 1) {
      return [{
        type: 'h1_multiple',
        severity: 'warning',
        message: `Multiple H1 tags detected (${newCount})`,
        previousValue: oldCount > 0 ? `${oldCount} H1` : null,
        currentValue: `${newCount} H1`,
      }]
    }
    return []
  },
})

registerRule({
  id: 'h1_changed',
  run(ctx) {
    const oldH1 = getH1(ctx.oldMeta)
    const newH1 = getH1(ctx.newMeta)
    if (!oldH1 || !newH1) return []
    // Compare normalisé (entités + espaces) → ignore le cosmétique.
    if (normalizeForCompare(oldH1) !== normalizeForCompare(newH1)) {
      return [{
        type: 'h1_changed',
        severity: 'info',
        message: 'H1 text changed',
        previousValue: oldH1,
        currentValue: newH1,
      }]
    }
    return []
  },
})

registerRule({
  id: 'heading_hierarchy_broken',
  run(ctx) {
    if (!ctx.oldMeta) return []
    const levels = getHeadingLevels(ctx.newMeta)
    if (levels.length === 0) return []
    const oldLevels = getHeadingLevels(ctx.oldMeta)
    if (oldLevels.length === 0) return [] // old crawl didn't track this field
    if (hasHierarchySkip(oldLevels)) return [] // was already broken

    if (hasHierarchySkip(levels)) {
      const skip = findFirstSkip(levels)
      return [{
        type: 'heading_hierarchy_broken',
        severity: 'info',
        message: `Heading hierarchy broken (H${skip.from} → H${skip.to}, skipped H${skip.from + 1})`,
        previousValue: oldLevels.join(','),
        currentValue: levels.join(','),
      }]
    }
    return []
  },
})

export function hasHierarchySkip(levels: number[]): boolean {
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) return true
  }
  return false
}

function findFirstSkip(levels: number[]): { from: number; to: number } {
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] > levels[i - 1] + 1) return { from: levels[i - 1], to: levels[i] }
  }
  return { from: 1, to: 3 }
}
