<template>
  <section class="rule-scan-cta">
    <span class="rule-scan-cta__diff">
      <AppIcon name="code" size="sm" />
      {{ $t('docs.fiche.scanDiff') }}
    </span>
    <p class="rule-scan-cta__q">{{ $t('docs.fiche.scanQuestion') }}</p>
    <p class="rule-scan-cta__d">{{ hook }}</p>
    <ScanBar size="inline" />
    <ul class="rule-scan-cta__trust">
      <li class="rule-scan-cta__trust-item">
        <AppIcon name="check" size="sm" />
        {{ $t('docs.fiche.scanTrustNoCard') }}
      </li>
      <li class="rule-scan-cta__trust-item">
        <AppIcon name="check" size="sm" />
        {{ $t('docs.fiche.scanTrustFast') }}
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
// Point de conversion inline d'une fiche (① après « Comment corriger »). Message variabilisé par
// règle (`scanHook`) ; le scan réel passe par ScanBar (même parcours que la home : modale
// d'inscription → auto-création site + auto-crawl). La carte n'est que l'habillage.
defineProps<{ hook: string }>()
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.rule-scan-cta {
  margin: $spacing-6 0;
  padding: $spacing-5 $spacing-6;
  border: 1px solid rgba($color-info, 0.18);
  border-radius: $radius-xl;
  background: linear-gradient(180deg, $color-info-bg, $color-white);
  box-shadow: 0 6px 20px rgba($color-info, 0.08);

  &__diff {
    display: inline-flex;
    align-items: center;
    gap: $spacing-2;
    margin-bottom: $spacing-3;
    padding: $spacing-1 $spacing-3;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: $color-info;
    background: $color-white;
    border: 1px solid rgba($color-info, 0.2);
    border-radius: $radius-full;
  }

  &__q {
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    letter-spacing: -0.01em;
    color: $color-gray-900;
    margin: 0 0 $spacing-1;
  }

  &__d {
    font-size: $font-size-sm;
    line-height: $line-height-normal;
    color: $color-gray-600;
    margin: 0 0 $spacing-4;
  }

  &__trust {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-2 $spacing-4;
    margin: $spacing-3 0 0;
    padding: 0;
    list-style: none;
  }

  &__trust-item {
    display: inline-flex;
    align-items: center;
    gap: $spacing-2;
    font-size: $font-size-xs;
    color: $color-gray-500;

    :deep(.app-icon) { color: $color-success; }
  }
}
</style>
