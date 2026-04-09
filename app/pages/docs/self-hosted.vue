<template>
  <div class="docs-sh">
    <h1 class="docs-sh__title">Guide Self-Hosted</h1>
    <p class="docs-sh__subtitle">Tout ce qu'il faut savoir pour héberger Seogard sur votre serveur.</p>

    <!-- Getting Started -->
    <section id="getting-started" class="docs-sh__section">
      <h2 class="docs-sh__heading">Getting Started</h2>
      <p class="docs-sh__text">Prérequis : <strong>Docker</strong> et <strong>Docker Compose</strong> installés sur votre serveur.</p>
      <ol class="docs-sh__steps">
        <li>Cloner le repo
          <div class="docs-sh__code"><code>git clone https://github.com/seogard-software/seogard.git && cd seogard</code></div>
        </li>
        <li>Copier et configurer le fichier d'environnement
          <div class="docs-sh__code">
            <code>cp .env.example .env</code>
          </div>
          <p class="docs-sh__text">Éditez <code>.env</code> et changez <strong>obligatoirement</strong> :</p>
          <div class="docs-sh__table-wrap">
            <table class="docs-sh__table">
              <thead>
                <tr><th>Variable</th><th>Description</th></tr>
              </thead>
              <tbody>
                <tr><td><code>MONGO_PASSWORD</code></td><td>Mot de passe MongoDB — choisissez un mot de passe fort</td></tr>
                <tr><td><code>NUXT_JWT_SECRET</code></td><td>Clé de signature JWT — 64+ caractères aléatoires</td></tr>
                <tr><td><code>NUXT_PUBLIC_APP_URL</code></td><td>URL publique de votre instance (ex: <code>https://seo.monsite.com</code>)</td></tr>
              </tbody>
            </table>
          </div>
        </li>
        <li>Lancer
          <div class="docs-sh__code"><code>docker compose -f docker-compose.self-hosted.yml up -d</code></div>
        </li>
        <li>Ouvrir <code>http://localhost:3000</code> et créer votre compte administrateur</li>
      </ol>
      <p class="docs-sh__text">
        Le premier compte créé sera l'<strong>administrateur</strong> (owner). L'inscription se ferme ensuite automatiquement — les membres suivants sont ajoutés par invitation.
      </p>
      <p class="docs-sh__text">Un seul fichier <code>.env</code> pour tout (web + crawler). Les connexions MongoDB et Redis sont gérées automatiquement par Docker.</p>
    </section>

    <!-- Architecture -->
    <section id="architecture" class="docs-sh__section">
      <h2 class="docs-sh__heading">Architecture</h2>
      <div class="docs-sh__arch">
        <div class="docs-sh__arch-box">
          <span class="docs-sh__arch-label">Votre serveur</span>
          <div class="docs-sh__arch-grid">
            <div class="docs-sh__arch-item docs-sh__arch-item--web">
              <strong>Web</strong>
              <span>Dashboard + API</span>
              <code>port 3000</code>
            </div>
            <div class="docs-sh__arch-item docs-sh__arch-item--worker">
              <strong>Workers</strong>
              <span>Crawler Playwright</span>
              <code>x{{ workerReplicas }}</code>
            </div>
            <div class="docs-sh__arch-item docs-sh__arch-item--db">
              <strong>MongoDB</strong>
              <span>Base de données</span>
            </div>
            <div class="docs-sh__arch-item docs-sh__arch-item--redis">
              <strong>Redis</strong>
              <span>Queue de crawl</span>
            </div>
          </div>
        </div>
      </div>
      <p class="docs-sh__text">
        Le <strong>Web</strong> sert le dashboard et l'API. Les <strong>Workers</strong> crawlent les pages avec Playwright (navigateur headless).
        <strong>Redis</strong> distribue les pages aux workers. <strong>MongoDB</strong> stocke les données.
      </p>
    </section>

    <!-- Dimensionnement -->
    <section id="dimensionnement" class="docs-sh__section">
      <h2 class="docs-sh__heading">Dimensionnement</h2>
      <p class="docs-sh__text">Chaque worker crawler utilise <strong>~1 GB de RAM</strong>. MongoDB a besoin d'un cache RAM pour être performant. Le reste (~2 GB) est partagé entre Redis, le serveur web et l'OS.</p>
      <p class="docs-sh__text">Formule : <strong>Cache MongoDB = RAM serveur - (Workers × 1 GB) - 2 GB</strong></p>
      <div class="docs-sh__table-wrap">
        <table class="docs-sh__table">
          <thead>
            <tr>
              <th>RAM serveur</th>
              <th>Workers</th>
              <th>Cache MongoDB</th>
              <th>Pages monitorables</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>4 GB</td><td>1</td><td>1 GB</td><td>~5 000</td></tr>
            <tr><td>8 GB</td><td>3</td><td>3 GB</td><td>~15 000</td></tr>
            <tr><td>16 GB</td><td>8</td><td>6 GB</td><td>~50 000</td></tr>
            <tr><td>32 GB</td><td>15</td><td>15 GB</td><td>~100 000+</td></tr>
          </tbody>
        </table>
      </div>
      <p class="docs-sh__text">Le cache MongoDB est fixé à <strong>2 GB par défaut</strong> dans le docker-compose. Ajustez selon votre serveur en éditant <code>docker-compose.self-hosted.yml</code> → <code>--wiredTigerCacheSizeGB X</code>.</p>
      <div class="docs-sh__code">
        <code># Lancer avec 3 workers</code><br>
        <code>WORKER_REPLICAS=3 docker compose -f docker-compose.self-hosted.yml up -d</code>
      </div>
    </section>

    <!-- Workers -->
    <section id="workers" class="docs-sh__section">
      <h2 class="docs-sh__heading">Ajuster les workers</h2>
      <p class="docs-sh__text">Modifiez le nombre de workers selon les ressources de votre serveur :</p>
      <div class="docs-sh__code">
        <code>WORKER_REPLICAS=5 docker compose -f docker-compose.self-hosted.yml up -d</code>
      </div>
      <p class="docs-sh__text">Ou éditez directement <code>docker-compose.self-hosted.yml</code> → <code>replicas: 5</code></p>
    </section>

    <!-- Email -->
    <section id="email" class="docs-sh__section">
      <h2 class="docs-sh__heading">Notifications email</h2>
      <p class="docs-sh__text--muted">Optionnel — sans configuration email, Seogard fonctionne mais n'envoie pas d'alertes ni de reset de mot de passe.</p>
      <ol class="docs-sh__steps">
        <li>Créez un compte gratuit sur <a href="https://resend.com" target="_blank" rel="noopener">resend.com</a> (100 emails/jour)</li>
        <li>Vérifiez votre domaine dans le dashboard Resend</li>
        <li>Ajoutez dans votre <code>.env</code> :
          <div class="docs-sh__code">
            <code>RESEND_API_KEY=re_votre_cle_ici</code><br>
            <code>FROM_EMAIL=alerts@votre-domaine.com</code>
          </div>
        </li>
        <li>Redémarrez : <code>docker compose -f docker-compose.self-hosted.yml restart web worker</code></li>
      </ol>
    </section>

    <!-- OAuth -->
    <section id="oauth" class="docs-sh__section">
      <h2 class="docs-sh__heading">Connexion OAuth</h2>
      <p class="docs-sh__text--muted">Optionnel — sans OAuth, les utilisateurs se connectent par email + mot de passe.</p>
      <p class="docs-sh__text">Ajoutez les clés dans votre <code>.env</code> pour activer chaque provider :</p>

      <details class="docs-sh__detail">
        <summary>Google</summary>
        <ol class="docs-sh__steps">
          <li>Créez un OAuth Client sur <a href="https://console.cloud.google.com" target="_blank" rel="noopener">Google Cloud Console</a></li>
          <li>Redirect URI : <code>{{ appUrl }}/api/auth/oauth/google/callback</code></li>
          <li><code>GOOGLE_CLIENT_ID=...</code> et <code>GOOGLE_CLIENT_SECRET=...</code></li>
        </ol>
      </details>

      <details class="docs-sh__detail">
        <summary>Microsoft</summary>
        <ol class="docs-sh__steps">
          <li>Créez une app sur <a href="https://portal.azure.com" target="_blank" rel="noopener">Azure Portal</a> → App registrations</li>
          <li>Redirect URI : <code>{{ appUrl }}/api/auth/oauth/microsoft/callback</code></li>
          <li><code>MICROSOFT_CLIENT_ID=...</code> et <code>MICROSOFT_CLIENT_SECRET=...</code></li>
        </ol>
      </details>

      <details class="docs-sh__detail">
        <summary>GitHub</summary>
        <ol class="docs-sh__steps">
          <li>Créez une OAuth App sur <a href="https://github.com/settings/developers" target="_blank" rel="noopener">GitHub Developer Settings</a></li>
          <li>Callback URL : <code>{{ appUrl }}/api/auth/oauth/github/callback</code></li>
          <li><code>GITHUB_CLIENT_ID=...</code> et <code>GITHUB_CLIENT_SECRET=...</code></li>
        </ol>
      </details>
    </section>

    <!-- Whitelisting -->
    <section id="whitelisting" class="docs-sh__section">
      <h2 class="docs-sh__heading">Whitelisting du crawler</h2>
      <p class="docs-sh__text">Si vos sites sont protégés par un WAF (Cloudflare, Akamai, etc.), vous devez whitelister l'IP de votre serveur.</p>
      <NuxtLink to="/bot#self-hosted" class="docs-sh__link">
        Voir le guide de whitelisting
      </NuxtLink>
    </section>

    <!-- Mise à jour -->
    <section id="mise-a-jour" class="docs-sh__section">
      <h2 class="docs-sh__heading">Mise à jour</h2>
      <div class="docs-sh__code">
        <code>cd seogard</code><br>
        <code>git pull</code><br>
        <code>docker compose -f docker-compose.self-hosted.yml up --build -d</code>
      </div>
      <p class="docs-sh__text">Les données MongoDB sont persistées dans un volume Docker. Aucune perte de données lors d'une mise à jour.</p>
    </section>

    <!-- Licence -->
    <section id="licence" class="docs-sh__section">
      <h2 class="docs-sh__heading">Licence</h2>
      <p class="docs-sh__text">
        Seogard est distribué sous <strong>Business Source License 1.1 (BSL)</strong>.
        Vous pouvez l'utiliser gratuitement pour un usage interne (monitoring de vos propres sites).
        L'utilisation comme service commercial concurrent est interdite.
      </p>
      <p class="docs-sh__text">
        Chaque version passe automatiquement en <strong>Apache 2.0</strong> après 3 ans.
      </p>
      <a href="https://github.com/seogard-software/seogard/blob/main/LICENCE" target="_blank" rel="noopener" class="docs-sh__link">
        Lire la licence complète
      </a>
    </section>

    <!-- Sauvegarde -->
    <section id="sauvegarde" class="docs-sh__section">
      <h2 class="docs-sh__heading">Sauvegarde</h2>
      <div class="docs-sh__code">
        <code># Sauvegarder</code><br>
        <code>docker exec seogard-mongo-1 mongodump --archive > backup-$(date +%Y%m%d).archive</code><br><br>
        <code># Restaurer</code><br>
        <code>docker exec -i seogard-mongo-1 mongorestore --archive &lt; backup.archive</code>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'docs', auth: false })

