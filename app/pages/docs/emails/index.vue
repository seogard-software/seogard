<template>
  <div class="docs-emails">
    <div class="docs-emails__container">
      <h1 class="docs-emails__title">Emails <span class="docs-emails__dev-badge">DEV ONLY</span></h1>
      <p class="docs-emails__subtitle">Les emails envoyés par Seogard — cliquez pour prévisualiser le rendu exact.</p>

      <ul class="docs-emails__list">
        <li v-for="tpl in templates" :key="tpl.id">
          <NuxtLink :to="`/docs/emails/${tpl.id}`" class="docs-emails__link">
            {{ tpl.label }}
            <AppIcon name="chevron-right" size="sm" />
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'docs', auth: false })

if (import.meta.server && process.env.NODE_ENV === 'production') {
  navigateTo('/docs', { redirectCode: 302 })
}

useHead({ title: 'Emails' })
useSeoMeta({
  title: 'Emails — Seogard',
  description: 'Prévisualisez les 11 templates d\'email envoyés par Seogard : alertes, digest, estimation, facturation.',
})

const templates = [
  { id: 'welcome', label: 'Bienvenue' },
  { id: 'alert-critical', label: 'Alertes critiques' },
  { id: 'daily-digest', label: 'Rapport quotidien (avec régressions)' },
  { id: 'daily-digest-ok', label: 'Rapport quotidien (tout OK)' },
  { id: 'log-digest', label: 'Digest logs workers' },
  { id: 'sitemap-blocked', label: 'Sitemap bloqué (WAF)' },
  { id: 'crawler-blocked', label: 'Crawler bloqué (WAF)' },
  { id: 'reset-password', label: 'Réinitialisation mot de passe' },
  { id: 'sitemap-estimate', label: 'Estimation sitemap (lead)' },
  { id: 'sitemap-estimate-large', label: 'Estimation sitemap (gros site > 50k)' },
  { id: 'payment-failed', label: 'Échec de paiement' },
  { id: 'invite', label: 'Invitation organisation' },
]
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.docs-emails {
  &__container {
    max-width: 520px;
  }

  &__title {
    font-size: $font-size-2xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    margin: 0 0 $spacing-1;
    letter-spacing: -0.03em;
    display: flex;
    align-items: center;
    gap: $spacing-3;
  }

  &__dev-badge {
    display: inline-block;
    padding: 3px 10px;
    background: $color-warning-bg;
    color: $color-warning;
    border-radius: $radius-sm;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    letter-spacing: 0.05em;
  }

  &__subtitle {
    font-size: $font-size-sm;
    color: $color-gray-500;
    margin: 0 0 $spacing-6;
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
    background: $surface-card;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    overflow: hidden;

    li + li {
      border-top: 1px solid $color-gray-100;
    }
  }

  &__link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: $spacing-3 $spacing-4;
    font-size: $font-size-sm;
    color: $color-gray-900;
    text-decoration: none;
    transition: background $transition-fast;

    &:hover {
      background: $surface-elevated;
    }

    :deep(.app-icon) {
      color: $color-gray-400;
    }
  }
}
</style>
