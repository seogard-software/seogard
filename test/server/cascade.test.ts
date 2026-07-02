import { describe, it, expect } from 'vitest'
import { Schema as MongooseSchema, Types } from 'mongoose'
import type { Model, Schema } from 'mongoose'
import * as models from '../../server/database/models'
import { SITE_CASCADE_DELETE, SITE_CASCADE_EXEMPT, PAGE_CASCADE_DELETE, PAGE_CASCADE_EXEMPT } from '../../server/database/cascade'

// TRIPWIRE anti-oubli de cascade : introspecte TOUS les schémas Mongoose. Tout modèle qui
// référence un Site (champ `siteId` ou ref 'Site') ou une page (`pageId`/`pageUrl` ou ref
// 'MonitoredPage') DOIT être déclaré dans les registres de `server/database/cascade.ts` —
// soit supprimé en cascade, soit exempté avec une raison. Si ce test échoue : tu viens
// d'ajouter une collection liée → ajoute son deleteMany dans les cascades (site delete,
// org delete, purge de fin de crawl) PUIS déclare-la dans le registre.

interface LinkedRefs { site: string[], page: string[] }
interface Links { site: boolean, page: boolean }

// Introspection RÉCURSIVE : eachPath ne descend pas dans les sub-schemas (tableaux de
// sous-documents) → on récurse via type.schema. Et la ref d'un tableau de refs directes vit
// dans la définition brute (`options.type[0].ref`), pas sur le path → on collecte toute
// valeur `ref` string dans l'arbre d'options (parcours borné + garde anti-cycle : les options
// mongoose contiennent des références circulaires, JSON.stringify exploserait). Limite
// assumée : ref passée comme Model plutôt que chaîne — jamais utilisé dans ce repo.
function collectRefs(value: unknown, refs: Set<string>, seen: Set<object>, depth = 0): void {
  if (!value || typeof value !== 'object' || depth > 6 || seen.has(value as object)) return
  seen.add(value as object)
  if (Array.isArray(value)) {
    for (const item of value) collectRefs(item, refs, seen, depth + 1)
    return
  }
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'ref' && typeof val === 'string') refs.add(val)
    else collectRefs(val, refs, seen, depth + 1)
  }
}

function walkSchema(schema: Schema, links: Links): void {
  schema.eachPath((path, type) => {
    const t = type as { options?: object, schema?: Schema }
    const refs = new Set<string>()
    collectRefs(t.options, refs, new Set())
    const leaf = path.split('.').pop()
    if (leaf === 'siteId' || refs.has('Site')) links.site = true
    if (leaf === 'pageId' || leaf === 'pageUrl' || refs.has('MonitoredPage')) links.page = true
    if (t.schema) walkSchema(t.schema, links)
  })
}

function collectLinked(): LinkedRefs {
  const site: string[] = []
  const page: string[] = []
  for (const [name, value] of Object.entries(models)) {
    const model = value as Model<unknown>
    if (!model?.schema) continue
    const links: Links = { site: false, page: false }
    walkSchema(model.schema as Schema, links)
    if (links.site && name !== 'Site') site.push(name)
    if (links.page && name !== 'MonitoredPage') page.push(name)
  }
  return { site: site.sort(), page: page.sort() }
}

describe('cascade de suppression — tripwire (aucune collection liée oubliée)', () => {
  const linked = collectLinked()

  it('tout modèle lié à un SITE est déclaré (cascade ou exemption motivée)', () => {
    const declared = new Set<string>([...SITE_CASCADE_DELETE, ...Object.keys(SITE_CASCADE_EXEMPT)])
    for (const name of linked.site) {
      expect(declared.has(name), `${name} référence un Site mais n'est ni dans SITE_CASCADE_DELETE ni exempté — ajoute son deleteMany dans api/sites/[id]/index.delete.ts ET api/organizations/[orgId]/index.delete.ts, puis déclare-le dans server/database/cascade.ts`).toBe(true)
    }
  })

  it('tout modèle lié à une PAGE est déclaré (cascade ou exemption motivée)', () => {
    const declared = new Set<string>([...PAGE_CASCADE_DELETE, ...Object.keys(PAGE_CASCADE_EXEMPT)])
    for (const name of linked.page) {
      expect(declared.has(name), `${name} référence une page mais n'est ni dans PAGE_CASCADE_DELETE ni exempté — ajoute son deleteMany dans la purge de finalizeCrawl (crawler/worker.ts) ET les cascades site/org, puis déclare-le dans server/database/cascade.ts`).toBe(true)
    }
  })

  it('les registres ne contiennent aucun nom fantôme (typo ou modèle supprimé)', () => {
    const known = new Set(Object.keys(models))
    for (const name of [...SITE_CASCADE_DELETE, ...PAGE_CASCADE_DELETE, ...Object.keys(SITE_CASCADE_EXEMPT), ...Object.keys(PAGE_CASCADE_EXEMPT)]) {
      expect(known.has(name), `${name} est déclaré dans cascade.ts mais n'existe pas dans les modèles`).toBe(true)
    }
  })

  it('sanity : les liaisons actuellement connues sont bien détectées par l introspection', () => {
    expect(linked.site).toContain('Alert')
    expect(linked.site).toContain('CrawlReport')
    expect(linked.page).toContain('PageSnapshot')
    expect(linked.page).toContain('Alert')
  })

  it('la récursion voit les refs cachées : sous-document en tableau, tableau de refs, imbrication profonde', () => {
    const hidden = new MongooseSchema({
      // ref au fond d un TABLEAU de sous-documents (invisible pour un eachPath non récursif)
      entries: [{ pageId: { type: Types.ObjectId, ref: 'MonitoredPage' } }],
      // tableau de refs directes (la ref vit sur le caster)
      relatedSites: [{ type: Types.ObjectId, ref: 'Site' }],
      // imbrication à deux niveaux
      nested: { deep: [{ inner: { pageUrl: String } }] },
    })
    const links = { site: false, page: false }
    walkSchema(hidden, links)
    expect(links.page).toBe(true)
    expect(links.site).toBe(true)
  })
})
