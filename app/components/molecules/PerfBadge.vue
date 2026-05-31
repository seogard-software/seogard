<template>
  <div class="perf-badge" :class="`perf-badge--${rating}`">
    <div class="perf-badge__head">
      <span class="perf-badge__label">{{ label }}</span>
      <span class="perf-badge__info" :title="`${abbr ? abbr + ' — ' : ''}${hint}`">
        <AppIcon name="help-circle" size="sm" />
      </span>
    </div>
    <span class="perf-badge__value">{{ value }}</span>
    <span v-if="abbr" class="perf-badge__abbr">{{ abbr }}</span>
  </div>
</template>

<script setup lang="ts">
import type { WebVitalRating } from '~~/shared/types/perf'

interface Props {
  label: string          // libellé métier clair, ex : "Affichage du contenu"
  value: string          // valeur formatée, ex : "2,1 s"
  rating: WebVitalRating // good / needs-improvement / poor
  hint: string           // explication métier affichée au survol de l'icône info
  abbr?: string          // terme technique (LCP, CLS, TTFB), affiché discrètement
}

withDefaults(defineProps<Props>(), { abbr: '' })
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.perf-badge {
  display: inline-flex;
  flex-direction: column;
  gap: $spacing-1;
  padding: $spacing-2 $spacing-3;
  border-radius: $radius-md;
  border: 1px solid $color-gray-200;
  min-width: 120px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-2;
  }

  &__label {
    font-size: $font-size-xs;
    color: $color-gray-500;
    font-weight: $font-weight-medium;
  }

  &__info {
    display: inline-flex;
    color: $color-gray-400;
    cursor: help;
    transition: color $transition-fast;

    &:hover { color: $color-gray-600; }
  }

  &__value {
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
  }

  &__abbr {
    font-size: 10px;
    letter-spacing: 0.04em;
    color: $color-gray-400;
    text-transform: uppercase;
  }

  &--good {
    border-color: rgba($color-success, 0.3);
    background: rgba($color-success, 0.06);
    .perf-badge__value { color: $color-success; }
  }

  &--needs-improvement {
    border-color: rgba($color-warning, 0.3);
    background: rgba($color-warning, 0.06);
    .perf-badge__value { color: $color-warning; }
  }

  &--poor {
    border-color: rgba($color-danger, 0.3);
    background: rgba($color-danger, 0.06);
    .perf-badge__value { color: $color-danger; }
  }
}
</style>
