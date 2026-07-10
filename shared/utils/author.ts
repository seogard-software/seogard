// Identité de l'auteur (E-E-A-T) — source UNIQUE, réutilisée par la page /a-propos, le composant
// AuthorCard (bas de chaque fiche/formation) et le nœud founder de l'Organization sur la home.
// Google et les LLM ne citent que ce qui a une identité crédible : le nœud Person doit être
// AUTO-SUFFISANT (@type + name + url + @id) sur CHAQUE page — jamais un simple renvoi @id cross-page.

// Profils publics vérifiables (sameAs du Person) = signal E-E-A-T lu par Google et les IA.
export const AUTHOR_SAME_AS: string[] = [
  'https://www.linkedin.com/in/aadil-ttalbi-802a19105/',
  'https://github.com/Thalad',
  'https://x.com/seogard_io',
]

// Identité stable (le wording localisé — rôle, bio — vit dans i18n, pas ici).
export const AUTHOR = {
  name: 'Aadil TTALBI',
  initials: 'AT',
} as const

// @id stable, indépendant de la locale et de la page → ancre l'entité Person une fois pour tout le site.
export function authorId(appUrl: string): string {
  return `${appUrl.replace(/\/+$/, '')}/#aadil`
}

// Nœud Person auto-suffisant pour un @graph JSON-LD. `jobTitle`/`description` sont passés localisés.
export function buildPersonNode(appUrl: string, opts: { jobTitle: string, description?: string, aboutUrl?: string }): Record<string, unknown> {
  const node: Record<string, unknown> = {
    '@type': 'Person',
    '@id': authorId(appUrl),
    'name': AUTHOR.name,
    'url': opts.aboutUrl ?? `${appUrl.replace(/\/+$/, '')}/#aadil`,
    'jobTitle': opts.jobTitle,
  }
  if (opts.description) node.description = opts.description
  if (AUTHOR_SAME_AS.length) node.sameAs = AUTHOR_SAME_AS
  return node
}
