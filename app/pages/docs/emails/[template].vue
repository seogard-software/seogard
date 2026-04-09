<template>
  <div class="docs-email-preview">
    <div class="docs-email-preview__bar">
      <span class="docs-email-preview__subject">{{ templateLabel }}</span>
    </div>
    <iframe
      :src="`/docs/emails/preview/${templateId}`"
      class="docs-email-preview__frame"
      frameborder="0"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'docs', auth: false })

if (import.meta.server && process.env.NODE_ENV === 'production') {
  navigateTo('/docs', { redirectCode: 302 })
}

const route = useRoute()
const templateId = computed(() => route.params.template as string)

const LABELS: Record<string, string> = {
  'welcome': 'Bienvenue',
  'alert-critical': 'Alertes critiques',
  'daily-digest': 'Rapport quotidien (avec régressions)',
  'daily-digest-ok': 'Rapport quotidien (tout OK)',
  'log-digest': 'Digest logs workers',
  'sitemap-blocked': 'Sitemap bloqué (WAF)',
  'crawler-blocked': 'Crawler bloqué (WAF)',
  'reset-password': 'Réinitialisation mot de passe',
  'sitemap-estimate': 'Estimation sitemap (lead)',
  'sitemap-estimate-large': 'Estimation sitemap (gros site > 50k)',
  'payment-failed': 'Échec de paiement',
  'invite': 'Invitation organisation',
}

const templateLabel = computed(() => LABELS[templateId.value] || templateId.value)

useHead({ title: computed(() => templateLabel.value) })
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.docs-email-preview {
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 56px - #{$spacing-8} * 2);
  margin: -#{$spacing-8};
  margin-top: 0;

  &__bar {
    display: flex;
    align-items: center;
    gap: $spacing-4;
    padding: $spacing-3 $spacing-5;
    background: $surface-elevated;
    border-bottom: 1px solid $color-gray-200;
    border-radius: $radius-md $radius-md 0 0;
  }

  &__subject {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-900;
  }

  &__frame {
    flex: 1;
    width: 100%;
    border: none;
    background: #f4f4f4;
  }
}
</style>
