<template>
  <div class="formations">
    <!-- Hero -->
    <section class="formations__hero">
      <span class="formations__badge">
        <AppIcon name="check" size="sm" />
        {{ $t('landing.formations.hero.badge') }}
      </span>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <h1 class="formations__title" v-html="$t('landing.formations.hero.title')" />
      <p class="formations__subtitle">
        {{ $t('landing.formations.hero.subtitle') }}
      </p>
      <div class="formations__cta">
        <NuxtLink to="/register" class="formations__btn formations__btn--primary">
          {{ $t('landing.formations.hero.ctaPrimary') }}
        </NuxtLink>
        <NuxtLink to="/scanner" class="formations__btn formations__btn--ghost">
          {{ $t('landing.formations.hero.ctaSecondary') }}
        </NuxtLink>
      </div>
    </section>

    <!-- Positionnement -->
    <section class="formations__intro">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <p v-html="$t('landing.formations.intro')" />
    </section>

    <!-- La formation -->
    <section class="formations__program">
      <h2 class="formations__section-title">{{ $t('landing.formations.program.title') }}</h2>
      <p class="formations__section-intro">
        {{ $t('landing.formations.program.intro', { count: lessons.length }) }}
      </p>

      <article class="formations__course">
        <div class="formations__course-banner">
          <div class="formations__course-head">
            <span class="formations__tag formations__tag--geo">{{ $t('landing.formations.course.tag') }}</span>
            <span class="formations__soon">{{ $t('landing.formations.course.soon') }}</span>
          </div>
          <h3 class="formations__course-title">{{ $t('landing.formations.course.title') }}</h3>
          <p class="formations__course-desc">
            {{ $t('landing.formations.course.desc') }}
          </p>
          <div class="formations__course-meta">
            <span class="formations__meta-item">
              <AppIcon name="pages" size="sm" /> {{ $t('landing.formations.course.metaModules', { count: lessons.length }) }}
            </span>
            <span class="formations__meta-item">
              <AppIcon name="check" size="sm" /> {{ $t('landing.formations.course.metaFree') }}
            </span>
            <span class="formations__meta-item">
              <AppIcon name="chart-bar" size="sm" /> {{ $t('landing.formations.course.metaLevel') }}
            </span>
          </div>
        </div>

        <ul class="formations__modules">
          <li v-for="(lesson, i) in lessons" :key="lesson.title">
            <details class="formations__module" :open="i === 0">
              <summary class="formations__module-summary">
                <span class="formations__module-num">{{ i + 1 }}</span>
                <span class="formations__module-title">{{ lesson.title }}</span>
                <AppIcon name="chevron-down" size="sm" class="formations__module-chevron" />
              </summary>
              <p class="formations__module-desc">{{ lesson.desc }}</p>
            </details>
          </li>
        </ul>
      </article>
    </section>

    <!-- Pourquoi -->
    <section class="formations__why">
      <h2 class="formations__section-title">{{ $t('landing.formations.why.title') }}</h2>
      <div class="formations__why-grid">
        <div v-for="item in benefits" :key="item.title" class="formations__why-item">
          <h3 class="formations__why-title">{{ item.title }}</h3>
          <p class="formations__why-desc">{{ item.desc }}</p>
        </div>
      </div>
    </section>

    <!-- CTA final -->
    <section class="formations__final">
      <h2 class="formations__final-title">{{ $t('landing.formations.final.title') }}</h2>
      <p class="formations__final-desc">
        {{ $t('landing.formations.final.desc') }}
      </p>
      <NuxtLink to="/register" class="formations__btn formations__btn--primary">
        {{ $t('landing.formations.final.cta') }}
      </NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing', auth: false })

interface Lesson { title: string, desc: string }

const { t, tm, rt, locale } = useI18n()
const localePath = useLocalePath()
const appUrl = useRuntimeConfig().public.appUrl || 'https://seogard.io'

