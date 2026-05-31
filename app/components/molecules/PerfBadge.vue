<template>
  <div class="perf-badge">
    <div class="perf-badge__head">
      <span class="perf-badge__dot" :class="`perf-badge__dot--${rating}`" />
      <span class="perf-badge__label">{{ label }}</span>
      <div class="perf-badge__info-wrap">
        <button
          type="button"
          class="perf-badge__info-btn"
          :class="{ 'perf-badge__info-btn--open': open }"
          :aria-label="`Aide : ${label}`"
          @click.stop="open = !open"
        >
          <AppIcon name="help-circle" size="sm" />
        </button>
        <div
          class="perf-badge__popover"
          :class="{ 'perf-badge__popover--open': open }"
          role="tooltip"
        >
          <strong v-if="abbr" class="perf-badge__popover-abbr">{{ abbr }}</strong>
          {{ hint }}
        </div>
      </div>
    </div>

    <span class="perf-badge__value">{{ value }}</span>

    <div class="perf-badge__foot">
      <span v-if="abbr" class="perf-badge__abbr">{{ abbr }}</span>
      <span class="perf-badge__rating" :class="`perf-badge__rating--${rating}`">{{ ratingLabel }}</span>
    </div>

    <div v-if="open" class="perf-badge__backdrop" @click="open = false" />
  </div>
</template>

<script setup lang="ts">
import type { WebVitalRating } from '~~/shared/types/perf'

interface Props {
  label: string          // libellé métier clair, ex : "Affichage du contenu"
  value: string          // valeur formatée, ex : "2,1 s"
  rating: WebVitalRating // good / needs-improvement / poor
  hint: string           // explication métier affichée dans le popover
  abbr?: string          // terme technique (LCP, CLS, TTFB), affiché discrètement
}

const props = withDefaults(defineProps<Props>(), { abbr: '' })

const open = ref(false)

const RATING_LABELS: Record<WebVitalRating, string> = {
  'good': 'Bon',
  'needs-improvement': 'À améliorer',
  'poor': 'Médiocre',
}
const ratingLabel = computed(() => RATING_LABELS[props.rating])
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.perf-badge {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: $spacing-2;
  padding: $spacing-4;
  border-radius: $radius-lg;
  border: 1px solid $color-gray-200;
  background: $surface-card;
  transition: border-color $transition-base, box-shadow $transition-base;

  &:hover {
    border-color: $color-gray-300;
    box-shadow: $shadow-sm;
  }

  // ── Head : pastille d'état + libellé + bouton info ──
  &__head {
    display: flex;
    align-items: center;
    gap: $spacing-2;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: $radius-full;
    flex-shrink: 0;

    &--good { background: $color-success; }
    &--needs-improvement { background: $color-warning; }
    &--poor { background: $color-danger; }
  }

  &__label {
    flex: 1;
    min-width: 0;
    font-size: $font-size-xs;
    color: $color-gray-600;
    font-weight: $font-weight-medium;
  }

  // ── Info : bouton + popover ──
  &__info-wrap {
    position: relative;
    display: inline-flex;
    flex-shrink: 0;

    &:hover .perf-badge__popover { // survol = instantané, pas de délai natif
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
  }

  &__info-btn {
    display: inline-flex;
    padding: 0;
    color: $color-gray-300;
    background: none;
    border: none;
    cursor: pointer;
    transition: color $transition-fast;

    &:hover,
    &--open { color: $color-gray-600; }
  }

  &__popover {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    z-index: 20;
    width: 220px;
    padding: $spacing-3;
    font-size: $font-size-xs;
    line-height: $line-height-normal;
    color: $color-gray-600;
    background: $surface-card;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    box-shadow: $shadow-lg;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-4px);
    transition: opacity $transition-fast, transform $transition-fast, visibility $transition-fast;

    &--open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
  }

  &__popover-abbr {
    display: block;
    margin-bottom: 2px;
    color: $color-gray-900;
    font-weight: $font-weight-semibold;
    letter-spacing: 0.04em;
  }

  // ── Valeur ──
  &__value {
    font-size: $font-size-xl;
    font-weight: $font-weight-bold;
    color: $color-gray-900;
    letter-spacing: -0.02em;
    line-height: $line-height-tight;
  }

  // ── Foot : abréviation + chip d'état ──
  &__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-2;
  }

  &__abbr {
    font-size: 10px;
    letter-spacing: 0.04em;
    color: $color-gray-400;
    text-transform: uppercase;
    font-weight: $font-weight-medium;
  }

  &__rating {
    font-size: 11px;
    font-weight: $font-weight-medium;
    padding: 2px 8px;
    border-radius: $radius-full;

    &--good { color: $color-success; background: $color-success-bg; }
    &--needs-improvement { color: $color-warning; background: $color-warning-bg; }
    &--poor { color: $color-danger; background: $color-danger-bg; }
  }

  // Ferme le popover au clic n'importe où (surtout tactile, où le survol n'existe pas).
  &__backdrop {
    position: fixed;
    inset: 0;
    z-index: 10;
  }
}
</style>
