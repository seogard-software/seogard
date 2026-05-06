import { formatCloudPrice, getPriceExamples } from '../../shared/utils/pricing'
import { Article } from '~~/server/database/models'
import { isSelfHosted } from '../utils/deployment'

export default defineEventHandler(async (event) => {
  if (isSelfHosted()) {
    throw createError({ statusCode: 404 })
  }

  const price = formatCloudPrice()
  const appUrl = process.env.NUXT_PUBLIC_APP_URL || 'https://seogard.io'
  const examples = getPriceExamples()
  const examplesText = examples.map(ex => `- ${ex.label} pages : ${ex.price} EUR/mois`).join('\n')

  const content = `# Seogard — Documentation complète

> Monitoring SEO technique. Compare HTML brut et rendu JavaScript pour détecter les régressions invisibles. Self-hosted gratuit ou Cloud dès ${price} EUR/page crawlée/mois.

## Vue d'ensemble

Seogard est un outil de monitoring SEO technique édité par SAVEPNP (SAS, RCS Créteil 912 784 030, 25 rue Camille Blanc, 94400 Vitry-sur-Seine, France). Disponible en self-hosted gratuit (code source disponible sous BSL 1.1) ou en Cloud géré (B2B uniquement). Il effectue une double analyse continue SSR/CSR sur chaque page : il compare le HTML brut (ce que Google indexe) avec le rendu JavaScript (ce que l'utilisateur voit dans son navigateur), avant que Google ne re-rende les pages. Dès qu'une régression est détectée, l'alerte est instantanée.

Contrairement aux outils SEO classiques (Semrush, Ahrefs, Screaming Frog) et même aux outils de monitoring existants (Conductor/ContentKing, Lumar), Seogard est le seul à offrir cette comparaison SSR vs CSR native. Un SSR cassé est invisible dans un navigateur — mais Google voit une page vide. Seogard détecte exactement ce type de régression invisible.

## Le problème que Seogard résout

Les sites modernes sont complexes : SSR, CSR, frameworks JavaScript, microservices, CI/CD avec des déploiements quotidiens. Chaque mise en production peut casser silencieusement des éléments critiques pour le SEO :

- Les meta title et description disparaissent
- Le SSR (Server-Side Rendering) casse et Google ne voit plus le contenu
- Des pages passent en noindex par accident
- Les canonicals changent ou disparaissent
- Des pages retournent des erreurs 404 ou 500

Sans monitoring automatisé, ces régressions sont détectées en moyenne 3 semaines plus tard, quand le trafic organique a déjà chuté significativement.

**Exemple réel** : La Poste a perdu 200 000 clics (160 000 EUR de revenus) à cause d'un SSR cassé et de metas disparues après une mise en production. La régression a été détectée 3 semaines trop tard.

## Cible

Professionnels du web qui dépendent du SEO, quelle que soit la taille du site. Le Cloud est réservé aux professionnels (B2B). Avec le self-hosted gratuit, même un développeur peut l'utiliser. Avec le Cloud à ${price} EUR/page crawlée, le prix s'adapte naturellement au volume — vous ne payez que les pages réellement crawlées chaque mois.

- **Blogs et sites vitrine** : monitoring gratuit en self-hosted, ou quelques euros par mois en Cloud.
- **E-commerce** : catalogues produits, fiches produit, catégories. Une régression sur les metas impacte directement le chiffre d'affaires.
- **Médias et éditeurs** : articles, rubriques, pages auteur. Le SEO est la source principale de trafic.
- **SaaS** : sites marketing avec de nombreuses landing pages.
- **Grands comptes** : organisations où les équipes dev et SEO sont séparées, et où les déploiements fréquents rendent le monitoring manuel impossible.

## Fonctionnalités détaillées

### 60+ règles de détection SEO et GEO

Seogard embarque plus de 60 règles de détection (40 monitoring + 20 GEO) couvrant les régressions les plus courantes et les plus coûteuses :

**Meta et contenu :**
- Title manquant ou modifié
- Meta description manquante ou modifiée
- Canonical manquant ou modifié
- H1 manquant, dupliqué ou modifié
- Hreflang manquant ou modifié
- Open Graph et Twitter Cards manquants

**Indexation :**
- Noindex ajouté accidentellement
- Robots meta modifié
- X-Robots-Tag modifié

**Status codes :**
- Page passant en 404, 500, 503
- Soft 404 (page retournant 200 mais avec un contenu de page d'erreur)
- Redirections inattendues

**SSR vs CSR :**
- Contenu SSR significativement différent du contenu CSR
- SSR rendering échoué (contenu vide)
- Title SSR différent du title CSR
- Meta description SSR différente du CSR

**Performance et structure :**
- Temps de réponse dégradé
- Taille du HTML modifiée significativement
- Schema.org supprimé ou modifié

### Comparaison SSR vs CSR

Seogard effectue une double analyse de chaque page :
1. **Fetch HTTP brut (SSR)** : récupère le HTML tel que le serveur l'envoie, exactement comme Googlebot
2. **Rendu JavaScript (CSR)** : utilise un navigateur headless (Playwright/Chromium) pour exécuter le JavaScript et capturer le DOM final

La comparaison des deux permet de détecter quand le SSR casse silencieusement — un problème invisible dans un navigateur classique mais catastrophique pour le SEO, car Googlebot ne voit pas toujours le contenu rendu côté client.

### Crawl quotidien automatique

Après avoir ajouté votre site, Seogard découvre automatiquement vos pages via le sitemap et lance un crawl initial complet. Par la suite, un crawl quotidien vérifie chaque page. Une optimisation par hash SHA-256 permet de ne ré-analyser en profondeur (rendu CSR) que les pages dont le HTML a changé (~5-10% du total), ce qui réduit considérablement le temps de crawl.

### CI/CD webhook intégré

Seogard s'intègre dans votre pipeline CI/CD : un webhook POST déclenche un crawl à chaque déploiement, avec un endpoint GET pour poller le verdict (pass/fail). 3 niveaux de strictness : strict, standard, relaxed.

### Alertes instantanées

- **Email** : alerte instantanée dès qu'un problème critique est détecté
- **Slack** : intégration webhook avec messages détaillés et diff highlighting
- **Niveaux de sévérité** : critical (action immédiate), warning (à surveiller), info (changement non critique)
- **Diff highlighting** : chaque alerte montre exactement ce qui a changé (avant/après) avec les différences surlignées

### Dashboard

Le dashboard offre une vue d'ensemble en temps réel :
- Liste de tous vos sites avec leur santé SEO
- Historique des crawls avec progression en temps réel
- Alertes groupées par sévérité avec diff highlighting (visualisation des différences exactes)
- Liste des pages crawlées avec leur dernier status

## Architecture technique

Seogard est construit avec :
- **Nuxt 4** (Vue 3) pour le frontend et l'API
- **MongoDB** pour la base de données
- **Playwright** (Chromium headless) pour le rendu CSR
- **Redis** pour la queue de crawl

Les workers de crawl tournent sur des serveurs dédiés avec 16 vCPU et 32 GB de RAM, capables de traiter 300 000 pages en une nuit pour le crawl initial, puis 30 000 pages en environ 1 heure pour les crawls quotidiens.

Le code source complet est disponible sur GitHub pour la version self-hosted.

## Tarification

3 offres :

| Offre | Prix | Détails |
|-------|------|---------|
| Self-hosted | Gratuit pour toujours | Code source complet, votre infrastructure, vos données, communauté GitHub, mises à jour gratuites |
| Cloud | ${price} EUR par page crawlée par mois | Infrastructure gérée, zéro maintenance, alertes email/webhooks, support prioritaire, CI/CD webhook intégré, sans engagement. Vous ne payez que les pages réellement crawlées — relancer un crawl sur les mêmes pages ne coûte rien de plus. Essai gratuit 14 jours sans carte bancaire. |
| On-premise | Sur devis | Déploiement dans votre infra, SLA garanti, account manager dédié, SSO/SAML, formation équipe |

**Exemples de prix Cloud :**
${examplesText}

## Use cases

1. **Recette pré-production** : lancez un crawl avant la mise en production pour vérifier 0 régression SEO
2. **Post-déploiement** : alerte immédiate si une MEP casse quelque chose
3. **Surveillance continue** : monitoring quotidien pour les grands comptes avec des déploiements fréquents
4. **Self-hosted** : hébergez Seogard sur votre propre infrastructure, gardez le contrôle total de vos données

## Concurrents et positionnement

| Outil | Prix | Positionnement |
|-------|------|---------------|
| Screaming Frog | 199 EUR/an | Audit ponctuel, pas de monitoring continu |
| SEORadar | 199-999 USD/mois | Monitoring changements, US-focused |
| Conductor (ex-ContentKing) | 139-1279 USD/mois | Monitoring continu, pas de SSR/CSR |
| Lumar (ex-DeepCrawl) | 1200-4000 USD/mois | Enterprise, audit technique |
| **Seogard** | **Gratuit (self-hosted) / ${price} EUR/page (Cloud)** | **Monitoring régression SEO technique, SSR/CSR, self-hosted ou Cloud** |

Seogard se différencie par :
- **Double analyse SSR/CSR native** — comparaison continue du HTML brut et du rendu JavaScript sur chaque page
- **Self-hosted gratuit** — code source disponible sous licence BSL 1.1 (devient Apache 2.0 en 2029)
- Focus exclusif sur les régressions (pas un outil généraliste)
- Alertes instantanées avec diff highlighting (avant/après surligné)
- 60+ règles de détection spécifiques aux régressions SEO et GEO
- CI/CD webhook intégré (3 niveaux : strict / standard / relaxed)
- Tarification à l'usage transparente : vous ne payez que les pages crawlées (Cloud) ou gratuite (self-hosted)

## Blog SEO Technique

Seogard publie régulièrement des articles de référence sur le SEO technique. Sujets couverts : rendering SSR/CSR, meta tags, crawl budget, Core Web Vitals, migrations de sites, structured data, JavaScript SEO, monitoring continu. Les articles sont écrits par des experts pour un public de Lead SEO, CTO et développeurs senior.

- Blog : ${appUrl}/blog

## Liens

- Site : ${appUrl}
- Blog : ${appUrl}/blog
- GitHub : https://github.com/seogard-software/seogard
- Version courte : ${appUrl}/llms.txt

## Informations légales

- **Éditeur** : SAVEPNP, SAS au capital de 1 000 EUR
- **RCS** : Créteil 912 784 030 — SIRET 912 784 030 00021
- **TVA** : FR04912784030
- **Siège** : 25 rue Camille Blanc, 94400 Vitry-sur-Seine, France
- **Dirigeant** : Aadil TTALBI
- **Service B2B uniquement** : réservé aux professionnels
- **CGU** : ${appUrl}/legal/cgu
- **CGV** : ${appUrl}/legal/cgv
- **Confidentialité** : ${appUrl}/legal/privacy
- **Contact** : legal@${(() => { try { return new URL(appUrl).hostname } catch { return 'seogard.io' } })()}
`

  let articlesSection = ''
  try {
    const articles = await Article.find()
      .select('title description slug date category')
      .sort({ date: -1 })
      .limit(10)
      .lean()

    const total = await Article.countDocuments()

    if (articles.length > 0) {
      const articleEntries = articles.map((a) => {
        return `- ${a.title} (${a.category}) — ${appUrl}/blog/${a.slug}`
      }).join('\n')

      articlesSection = `\n\n## Derniers articles du blog (${articles.length} sur ${total})\n\n${articleEntries}\n\nTous les articles : ${appUrl}/blog\n`
    }
  }
  catch {
    // Silently skip articles section if DB query fails
  }

  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return content + articlesSection
})
