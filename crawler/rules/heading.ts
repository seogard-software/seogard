import type { PageMeta } from '../fetcher'
import { registerRule } from './engine'
import { truncate } from './helpers'

// --- Helpers to derive old fields from headings[] ---

function getH1(meta: PageMeta | null): string | null {
  return meta?.headings?.find(h => h.level === 1)?.text ?? null
}

function getH1Count(meta: PageMeta | null): number {
  return meta?.headings?.filter(h => h.level === 1).length ?? 0
}

function getHeadingLevels(meta: PageMeta | null): number[] {
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
    if (oldH1 !== newH1) {
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
        severity: 'warning',
        message: `Heading hierarchy broken (H${skip.from} → H${skip.to}, skipped H${skip.from + 1})`,
        previousValue: oldLevels.join(','),
        currentValue: levels.join(','),
      }]
    }
    return []
  },
})

registerRule({
  id: 'title_duplicate_of_h1',
  run(ctx) {
    if (!ctx.oldMeta) return []
    const newH1 = getH1(ctx.newMeta)
    if (!ctx.newMeta.title || !newH1) return []
    const titleNorm = ctx.newMeta.title.toLowerCase().trim()
    const h1Norm = newH1.toLowerCase().trim()
    if (titleNorm !== h1Norm) return []
    // Only alert if this is new (old title wasn't same as old h1)
    const oldH1 = getH1(ctx.oldMeta)
    if (ctx.oldMeta.title && oldH1) {
      const oldTitleNorm = ctx.oldMeta.title.toLowerCase().trim()
      const oldH1Norm = oldH1.toLowerCase().trim()
      if (oldTitleNorm === oldH1Norm) return [] // was already duplicate
    }
    return [{
      type: 'title_duplicate_of_h1',
      severity: 'info',
      message: 'Title is identical to H1 — missed ranking opportunity',
      previousValue: ctx.oldMeta.title,
      currentValue: ctx.newMeta.title,
    }]
  },
})

function hasHierarchySkip(levels: number[]): boolean {
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
