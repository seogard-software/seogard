<template>
  <div class="bot-page">
    <div class="bot-page__container">
      <header class="bot-page__header">
        <h1 class="bot-page__title">Seogard-Bot</h1>
        <p class="bot-page__subtitle">Notre robot d'analyse SEO technique</p>
      </header>

      <section class="bot-page__section">
        <h2 class="bot-page__heading">Identification</h2>
        <div class="bot-page__info-grid">
          <div class="bot-page__info-card">
            <span class="bot-page__info-label">User-Agent</span>
            <code class="bot-page__info-value">Seogard-Bot/1.0 (+https://seogard.io/bot)</code>
          </div>
          <div class="bot-page__info-card">
            <span class="bot-page__info-label">Adresse IP</span>
            <code class="bot-page__info-value">142.132.133.166</code>
          </div>
        </div>
        <p class="bot-page__text">
          Seogard-Bot analyse vos pages pour détecter les régressions SEO (meta disparues, SSR cassé, redirections incorrectes).
          Il respecte les directives <code>robots.txt</code> et ne surcharge pas vos serveurs.
        </p>
      </section>

      <section class="bot-page__section">
        <h2 class="bot-page__heading">Guides de whitelisting</h2>
        <p class="bot-page__text">
          Si votre pare-feu (WAF) bloque notre crawler, autorisez notre User-Agent ou notre IP.
          Choisissez votre WAF ci-dessous :
        </p>

        <div class="bot-page__guides">
          <details class="bot-page__guide">
            <summary class="bot-page__guide-title">Cloudflare</summary>
            <div class="bot-page__guide-content">
              <h4 class="bot-page__guide-step-title">Étape 1 — Créer une règle WAF Custom (obligatoire)</h4>
              <ol class="bot-page__steps">
                <li>Connectez-vous à votre <strong>dashboard Cloudflare</strong></li>
                <li>Sélectionnez votre domaine</li>
                <li>Allez dans <strong>Security &gt; WAF &gt; Custom Rules</strong></li>
                <li>Cliquez <strong>Create rule</strong></li>
                <li>Nom : <code>Allow Seogard Bot</code></li>
                <li>Cliquez <strong>Edit expression</strong> et collez :
                  <code class="bot-page__code-block">(ip.src eq 142.132.133.166) or (http.user_agent contains "Seogard-Bot")</code>
                </li>
                <li>Action : <strong>Skip</strong></li>
                <li>Cochez <strong>tous les composants</strong> :
                  <ul>
                    <li>All remaining custom rules</li>
                    <li>All rate limiting rules</li>
                    <li>All managed rules</li>
                    <li>All Super Bot Fight Mode Rules</li>
                  </ul>
                </li>
                <li>Place at : <strong>First</strong></li>
                <li>Cliquez <strong>Deploy</strong></li>
              </ol>
              <p class="bot-page__guide-alt">
                <strong>Important</strong> : utilisez <code>or</code> (pas <code>and</code>) entre l'IP et le User-Agent pour que la règle matche si l'un OU l'autre est présent.
              </p>

              <h4 class="bot-page__guide-step-title">Étape 2 — Bot Fight Mode (plan Free uniquement)</h4>
              <p>Sur le <strong>plan Free</strong> de Cloudflare, la règle Skip ne peut pas bypasser le Bot Fight Mode. Si le crawl est toujours bloqué après l'étape 1 :</p>
              <ol class="bot-page__steps">
                <li>Allez dans <strong>Security &gt; Bots</strong></li>
                <li>Désactivez <strong>Bot Fight Mode</strong></li>
              </ol>
              <p class="bot-page__guide-alt">
                <strong>Plans Pro, Business et Enterprise</strong> : pas besoin de désactiver le Bot Fight Mode. La règle Skip de l'étape 1 le bypass automatiquement.
              </p>
            </div>
          </details>

          <details class="bot-page__guide">
            <summary class="bot-page__guide-title">Akamai</summary>
            <div class="bot-page__guide-content">
              <ol class="bot-page__steps">
                <li>Connectez-vous à <strong>Akamai Control Center</strong></li>
                <li>Allez dans <strong>Security &gt; IP/Geo Firewall</strong></li>
                <li>Ajoutez <code>142.132.133.166</code> dans la <strong>Allow list</strong></li>
                <li>Sauvegardez et déployez la configuration</li>
              </ol>
              <p class="bot-page__guide-alt">
                <strong>Alternative</strong> : dans <strong>Bot Manager</strong>, ajoutez <code>Seogard-Bot</code> à la liste des bots autorisés.
              </p>
            </div>
          </details>

          <details class="bot-page__guide">
            <summary class="bot-page__guide-title">AWS WAF</summary>
            <div class="bot-page__guide-content">
              <ol class="bot-page__steps">
                <li>Ouvrez la console <strong>AWS WAF</strong></li>
                <li>Créez un <strong>IP Set</strong> contenant <code>142.132.133.166/32</code></li>
                <li>Ajoutez une règle <strong>Allow</strong> dans votre Web ACL référençant cet IP Set</li>
                <li>Placez cette règle <strong>avant</strong> vos règles de blocage</li>
              </ol>
            </div>
          </details>

          <details class="bot-page__guide">
            <summary class="bot-page__guide-title">Sucuri</summary>
            <div class="bot-page__guide-content">
              <ol class="bot-page__steps">
                <li>Connectez-vous au <strong>dashboard Sucuri</strong></li>
                <li>Allez dans <strong>Firewall &gt; Access Control</strong></li>
                <li>Dans <strong>Whitelist IP</strong>, ajoutez <code>142.132.133.166</code></li>
                <li>Sauvegardez</li>
              </ol>
            </div>
          </details>

          <details class="bot-page__guide">
            <summary class="bot-page__guide-title">Autre pare-feu</summary>
            <div class="bot-page__guide-content">
              <p>Deux méthodes pour autoriser Seogard-Bot :</p>
              <div class="bot-page__method">
                <h4>Méthode 1 — Par IP (recommandé)</h4>
                <p>Ajoutez <code>142.132.133.166</code> dans la liste blanche (allow list) de votre pare-feu.</p>
              </div>
              <div class="bot-page__method">
                <h4>Méthode 2 — Par User-Agent</h4>
                <p>Créez une règle qui autorise les requêtes dont le header <code>User-Agent</code> contient <code>Seogard-Bot</code>.</p>
              </div>
            </div>
          </details>
        </div>
      </section>

      <section id="self-hosted" class="bot-page__section">
        <h2 class="bot-page__heading">Self-hosted</h2>
        <p class="bot-page__text">
          Si vous hébergez Seogard vous-même, le crawler tourne sur <strong>votre serveur</strong>.
          L'adresse IP à whitelister est donc celle de votre machine, pas <code>142.132.133.166</code>.
        </p>
        <div class="bot-page__selfhosted-steps">
          <div class="bot-page__selfhosted-step">
            <span class="bot-page__selfhosted-number">1</span>
            <div>
              <strong>Trouvez l'IP publique de votre serveur</strong>
              <code class="bot-page__code-block">curl -s ifconfig.me</code>
            </div>
          </div>
          <div class="bot-page__selfhosted-step">
            <span class="bot-page__selfhosted-number">2</span>
            <div>
              <strong>Utilisez cette IP dans les guides ci-dessus</strong>
              <p class="bot-page__selfhosted-detail">Remplacez <code>142.132.133.166</code> par l'IP retournée à l'étape 1 dans les règles WAF de votre choix.</p>
            </div>
          </div>
          <div class="bot-page__selfhosted-step">
            <span class="bot-page__selfhosted-number">3</span>
            <div>
              <strong>Le User-Agent reste identique</strong>
              <p class="bot-page__selfhosted-detail"><code>Seogard-Bot/1.0</code> est le même en Cloud et en self-hosted. Vous pouvez aussi whitelister par User-Agent seul.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="bot-page__section">
        <h2 class="bot-page__heading">Besoin d'aide ?</h2>
        <p class="bot-page__text">
          Si vous avez besoin d'assistance pour configurer votre pare-feu, contactez-nous à
          <a href="mailto:support@seogard.io" class="bot-page__link">support@seogard.io</a>.
          Nous pouvons vous guider étape par étape.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing', auth: false })

useHead({
  title: 'Seogard-Bot — Robot d\'analyse SEO',
  meta: [
    { name: 'description', content: 'Informations sur Seogard-Bot, notre robot d\'analyse SEO technique. Guide de whitelisting pour Cloudflare, Akamai, AWS WAF et autres pare-feu.' },
  ],
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.bot-page {
  padding: 120px $spacing-6 $spacing-16;
  min-height: 100vh;

  &__container {
    max-width: 720px;
    margin: 0 auto;
  }

  &__header {
    margin-bottom: $spacing-12;
  }

  &__title {
    font-size: 36px;
    font-weight: $font-weight-bold;
    color: $color-gray-800;
    margin: 0 0 $spacing-2;
  }

  &__subtitle {
    font-size: $font-size-lg;
    color: $color-gray-500;
    margin: 0;
  }

  &__section {
    margin-bottom: $spacing-12;
  }

  &__heading {
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
    color: $color-gray-800;
    margin: 0 0 $spacing-4;
  }

  &__text {
    font-size: $font-size-base;
    color: $color-gray-600;
    line-height: $line-height-normal;
    margin: 0 0 $spacing-4;

    code {
      background: $color-gray-200;
      padding: 2px 6px;
      border-radius: $radius-sm;
      font-size: $font-size-sm;
    }
  }

  &__link {
    color: $color-accent;
    text-decoration: none;
    font-weight: $font-weight-medium;

    &:hover {
      text-decoration: underline;
    }
  }

  &__info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $spacing-4;
    margin-bottom: $spacing-6;
  }

  &__info-card {
    background: $surface-card;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    padding: $spacing-4 $spacing-5;
  }

  &__info-label {
    display: block;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: $color-gray-500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: $spacing-2;
  }

  &__info-value {
    display: block;
    font-size: $font-size-sm;
    color: $color-gray-800;
    background: $color-gray-200;
    padding: $spacing-2 $spacing-3;
    border-radius: $radius-sm;
    word-break: break-all;
  }

  // --- Guides ---
  &__guides {
    display: flex;
    flex-direction: column;
    gap: $spacing-3;
  }

  &__guide {
    background: $surface-card;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    overflow: hidden;

    &[open] {
      border-color: rgba($color-accent, 0.3);
    }
  }

  &__guide-title {
    padding: $spacing-4 $spacing-5;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $color-gray-800;
    cursor: pointer;
    list-style: none;
    display: flex;
    align-items: center;
    justify-content: space-between;

    &::after {
      content: '+';
      font-size: $font-size-lg;
      color: $color-gray-400;
      transition: transform $transition-fast;
    }

    [open] > &::after {
      content: '-';
    }

    &:hover {
      background: rgba($color-gray-200, 0.5);
    }

    &::-webkit-details-marker {
      display: none;
    }
  }

  &__guide-content {
    padding: 0 $spacing-5 $spacing-5;
    font-size: $font-size-sm;
    color: $color-gray-600;
    line-height: $line-height-normal;

    code {
      background: $color-gray-200;
      padding: 2px 6px;
      border-radius: $radius-sm;
      font-size: $font-size-xs;
    }
  }

  &__guide-alt {
    margin-top: $spacing-4;
    padding: $spacing-3 $spacing-4;
    background: rgba($color-accent, 0.05);
    border-left: 3px solid $color-accent;
    border-radius: 0 $radius-sm $radius-sm 0;
    font-size: $font-size-sm;
    color: $color-gray-600;
  }

  &__steps {
    margin: $spacing-3 0;
    padding-left: $spacing-6;

    li {
      margin-bottom: $spacing-2;
    }

    ul {
      margin-top: $spacing-2;
      padding-left: $spacing-5;
    }
  }

  &__guide-step-title {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-800;
    margin: $spacing-5 0 $spacing-2;

    &:first-child {
      margin-top: 0;
    }
  }

  &__code-block {
    display: block;
    margin-top: $spacing-2;
    padding: $spacing-3 $spacing-4;
    background: $color-gray-100;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    font-size: $font-size-xs;
    word-break: break-all;
    line-height: $line-height-normal;
  }

  &__selfhosted-steps {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
    margin-top: $spacing-4;
  }

  &__selfhosted-step {
    display: flex;
    align-items: flex-start;
    gap: $spacing-4;
    padding: $spacing-4 $spacing-5;
    background: $surface-card;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    font-size: $font-size-sm;
    color: $color-gray-600;
    line-height: $line-height-normal;

    code {
      background: $color-gray-200;
      padding: 2px 6px;
      border-radius: $radius-sm;
      font-size: $font-size-xs;
    }
  }

  &__selfhosted-number {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $color-accent;
    color: white;
    border-radius: 50%;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
  }

  &__selfhosted-detail {
    margin: $spacing-1 0 0;
  }

  &__method {
    margin-top: $spacing-4;
    padding: $spacing-3 $spacing-4;
    background: rgba($color-gray-200, 0.5);
    border-radius: $radius-sm;

    h4 {
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
      color: $color-gray-800;
      margin: 0 0 $spacing-1;
    }

    p {
      margin: 0;
    }
  }

  // --- Responsive ---
  @media (max-width: $breakpoint-sm) {
    padding-top: 100px;

    &__info-grid {
      grid-template-columns: 1fr;
    }

    &__title {
      font-size: 28px;
    }
  }
}
</style>
