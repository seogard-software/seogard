// Locales supportées — SOURCE UNIQUE (module @nuxtjs/i18n, User.locale, helper serveur t(),
// sitemap, hreflang). L'EN est déclaré ici dès la fondation mais n'est PUBLIÉ (routes +
// hreflang + sitemap) qu'à la bascule d'un bloc — cf. plans/1-feat-i18n-fondation.md.
export const LOCALES = ['fr', 'en'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'fr'

// Locales dont les routes publiques sont générées et publiées (hreflang, sitemap).
// Étape 14 : ajouter 'en' ici = la bascule.
export const PUBLISHED_LOCALES: Locale[] = ['fr', 'en']

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

/** Coerce une valeur inconnue (User.locale, Lead.locale, champ absent…) en Locale, fallback FR. */
export function toLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE
}

/**
 * Locale d'un NOUVEAU compte, dérivée de l'en-tête HTTP Accept-Language du navigateur.
 * SOURCE UNIQUE des deux chemins d'inscription (email + OAuth).
 *
 * Règle : on détecte EXPLICITEMENT le français ; tout le reste (anglais ET langues non gérées :
 * allemand, arabe, farsi…) part en 'en'. Défaut EN volontaire car l'audience non francophone est
 * majoritairement internationale — un dashboard anglais la sert mieux qu'un dashboard français.
 *
 * ⚠️ C'est le défaut du COMPTE au signup — À NE PAS confondre avec DEFAULT_LOCALE ('fr'), qui reste
 * le défaut CANONIQUE du site (URLs /fr, slugs, sitemap, hreflang, localizedPath). On n'y touche pas.
 */
export function localeFromAcceptLanguage(acceptLanguage: string | null | undefined): Locale {
  return (acceptLanguage ?? '').trim().toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

// Chemins publics dont le slug est TRADUIT par locale (slug FR = défaut du fichier ; slug EN
// traduit pour le CTR/SEO anglophone). SOURCE UNIQUE : le sitemap et llms.txt l'utilisent ;
// les pages concernées déclarent le MÊME mapping via defineI18nRoute({ paths }) (macro = ne peut
// pas importer cette constante), verrouillé par le test localized-routes.test.ts.
// Toute page absente d'ici garde son slug identique dans les deux locales (scanner, docs, bot…).
export const LOCALIZED_PATHS: Record<string, { fr: string, en: string }> = {
  'outils-monitoring': { fr: '/outils/monitoring', en: '/tools/monitoring' },
  'outils-audit': { fr: '/outils/audit', en: '/tools/audit' },
  'tarifs': { fr: '/tarifs', en: '/pricing' },
  'a-propos': { fr: '/a-propos', en: '/about' },
}

/** Chemin (sans préfixe de locale) d'une page publique dans la locale donnée. */
export function localizedPath(frPath: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return frPath
  const entry = Object.values(LOCALIZED_PATHS).find(p => p.fr === frPath)
  return entry ? entry[locale] : frPath
}