// Modules de la formation « Ton site et l'IA » = la série vidéo (pilier + 8 épisodes) planifiée
// dans .claude/youtube/cluster-ia.md. Wording en i18n (landing.formations.lessons/benefits).
const lessons = computed<Lesson[]>(() =>
  (tm('landing.formations.lessons') as Lesson[]).map(l => ({ title: rt(l.title), desc: rt(l.desc) })),
)
const benefits = computed<Lesson[]>(() =>
  (tm('landing.formations.benefits') as Lesson[]).map(b => ({ title: rt(b.title), desc: rt(b.desc) })),
)

const ogImage = computed(() => `${appUrl}${locale.value === 'en' ? '/og-image-en.png' : '/og-image.png'}`)

useSeoMeta({
  title: t('seo.formations.title'),
  description: t('seo.formations.description'),
  ogTitle: t('seo.formations.ogTitle'),
  ogDescription: t('seo.formations.ogDescription'),
  ogType: 'website',
  ogUrl: `${appUrl}${localePath({ name: 'formations' })}`,
  ogImage,
  twitterCard: 'summary_large_image',
  twitterImage: ogImage,
  twitterTitle: t('seo.formations.twitterTitle'),
  twitterDescription: t('seo.formations.twitterDescription'),
  robots: 'index, follow',
})

