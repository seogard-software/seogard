<template>
  <section id="ssr-demo" class="demo-teaser" aria-labelledby="ssr-demo-title">
    <div>
      <p class="demo-teaser__eyebrow">{{ $t('docs.ssrDemo.eyebrow') }}</p>
      <h2 id="ssr-demo-title">{{ $t('docs.ssrDemo.teaserTitle') }}</h2>
      <p class="demo-teaser__intro">{{ $t('docs.ssrDemo.teaserIntro') }}</p>
      <NuxtLink :to="localePath({ name: 'demo-ssr' })" class="demo-teaser__link">
        {{ $t('docs.ssrDemo.openDemo') }} <span aria-hidden="true">↗</span>
      </NuxtLink>
    </div>
    <div class="demo-teaser__proof">
      <div class="demo-teaser__numbers" aria-hidden="true">
        <span>{{ demo.before.detectedRules.length }}</span><span class="demo-teaser__arrow">→</span><span>{{ demo.after.detectedRules.length }}</span>
      </div>
      <p>{{ $t('docs.ssrDemo.teaserResult', { before: demo.before.detectedRules.length, after: demo.after.detectedRules.length, total: demo.rulesChecked.length }) }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import demo from '~~/shared/data/ssr-demo.json'

const localePath = useLocalePath()
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.demo-teaser {
  scroll-margin-top: 7rem;
  display: grid;
  grid-template-columns: 1fr 240px;
  align-items: center;
  gap: $spacing-8;
  max-width: 980px;
  margin: 0 auto;
  padding: clamp(24px, 4vw, 48px);
  background: $color-white;
  border: 1px solid $color-gray-200;
  border-radius: 24px;
  box-shadow: 0 12px 32px rgb(17 24 39 / 4%);

  &__eyebrow { color: $color-info; font-size: $font-size-xs; font-weight: $font-weight-semibold; margin-bottom: $spacing-3; }
  h2 { font-size: clamp(26px, 3vw, 36px); line-height: 1.12; letter-spacing: -0.035em; max-width: 520px; }
  &__intro { color: $color-gray-600; line-height: 1.6; margin-top: $spacing-4; max-width: 520px; }
  &__link {
    display: inline-flex; align-items: center; gap: $spacing-4;
    margin-top: $spacing-5; padding: $spacing-3 $spacing-5;
    background: $color-gray-900; color: $color-white; border-radius: $radius-lg;
    text-decoration: none; font-size: $font-size-sm;
    &:hover { background: $color-black; }
    &:focus-visible { outline: 3px solid $color-info; outline-offset: 4px; }
  }
  &__proof { padding: $spacing-6; border-radius: 20px; background: $color-info-bg; text-align: center; }
  &__numbers { display: flex; justify-content: center; align-items: center; gap: $spacing-4; color: $color-info; font-size: 64px; line-height: 1.15; letter-spacing: -0.06em; }
  &__arrow { font-size: 28px; color: $color-gray-600; }
  &__proof p { font-size: $font-size-sm; color: $color-gray-700; line-height: 1.5; margin-top: $spacing-2; }
  @media (max-width: $breakpoint-sm) {
    grid-template-columns: 1fr; gap: $spacing-5;
    &__proof { display: flex; align-items: center; gap: $spacing-5; padding: $spacing-4; text-align: left; }
    &__numbers { font-size: 42px; flex-shrink: 0; gap: $spacing-3; }
    &__proof p { margin: 0; }
  }
}
</style>
