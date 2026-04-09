<template>
  <section id="pricing" class="landing-pricing">
    <div class="landing-pricing__container">
      <span class="section-label">Tarifs</span>
      <h2 class="section-title">Self-hosted <span class="landing-pricing__highlight">gratuit</span>. Cloud à l'usage.</h2>
      <p class="section-desc">
        Même moteur de détection partout. Choisissez le niveau de support, de sécurité et d'accompagnement qui vous convient.
      </p>

      <!-- Desktop table -->
      <div class="landing-pricing__table-wrapper">
        <table class="landing-pricing__table">
          <thead>
            <tr>
              <th class="landing-pricing__th landing-pricing__th--feature" />
              <th class="landing-pricing__th landing-pricing__th--plan">
                <span class="landing-pricing__plan-name">Self-hosted</span>
                <span class="landing-pricing__price landing-pricing__price--gradient">Gratuit</span>
                <span class="landing-pricing__subtitle">Pour toujours</span>
              </th>
              <th class="landing-pricing__th landing-pricing__th--plan landing-pricing__th--cloud">
                <span class="landing-pricing__popular">Populaire</span>
                <span class="landing-pricing__plan-name">Cloud</span>
                <span class="landing-pricing__price landing-pricing__price--gradient">{{ cloudPriceDisplay }} €</span>
                <span class="landing-pricing__subtitle">par page monitorée / mois</span>
                <span class="landing-pricing__trial-badge">14 jours gratuit</span>
              </th>
              <th class="landing-pricing__th landing-pricing__th--plan">
                <span class="landing-pricing__plan-name">Enterprise</span>
                <span class="landing-pricing__price">Sur devis</span>
                <span class="landing-pricing__subtitle">Contactez-nous</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, i) in PRICING_ROWS"
              :key="row.label"
              :class="[
                'landing-pricing__row',
                { 'landing-pricing__row--separator': i === PRICING_SHARED_COUNT || i === PRICING_SHARED_COUNT + PRICING_CLOUD_COUNT },
              ]"
            >
              <td class="landing-pricing__td landing-pricing__td--feature">{{ row.label }}</td>
              <td class="landing-pricing__td landing-pricing__td--check">
                <span v-if="row.selfHosted" class="landing-pricing__check landing-pricing__check--yes">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                <span v-else class="landing-pricing__dash">&mdash;</span>
              </td>
              <td class="landing-pricing__td landing-pricing__td--check landing-pricing__td--cloud">
                <span v-if="row.cloud" class="landing-pricing__check landing-pricing__check--yes">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
                <span v-else class="landing-pricing__dash">&mdash;</span>
              </td>
              <td class="landing-pricing__td landing-pricing__td--check">
                <span class="landing-pricing__check landing-pricing__check--yes">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </span>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td class="landing-pricing__td" />
              <td class="landing-pricing__td landing-pricing__td--cta">
                <a href="https://github.com/seogard-software/seogard" target="_blank" rel="noopener" class="landing-pricing__cta landing-pricing__cta--ghost">
                  Télécharger gratuitement
                </a>
              </td>
              <td class="landing-pricing__td landing-pricing__td--cta landing-pricing__td--cloud">
                <NuxtLink to="/register" class="landing-pricing__cta landing-pricing__cta--primary">
                  Essai gratuit 14 jours
                </NuxtLink>
              </td>
              <td class="landing-pricing__td landing-pricing__td--cta">
                <a href="mailto:support@seogard.io" class="landing-pricing__cta landing-pricing__cta--ghost">
                  Contactez-nous
                </a>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Dynamic estimation -->
      <div v-if="estimatedPages" class="landing-pricing__estimate">
        <span class="landing-pricing__estimate-value">{{ estimatedCloudPrice }} €/mois</span>
        <span class="landing-pricing__estimate-label">
          estimation Cloud pour {{ estimatedPages.toLocaleString('fr-FR') }} pages
        </span>
      </div>

      <!-- Mobile list -->
      <div class="landing-pricing__mobile">
        <div v-for="plan in mobilePlans" :key="plan.id" class="landing-pricing__mobile-section">
          <div :class="['landing-pricing__mobile-plan', { 'landing-pricing__mobile-plan--cloud': plan.id === 'cloud' }]">
            <span v-if="plan.id === 'cloud'" class="landing-pricing__popular">Populaire</span>
            <h3 class="landing-pricing__mobile-name">{{ plan.name }}</h3>
            <span class="landing-pricing__price landing-pricing__price--gradient">{{ plan.price }}</span>
            <span class="landing-pricing__subtitle">{{ plan.subtitle }}</span>
          </div>
          <div class="landing-pricing__mobile-features">
            <div v-for="row in PRICING_ROWS.filter(r => r[plan.key])" :key="row.label" class="landing-pricing__mobile-row">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              <span>{{ row.label }}</span>
            </div>
          </div>
          <a v-if="plan.id === 'self-hosted'" href="https://github.com/seogard-software/seogard" target="_blank" rel="noopener" class="landing-pricing__cta landing-pricing__cta--ghost">
            Télécharger gratuitement
          </a>
          <NuxtLink v-else-if="plan.id === 'cloud'" to="/register" class="landing-pricing__cta landing-pricing__cta--primary">
            Essai gratuit 14 jours
          </NuxtLink>
          <a v-else href="mailto:support@seogard.io" class="landing-pricing__cta landing-pricing__cta--ghost">
            Contactez-nous
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { PRICING_ROWS, PRICING_SHARED_COUNT, PRICING_CLOUD_COUNT, formatCloudPrice, calculateCloudPrice } from '~~/shared/utils/pricing'