useHead({
  // Canonical + hreflang posés par useCanonicalHead() (layout landing) — jamais en dur ici.
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Course',
      'name': t('seo.formations.jsonld.name'),
      'description': t('seo.formations.jsonld.desc'),
      'provider': { '@type': 'Organization', 'name': 'Seogard', 'url': appUrl },
      'inLanguage': locale.value,
      'isAccessibleForFree': true,
      'syllabusSections': lessons.value.map((l, i) => ({
        '@type': 'Syllabus',
        'position': i + 1,
        'name': l.title,
        'description': l.desc,
      })),
    }),
  }],
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.formations {
  max-width: 1080px;
  margin: 0 auto;
  // 9rem en haut = même air sous le header fixe que les autres pages (scanner, tarifs).
  padding: 9rem $spacing-6 $spacing-16;
  display: flex;
  flex-direction: column;
  gap: $spacing-16;

  &__hero {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-5;
  }

  &__badge {
    display: inline-flex;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-2 $spacing-4;
    background: $color-success-bg;
    color: $color-success;
    border-radius: $radius-2xl;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
  }

  &__title {
    font-family: $font-family-heading;
    font-size: $font-size-5xl;
    line-height: $line-height-tight;
    color: $color-gray-900;
    max-width: 18ch;

    em {
      font-style: italic;
      color: $color-info;
    }
  }

  &__subtitle {
    font-size: $font-size-lg;
    line-height: $line-height-normal;
    color: $color-gray-600;
    max-width: 60ch;
  }

  &__cta {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-3;
    justify-content: center;
  }

  &__btn {
    display: inline-flex;
    align-items: center;
    padding: $spacing-3 $spacing-6;
    border-radius: $radius-lg;
    font-weight: $font-weight-semibold;
    font-size: $font-size-base;
    transition: opacity 0.15s ease;

    &--primary {
      background: $color-accent;
      color: $color-white;

      &:hover { opacity: 0.88; }
    }

    &--ghost {
      background: $color-white;
      color: $color-gray-900;
      border: 1px solid $color-gray-300;

      &:hover { background: $color-gray-50; }
    }
  }

  &__intro {
    font-size: $font-size-lg;
    line-height: $line-height-normal;
    color: $color-gray-700;
    max-width: 70ch;
    margin: 0 auto;
    text-align: center;

    code {
      font-family: $font-family-mono;
      font-size: 0.9em;
      background: $color-gray-100;
      padding: 0.1em 0.35em;
      border-radius: $radius-sm;
    }
  }

  &__section-title {
    font-family: $font-family-heading;
    font-size: $font-size-3xl;
    color: $color-gray-900;
    text-align: center;
  }

  &__section-intro {
    font-size: $font-size-base;
    line-height: $line-height-normal;
    color: $color-gray-600;
    max-width: 60ch;
    margin: $spacing-3 auto 0;
    text-align: center;
  }

  &__tag {
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    padding: $spacing-1 $spacing-3;
    border-radius: $radius-2xl;

    &--geo { background: $color-info-bg; color: $color-info; }
    &--technique { background: $color-gray-100; color: $color-gray-700; }
    &--contenu { background: $color-warning-bg; color: $color-warning; }
  }

  &__soon {
    display: inline-flex;
    align-items: center;
    gap: $spacing-1;
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: $color-info;

    &::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: $color-info;
    }
  }

  // --- La formation : carte avec bannière + sommaire en accordéon ---
  &__course {
    max-width: 760px;
    margin: $spacing-10 auto 0;
    background: $surface-card;
    border: 1px solid $color-gray-200;
    border-radius: $radius-2xl;
    overflow: hidden;
    box-shadow: $shadow-md;
  }

  &__course-banner {
    padding: $spacing-8;
    background: linear-gradient(135deg, $color-info-bg 0%, $color-gray-50 100%);
    border-bottom: 1px solid $color-gray-200;
  }

  &__course-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $spacing-4;
  }

  &__course-title {
    font-family: $font-family-heading;
    font-size: $font-size-3xl;
    line-height: $line-height-tight;
    color: $color-gray-900;
  }

  &__course-desc {
    margin-top: $spacing-3;
    font-size: $font-size-base;
    line-height: $line-height-normal;
    color: $color-gray-600;
    max-width: 60ch;
  }

  &__course-meta {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-5;
    margin-top: $spacing-6;
  }

  &__meta-item {
    display: inline-flex;
    align-items: center;
    gap: $spacing-2;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-700;

    :deep(.app-icon) { color: $color-info; }
  }

  &__modules {
    list-style: none;
    margin: 0;
    padding: $spacing-4;
    display: flex;
    flex-direction: column;
    gap: $spacing-2;
  }

  &__module {
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    overflow: hidden;
    transition: border-color $transition-fast;

    &[open] {
      border-color: $color-info;

      .formations__module-chevron { transform: rotate(180deg); }
      .formations__module-num { background: $color-info; }
    }
  }

  &__module-summary {
    display: flex;
    align-items: center;
    gap: $spacing-4;
    padding: $spacing-4 $spacing-5;
    cursor: pointer;
    list-style: none;
    user-select: none;

    &::-webkit-details-marker { display: none; }

    &:hover { background: $color-gray-50; }
  }

  &__module-num {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: $color-accent;
    color: $color-white;
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    transition: background $transition-fast;
  }

  &__module-title {
    flex-grow: 1;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    line-height: $line-height-snug;
    color: $color-gray-900;
  }

  &__module-chevron {
    flex-shrink: 0;
    color: $color-gray-400;
    transition: transform $transition-fast;
  }

  &__module-desc {
    margin: 0;
    padding: 0 $spacing-5 $spacing-5 calc(#{$spacing-5} + 28px + #{$spacing-4});
    font-size: $font-size-sm;
    line-height: $line-height-normal;
    color: $color-gray-600;
  }

  &__why-grid {
    margin-top: $spacing-10;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: $spacing-6;
  }

  &__why-title {
    font-size: $font-size-lg;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
    margin-bottom: $spacing-2;
  }

  &__why-desc {
    font-size: $font-size-sm;
    line-height: $line-height-normal;
    color: $color-gray-600;
  }

  &__final {
    text-align: center;
    background: $color-gray-50;
    border: 1px solid $color-gray-200;
    border-radius: $radius-2xl;
    padding: $spacing-12 $spacing-6;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: $spacing-4;
  }

  &__final-title {
    font-family: $font-family-heading;
    font-size: $font-size-2xl;
    color: $color-gray-900;
  }

  &__final-desc {
    font-size: $font-size-base;
    line-height: $line-height-normal;
    color: $color-gray-600;
    max-width: 50ch;
  }
}

@media (max-width: 640px) {
  .formations__title { font-size: $font-size-4xl; }
}
</style>