useHead({ title: 'Guide Self-Hosted' })
useSeoMeta({ robots: 'noindex, nofollow' })

const config = useRuntimeConfig()
const appUrl = computed(() => config.public.appUrl || 'https://votre-domaine.com')
const workerReplicas = 2
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.docs-sh {
  &__title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    margin: 0 0 $spacing-1;
    letter-spacing: -0.03em;
  }

  &__subtitle {
    font-size: $font-size-sm;
    color: $color-gray-500;
    margin: 0 0 $spacing-8;
  }

  &__section {
    margin-bottom: $spacing-10;
  }

  &__heading {
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    margin: 0 0 $spacing-3;
    letter-spacing: -0.02em;
  }

  &__text {
    font-size: $font-size-sm;
    color: $color-gray-600;
    line-height: $line-height-normal;
    margin: 0 0 $spacing-3;

    code {
      background: $color-gray-100;
      padding: 2px 6px;
      border-radius: $radius-sm;
      font-size: $font-size-xs;
    }
  }

  &__text--muted {
    font-size: $font-size-sm;
    color: $color-gray-400;
    font-style: italic;
    margin: 0 0 $spacing-3;
  }

  // Architecture
  &__arch {
    margin-bottom: $spacing-4;
  }

  &__arch-box {
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    padding: $spacing-4;
    background: $surface-card;
  }

  &__arch-label {
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: $color-gray-400;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: block;
    margin-bottom: $spacing-3;
  }

  &__arch-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: $spacing-3;
  }

  &__arch-item {
    text-align: center;
    padding: $spacing-3;
    border-radius: $radius-md;
    background: $color-gray-50;
    border: 1px solid $color-gray-100;

    strong {
      display: block;
      font-size: $font-size-sm;
      color: $color-gray-800;
      margin-bottom: 2px;
    }

    span {
      display: block;
      font-size: $font-size-xs;
      color: $color-gray-500;
    }

    code {
      display: block;
      font-size: $font-size-xs;
      color: $color-gray-400;
      margin-top: $spacing-1;
    }
  }

  // Table
  &__table-wrap {
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    overflow-x: auto;
    margin-bottom: $spacing-3;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: $font-size-sm;

    th {
      padding: $spacing-2 $spacing-3;
      text-align: left;
      font-size: $font-size-xs;
      font-weight: $font-weight-semibold;
      color: $color-gray-500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: $surface-elevated;
      border-bottom: 1px solid $color-gray-200;
    }

    td {
      padding: $spacing-2 $spacing-3;
      border-bottom: 1px solid $color-gray-100;
      color: $color-gray-700;
    }

    tr:last-child td { border-bottom: none; }
  }

  // Code blocks
  &__code {
    background: $color-gray-900;
    color: $color-gray-100;
    padding: $spacing-4;
    border-radius: $radius-md;
    font-family: $font-family-mono;
    font-size: $font-size-xs;
    line-height: $line-height-normal;
    overflow-x: auto;
    margin-bottom: $spacing-3;

    code {
      color: $color-gray-100 !important;
      background: none !important;
      padding: 0 !important;
    }

  }

  // Steps
  &__steps {
    font-size: $font-size-sm;
    color: $color-gray-600;
    line-height: $line-height-normal;
    padding-left: $spacing-6;
    margin: 0 0 $spacing-3;

    li { margin-bottom: $spacing-2; }

    code {
      background: $color-gray-100;
      padding: 2px 6px;
      border-radius: $radius-sm;
      font-size: $font-size-xs;
    }

    a {
      color: $color-accent;
      text-decoration: none;
      font-weight: $font-weight-medium;
      &:hover { text-decoration: underline; }
    }
  }

  // Details (OAuth)
  &__detail {
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    margin-bottom: $spacing-2;
    overflow: hidden;

    summary {
      padding: $spacing-3 $spacing-4;
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
      color: $color-gray-700;
      cursor: pointer;
      list-style: none;
      display: flex;
      align-items: center;
      justify-content: space-between;

      &::after {
        content: '+';
        font-size: $font-size-lg;
        color: $color-gray-400;
        flex-shrink: 0;
      }

      &::-webkit-details-marker { display: none; }
      &:hover { background: $color-gray-50; }
    }

    &[open] summary::after {
      content: '-';
    }

    .docs-sh__steps {
      padding: 0 $spacing-4 $spacing-4 $spacing-8;
    }
  }

  // Link
  &__link {
    font-size: $font-size-sm;
    color: $color-accent;
    font-weight: $font-weight-medium;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }

  @media (max-width: $breakpoint-sm) {
    &__arch-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}
</style>