const estimatedPages = inject<Ref<number | null>>('estimatedPages', ref(null))
const cloudPriceDisplay = formatCloudPrice()

const estimatedCloudPrice = computed(() => {
  if (!estimatedPages.value) return ''
  return calculateCloudPrice(estimatedPages.value).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
})

const mobilePlans = [
  { id: 'self-hosted', name: 'Self-hosted', price: 'Gratuit', subtitle: 'Pour toujours', key: 'selfHosted' as const },
  { id: 'cloud', name: 'Cloud', price: `${cloudPriceDisplay} €`, subtitle: 'par page monitorée / mois', key: 'cloud' as const },
  { id: 'enterprise', name: 'Enterprise', price: 'Sur devis', subtitle: 'Contactez-nous', key: 'enterprise' as const },
]
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.section-label {
  display: block;
  font-size: $font-size-sm;
  font-weight: $font-weight-semibold;
  color: $color-accent;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: $spacing-4;
  text-align: center;
}

.section-title {
  font-size: clamp(1.75rem, 3.5vw, 2.5rem);
  font-weight: $font-weight-bold;
  line-height: $line-height-tight;
  color: $color-gray-900;
  margin-bottom: $spacing-4;
  letter-spacing: -0.02em;
  text-align: center;
}

.section-desc {
  font-size: $font-size-lg;
  color: $color-gray-500;
  max-width: 600px;
  margin: 0 auto $spacing-12;
  line-height: $line-height-normal;
  text-align: center;
}

