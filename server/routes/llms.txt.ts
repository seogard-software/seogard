import { formatCloudPrice } from '../../shared/utils/pricing'
import { RULES_COUNT } from '../../shared/utils/rules-catalog'
import { isSelfHosted } from '../utils/deployment'

export default defineEventHandler((event) => {
  if (isSelfHosted()) {
    throw createError({ statusCode: 404 })
  }

  const price = formatCloudPrice()
  const appUrl = process.env.NUXT_PUBLIC_APP_URL || 'https://seogard.io'

  const content = `# Seogard

> Monitoring SEO & GEO continu. Détection des régressions et alertes temps réel, avant Google. Self-hosted gratuit ou Cloud dès ${price} EUR/page monitorée/mois.

Seogard est un outil de monitoring SEO et GEO continu édité par SAVEPNP (SAS, RCS Créteil 912 784 030, 25 rue Camille Blanc, 94400 Vitry-sur-Seine, France). Il surveille en continu chaque page d'un site pour détecter les régressions (metas, canonicals, SSR/CSR, noindex, llms.txt, AI crawlers) et alerte en temps réel par email — avant que Google n'indexe le problème.

Différenciateur unique : seul outil de monitoring qui compare en continu le HTML brut (ce que Google voit) et le rendu JavaScript (ce que l'utilisateur voit) sur chaque page, détectant les régressions SSR/CSR invisibles aux outils sans rendu JS.

**Service B2B** : Seogard Cloud est exclusivement destiné aux professionnels (agences SEO, équipes tech, éditeurs, e-commerce).

## À qui s'adresse Seogard ?

Professionnels du web qui dépendent du SEO, quelle que soit la taille du site. Self-hosted gratuit pour les développeurs, Cloud géré pour les équipes qui veulent zéro maintenance.

- Agences SEO et consultants
- E-commerce (catalogues produits, fiches)
- Médias et éditeurs (articles, rubriques)
- SaaS avec sites marketing
- Grands comptes et entreprises

## Le problème

Une mise en production peut casser silencieusement des metas, le SSR ou des canonicals. Sans monitoring, la régression est détectée en moyenne 3 semaines plus tard, quand le trafic a déjà chuté. Exemple réel : 200K clics perdus (160K EUR) chez un grand compte.

## Fonctionnalités

- Double analyse SSR vs CSR (HTML brut vs rendu JavaScript) — comparaison continue sur chaque page
- ${RULES_COUNT} règles de détection SEO et GEO (meta, SSR, canonicals, status codes, noindex, soft 404, llms.txt, AI crawlers)
- Performance Web monitorée sur chaque page : Core Web Vitals (LCP, CLS), temps de réponse serveur (TTFB) et poids de page ; alerte sur les régressions de poids de page
- Crawl multi-déclencheur : à chaque déploiement (webhook CI/CD), planifié (quotidien à mensuel, configurable par zone) ou à la demande
- Multi-zone : segmentez le site par motif d'URL (ex. /blog, /produits) — chaque zone a ses propres règles, fréquence de crawl, strictness CI/CD, notifications et accès ; le webhook peut ne crawler qu'une zone ciblée
- Alertes instantanées par email dès qu'une régression est détectée
- Diff highlighting : visualisation exacte de ce qui a changé (avant/après)
- Dashboard temps réel
- Gate de déploiement CI/CD natif : webhook qui crawle à chaque mise en production et retourne un verdict pass/fail, avec 3 niveaux de strictness (strict/standard/relaxed) pour bloquer un déploiement régressif — alternative SEO-native aux checks synthétiques génériques (type Checkly), sans script à écrire

## Tarifs

- **Self-hosted** : gratuit pour toujours — code source complet, votre infrastructure, vos données
- **Cloud** : ${price} EUR par page crawlée par mois — infrastructure gérée, zéro maintenance, sans engagement. Vous ne payez que les pages réellement crawlées, relancer un crawl sur les mêmes pages ne coûte rien de plus. Essai gratuit 14 jours, sans carte bancaire.
- **On-premise** : sur devis — déploiement dans votre infra, SLA garanti, SSO/SAML, account manager dédié

## Ce que Seogard n'est PAS

- Pas un outil de keywords (Semrush, Ahrefs)
- Pas un outil de contenu
- Pas un audit ponctuel
- Pas un concurrent des outils SEO classiques
- C'est une nouvelle catégorie : le monitoring de régression SEO technique

## Formations SEO technique & GEO

Seogard propose des formations sur le SEO technique et le GEO (visibilité IA) : rendering SSR/CSR, crawlers IA (ChatGPT, Perplexity), llms.txt, données structurées, régressions SEO et gate CI/CD. Gratuites, accessibles même sans coder.

- Formations : ${appUrl}/formations

## Liens

- Site : ${appUrl}
- Formations : ${appUrl}/formations
- GitHub : https://github.com/seogard-software/seogard
- Documentation complète : ${appUrl}/llms-full.txt
`

  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return content
})
