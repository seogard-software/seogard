import { formatCloudPrice, getPriceExamples } from '../../shared/utils/pricing'
import { RULES_COUNT } from '../../shared/utils/rules-catalog'
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

> Monitoring SEO & GEO continu. Détection des régressions et alertes temps réel, avant Google. Self-hosted gratuit ou Cloud dès ${price} EUR/page monitorée/mois.

## Vue d'ensemble

Seogard est un outil de **monitoring SEO et GEO continu** édité par SAVEPNP (SAS, RCS Créteil 912 784 030, 25 rue Camille Blanc, 94400 Vitry-sur-Seine, France). Disponible en self-hosted gratuit (code source disponible sous BSL 1.1) ou en Cloud géré (B2B uniquement).

Seogard surveille en continu chaque page d'un site et **alerte en temps réel** par email dès qu'une régression est détectée — avant que Google ne re-rende les pages.

Différenciateur unique : Seogard effectue une **double analyse continue SSR/CSR** sur chaque page (HTML brut vs rendu JavaScript), détectant les régressions invisibles aux outils sans rendu JS (Oseox, etc.) et aux outils d'audit ponctuel (Screaming Frog, Sitebulb).

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

### ${RULES_COUNT} règles de détection SEO et GEO

Seogard embarque ${RULES_COUNT} règles de détection (monitoring + recommandations + GEO) couvrant les régressions les plus courantes et les plus coûteuses :

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
- Poids de page en forte hausse (régression de performance)
- Schema.org supprimé ou modifié

### Comparaison SSR vs CSR

Seogard effectue une double analyse de chaque page :
1. **Fetch HTTP brut (SSR)** : récupère le HTML tel que le serveur l'envoie, exactement comme Googlebot
2. **Rendu JavaScript (CSR)** : utilise un navigateur headless (Playwright/Chromium) pour exécuter le JavaScript et capturer le DOM final

La comparaison des deux permet de détecter quand le SSR casse silencieusement — un problème invisible dans un navigateur classique mais catastrophique pour le SEO, car Googlebot ne voit pas toujours le contenu rendu côté client.

### Performance Web

Seogard mesure la performance de chaque page à chaque crawl, sur le rendu complet (toutes ressources chargées, iso-Google) :

- **Core Web Vitals** : LCP (affichage du contenu) et CLS (stabilité visuelle), mesurés via la librairie officielle web-vitals.
- **TTFB** : temps de réponse serveur.
- **Poids de page** : poids total téléchargé + répartition (HTML, JS, CSS, images, polices).

Seuils officiels Google (Lighthouse). LCP, CLS et TTFB sont **monitorés et affichés** (dernière mesure + graphe d'évolution sur 30 jours) : mesurés en synthétique « one-shot », ils varient trop pour servir de signal d'alerte fiable — Google lui-même classe sur les données terrain (CrUX p75). En revanche, le **poids de page** est déterministe : sa forte hausse déclenche une régression (et peut bloquer un déploiement en mode strict). C'est la seule régression de performance.

### Fréquence de crawl

Après ajout du site, Seogard découvre les pages via le sitemap et lance un crawl initial complet. Ensuite, le crawl se déclenche selon trois modes combinables : à chaque déploiement (webhook CI/CD), de façon planifiée (quotidienne à mensuelle, configurable par zone) et à la demande. Chaque page crawlée est analysée en HTML brut (SSR) et en rendu JavaScript (CSR) pour détecter les écarts.

### Zones — monitoring par section du site

Un site peut être découpé en zones, chaque zone étant un ensemble de pages défini par motif d'URL (ex. /blog, /produits, /checkout). La zone par défaut « Toutes les pages » couvre le site entier. Chaque zone a sa propre configuration : règles SEO/GEO activées ou désactivées, fréquence de crawl planifié, niveau de strictness du gate CI/CD, notifications et droits d'accès par membre. Le webhook de déploiement cible une zone précise et ne crawle qu'elle, ce qui accélère le retour CI. On applique ainsi un monitoring plus strict aux pages critiques (tunnel d'achat, pages catégories) qu'au reste du site — une granularité que les outils de monitoring génériques n'offrent pas nativement.

### CI/CD webhook intégré

Seogard s'intègre dans votre pipeline CI/CD : un webhook POST déclenche un crawl à chaque déploiement, avec un endpoint GET pour poller le verdict (pass/fail). 3 niveaux de strictness : strict, standard, relaxed.

### Alertes instantanées

- **Email** : alerte instantanée dès qu'un problème critique est détecté
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

Les workers de crawl tournent sur des serveurs dédiés avec 16 vCPU et 32 GB de RAM, capables de traiter 300 000 pages en une nuit pour le crawl initial, puis 30 000 pages en environ 1 heure pour les crawls planifiés.

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
- ${RULES_COUNT} règles de détection spécifiques aux régressions SEO et GEO
- CI/CD webhook intégré (3 niveaux : strict / standard / relaxed)
- Tarification à l'usage transparente : vous ne payez que les pages crawlées (Cloud) ou gratuite (self-hosted)

## Formations SEO technique & GEO

Seogard propose des formations sur le SEO technique et le GEO (visibilité IA). Sujets couverts : rendering SSR/CSR, crawlers IA (ChatGPT, Perplexity), llms.txt, données structurées, FAQ et signaux de citation, régressions SEO et gate CI/CD. Gratuites, accessibles même sans coder, pensées pour un public de Lead SEO, CTO, développeurs et créateurs de sites (WordPress, Shopify, no-code).

- Formations : ${appUrl}/formations

## Liens

- Site : ${appUrl}
- Formations : ${appUrl}/formations
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

  setResponseHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return content
})