.landing-pricing {
  padding: 6rem 0;

  &__highlight {
    color: $color-success;
  }

  &__container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 $spacing-6;
  }

  // ── Table ──

  &__table-wrapper {
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    overflow: hidden;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
  }

  &__th {
    padding: $spacing-6 $spacing-4;
    text-align: center;
    vertical-align: bottom;
    background: $surface-elevated;
    border-bottom: 1px solid $color-gray-200;
    border-left: 1px solid $color-gray-200;

    &:first-child {
      border-left: none;
    }

    &--feature {
      width: 40%;
    }

    &--cloud {
      background: $color-gray-50;
    }
  }

  &__plan-name {
    display: block;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: $color-gray-500;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: $spacing-2;
  }

  &__price {
    display: block;
    font-size: $font-size-3xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    letter-spacing: -0.03em;
    margin-bottom: $spacing-1;

    &--gradient {
      color: $color-gray-900;
    }
  }

  &__subtitle {
    display: block;
    font-size: $font-size-xs;
    color: $color-gray-400;
  }

  &__trial-badge {
    display: inline-block;
    padding: $spacing-1 $spacing-3;
    background: rgba($color-success, 0.1);
    color: $color-success;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    border-radius: $radius-full;
    margin-top: $spacing-2;
  }

  &__popular {
    display: inline-block;
    padding: $spacing-1 $spacing-3;
    background: $color-gray-900;
    color: $color-white;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    border-radius: $radius-full;
    margin-bottom: $spacing-3;
  }

  &__row {
    border-bottom: 1px solid $color-gray-200;

    &:last-child {
      border-bottom: none;
    }

    &--separator {
      border-top: 1px solid $color-gray-200;
    }

    &:has(+ &--separator) {
      border-bottom: none;
    }
  }

  &__td {
    padding: $spacing-3 $spacing-4;
    font-size: $font-size-sm;
    border-left: 1px solid $color-gray-200;

    &:first-child {
      border-left: none;
    }

    &--feature {
      color: $color-gray-700;
      font-weight: $font-weight-medium;
    }

    &--check {
      text-align: center;
    }

    &--cloud {
      background: $color-gray-50;
    }

    &--cta {
      padding: $spacing-5 $spacing-4;
      text-align: center;
      border-top: 1px solid $color-gray-200;
    }
  }

  &__check {
    display: inline-flex;

    &--yes {
      color: $color-success;
    }
  }

  &__dash {
    color: $color-gray-300;
    font-size: $font-size-lg;
  }

  // ── Estimation ──

  &__estimate {
    text-align: center;
    padding: $spacing-4;
    margin-top: $spacing-5;
    background: rgba($color-info, 0.06);
    border: 1px solid rgba($color-info, 0.15);
    border-radius: $radius-lg;
  }

  &__estimate-value {
    display: inline;
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    margin-right: $spacing-2;
  }

  &__estimate-label {
    font-size: $font-size-sm;
    color: $color-gray-500;
  }

  // ── Mobile ──

  &__mobile {
    display: none;
  }

  &__mobile-section {
    margin-bottom: $spacing-8;

    &:last-child {
      margin-bottom: 0;
    }
  }

  &__mobile-plan {
    text-align: center;
    padding: $spacing-6 0;
    border-bottom: 1px solid $color-gray-200;
  }

  &__mobile-name {
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    margin-bottom: $spacing-2;
  }

  &__mobile-features {
    padding: $spacing-4 0 $spacing-6;
  }

  &__mobile-row {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    padding: $spacing-2 0;
    font-size: $font-size-sm;
    color: $color-gray-600;

    svg {
      flex-shrink: 0;
      color: $color-success;
    }
  }

  // ── CTAs ──

  &__cta {
    display: inline-block;
    text-align: center;
    padding: 0.75rem $spacing-5;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    border-radius: $radius-lg;
    text-decoration: none;
    transition: all $transition-base;
    white-space: nowrap;

    &--primary {
      background: $color-gray-900;
      color: $color-white;

      &:hover {
        background: $color-black;
        box-shadow: $shadow-md;
        text-decoration: none;
      }
    }

    &--ghost {
      color: $color-gray-500;
      border: 1px solid $color-gray-300;

      &:hover {
        color: $color-gray-800;
        border-color: $color-gray-400;
        text-decoration: none;
      }
    }
  }
}

// ── Responsive ──

@media (max-width: $breakpoint-md) {
  .landing-pricing {
    &__table-wrapper {
      display: none;
    }

    &__mobile {
      display: block;
    }
  }
}
</style>
