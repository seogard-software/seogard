<template>
  <article class="fiche" :data-rule-id="rule.id">
    <!-- 1. Fil d'Ariane -->
    <nav class="fiche__crumb" :aria-label="$t('docs.fiche.crumbAria')">
      <NuxtLink :to="localePath({ name: 'docs-rules' })">{{ $t('docs.fiche.crumbRules') }}</NuxtLink>
      <span aria-hidden="true">›</span>
      <span class="fiche__crumb-current">{{ label }}</span>
    </nav>

    <!-- 2. H1 -->
    <h1 class="fiche__h1">{{ h1 }}</h1>

    <!-- 3. Verdict citable « En bref » (AVANT les badges) -->
    <div class="fiche__tldr">
      <p class="fiche__tldr-k">{{ $t('docs.fiche.inBrief') }}</p>
      <p class="fiche__tldr-p">{{ knowledge.tldr }}</p>
    </div>

    <!-- 4. Badges -->
    <div class="fiche__badges">
      <AppBadge :variant="severityVariant">{{ severityLabel }}</AppBadge>
      <AppBadge variant="neutral">{{ priorityLabel }}</AppBadge>
    </div>

    <!-- 5. De quoi s'agit-il ? (constat) -->
    <h2 class="fiche__h2">{{ $t('docs.fiche.definitionHeading') }}</h2>
    <p class="fiche__p">{{ knowledge.constat }}</p>

    <!-- 6. Pourquoi c'est un problème (pourquoi) -->
    <h2 class="fiche__h2">{{ $t('docs.fiche.whyHeading') }}</h2>
    <p class="fiche__p">{{ knowledge.pourquoi }}</p>

    <!-- 7. Quand ce n'est PAS un problème -->
    <section v-if="knowledge.whenNotAProblem?.length" class="fiche__notprob">
      <h2 class="fiche__notprob-h">{{ $t('docs.fiche.notProblemHeading') }}</h2>
      <ul class="fiche__list">
        <li v-for="(item, i) in knowledge.whenNotAProblem" :key="i">{{ item }}</li>
      </ul>
    </section>

    <!-- 8. Exemple code avant / après -->
    <div v-if="knowledge.exemple" class="fiche__example">
      <div class="fiche__code">
        <div class="fiche__code-tag fiche__code-tag--bad">{{ $t('docs.fiche.exampleBefore') }}</div>
        <pre class="fiche__code-pre"><code>{{ knowledge.exemple.avant }}</code></pre>
      </div>
      <div v-if="knowledge.exemple.apres" class="fiche__code">
        <div class="fiche__code-tag fiche__code-tag--ok">{{ $t('docs.fiche.exampleAfter') }}</div>
        <pre class="fiche__code-pre"><code>{{ knowledge.exemple.apres }}</code></pre>
      </div>
      <p v-if="knowledge.exemple.note" class="fiche__code-note">{{ knowledge.exemple.note }}</p>
    </div>

    <!-- 9. Comment corriger (ol) -->
    <h2 class="fiche__h2">{{ $t('docs.fiche.fixHeading') }}</h2>
    <ol v-if="knowledge.actionSteps?.length" class="fiche__steps">
      <li v-for="(step, i) in knowledge.actionSteps" :key="i">{{ step }}</li>
    </ol>
    <p v-else class="fiche__p">{{ knowledge.action }}</p>

    <!-- 10. Conversion ① — CTA inline (point le plus fort) -->
    <RuleScanCta :hook="knowledge.scanHook ?? $t('docs.fiche.scanFallback')" :target="ctaTarget" />

    <!-- 11. Ce que vous récupérez (gain) -->
    <h2 class="fiche__h2">{{ $t('docs.fiche.gainHeading') }}</h2>
    <p class="fiche__p">{{ knowledge.gain }}</p>

    <!-- 12. Signal Seogard (différenciateur produit) -->
    <aside class="fiche__signal">
      <span aria-hidden="true">◈</span>
      <span><strong>{{ $t('docs.fiche.signalLabel') }}</strong> {{ $t('docs.fiche.signalText') }}</span>
    </aside>

    <!-- 13. FAQ (h3, PAS de FAQPage schema) -->
    <section v-if="knowledge.faq?.length" class="fiche__faq">
      <h2 class="fiche__h2">{{ $t('docs.fiche.faqHeading') }}</h2>
      <div v-for="(item, i) in knowledge.faq" :key="i">
        <h3 class="fiche__faq-q">{{ item.q }}</h3>
        <p class="fiche__faq-a">{{ item.a }}</p>
      </div>
    </section>

    <!-- 14. Règles sœurs + cross-link jumelle -->
    <section v-if="sisters.length || twin" class="fiche__sisters">
      <p class="fiche__sisters-h">{{ $t('docs.fiche.sistersHeading') }}</p>
      <div v-if="sisters.length" class="fiche__sisters-grid">
        <NuxtLink v-for="s in sisters" :key="s.id" :to="localePath({ name: 'docs-rules-slug', params: { slug: s.slug } })" class="fiche__sister">
          <span class="fiche__sister-n">
            <span :class="['fiche__dot', `fiche__dot--${s.variant}`]" aria-hidden="true" />
            {{ s.label }}
          </span>
          <span class="fiche__sister-d">{{ s.description }}</span>
        </NuxtLink>
      </div>
      <p v-if="twin" class="fiche__twin">
        {{ $t('docs.fiche.twinIntro') }}
        <NuxtLink :to="localePath({ name: 'docs-rules-slug', params: { slug: twin.slug } })">{{ twin.label }}</NuxtLink>
      </p>
    </section>

    <!-- 15. AuthorCard + dateModified -->
    <AuthorCard />
    <p class="fiche__datemod">{{ $t('docs.fiche.updatedOn', { date: updatedDisplay }) }}</p>

    <!-- Conversion ② — barre sticky bas (mobile-first). Même parcours que la home : ScanBar →
         (modale d'inscription si déconnecté) → /api/scan crée le site + auto-crawl → overview. -->
    <ClientOnly>
      <Transition name="fiche-sticky">
        <div v-if="showSticky" class="fiche__sticky">
          <span class="fiche__sticky-t">{{ $t('docs.fiche.stickyText') }}</span>
          <div class="fiche__sticky-scan">
            <ScanBar size="inline" />
          </div>
        </div>
      </Transition>
    </ClientOnly>
  </article>
</template>

<script setup lang="ts">
import { getRuleKnowledge, getRuleSlug, getRuleIdBySlug } from '~~/shared/utils/rule-knowledge'
import { isRulePublished, getTwinRuleId, getRuleCtaTarget, FICHE_UPDATED_AT } from '~~/shared/utils/rules-list'
import { getRulesCatalog, getPriorityMeta } from '~~/shared/utils/rules-catalog'
import { buildPersonNode } from '~~/shared/utils/author'
import { INTL_LOCALE } from '~~/shared/utils/format'
import { toLocale } from '~~/shared/utils/i18n'

definePageMeta({ layout: 'docs', auth: false })

const { t, locale } = useI18n()
const localePath = useLocalePath()
const setI18nParams = useSetI18nParams()
const route = useRoute()

const loc = computed(() => toLocale(locale.value))
const slug = computed(() => String(route.params.slug ?? ''))

// Résolution slug → ruleId dans la locale de l'URL. Introuvable ou non publiée → 404 SSR.
const ruleId = computed(() => getRuleIdBySlug(slug.value, loc.value))
const ruleRef = computed(() => getRulesCatalog(loc.value).find(r => r.id === ruleId.value) ?? null)
const knowledgeRef = computed(() => (ruleId.value ? getRuleKnowledge(ruleId.value, loc.value) : null))

if (!ruleId.value || !isRulePublished(ruleId.value) || !ruleRef.value || !knowledgeRef.value) {
  throw createError({ statusCode: 404, statusMessage: t('docs.fiche.notFound') })
}

// TS narrowing : garanti non-null après le 404 ci-dessus → exposés non-null au template.
const rule = ruleRef as ComputedRef<NonNullable<typeof ruleRef.value>>
const knowledge = knowledgeRef as ComputedRef<NonNullable<typeof knowledgeRef.value>>

const label = computed(() => rule.value.label)
const h1 = computed(() => knowledge.value.h1 ?? rule.value.label)

// hreflang / switcher : slug traduit par locale (sinon /en garderait le slug FR = 404).
const frSlug = getRuleSlug(ruleId.value!, 'fr')
const enSlug = getRuleSlug(ruleId.value!, 'en')
if (frSlug && enSlug) setI18nParams({ fr: { slug: frSlug }, en: { slug: enSlug } })

// ── Badges ──
const SEVERITY_VARIANT = { critical: 'danger', warning: 'warning', info: 'info' } as const
type SeverityKey = keyof typeof SEVERITY_VARIANT
const severityKey = computed<SeverityKey>(() => {
  const first = rule.value.severity.split('/')[0]
  return (first === 'critical' || first === 'warning' || first === 'info') ? first : 'info'
})
const severityVariant = computed(() => SEVERITY_VARIANT[severityKey.value])
const severityLabel = computed(() => t(`docs.fiche.severity.${severityKey.value}`))
const priorityLabel = computed(() => getPriorityMeta(loc.value)[rule.value.priority]?.label ?? rule.value.priority)

// « Ce scan vérifie … » — cible par famille de règle (jamais le différenciateur SSR/CSR hors sujet).
const ctaTarget = computed(() => t(`docs.fiche.scanTarget.${getRuleCtaTarget(ruleId.value!)}`))

// ── Règles sœurs (même priorité, publiées, hors self et jumelle) ──
const twinId = computed(() => getTwinRuleId(ruleId.value!))
const sisters = computed(() => getRulesCatalog(loc.value)
  .filter(r => r.priority === rule.value.priority && r.id !== ruleId.value && r.id !== twinId.value && isRulePublished(r.id))
  .slice(0, 3)
  .map(r => ({
    id: r.id,
    label: r.label,
    description: r.description,
    slug: getRuleSlug(r.id, loc.value) ?? '',
    variant: (r.severity.split('/')[0] as SeverityKey) in SEVERITY_VARIANT ? SEVERITY_VARIANT[r.severity.split('/')[0] as SeverityKey] : 'info',
  })))

// ── Cross-link jumelle (event ↔ reco) si publiée ──
const twin = computed(() => {
  const id = twinId.value
  if (!id || !isRulePublished(id)) return null
  const r = getRulesCatalog(loc.value).find(x => x.id === id)
  const s = getRuleSlug(id, loc.value)
  return r && s ? { label: r.label, slug: s } : null
})

// ── dateModified ──
const updatedDisplay = computed(() => new Date(FICHE_UPDATED_AT).toLocaleDateString(INTL_LOCALE[loc.value], { year: 'numeric', month: 'long', day: 'numeric' }))

// ── Barre sticky (apparaît après un peu de scroll) ──
const showSticky = ref(false)
function onScroll() { showSticky.value = window.scrollY > 600 }
onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))

// ── SEO + JSON-LD (TechArticle + BreadcrumbList, PAS de FAQPage sur les fiches) ──
const appUrl = useRuntimeConfig().public.appUrl || 'https://seogard.io'
const abs = (name: string): string => `${appUrl}${localePath({ name })}`
const selfUrl = computed(() => `${appUrl}${route.path.replace(/\/+$/, '')}`)
const ogImage = computed(() => `${appUrl}${loc.value === 'en' ? '/og-image-en.png' : '/og-image.png'}`)
const seoTitle = computed(() => knowledge.value.seoTitle ?? rule.value.label)
const metaDescription = computed(() => knowledge.value.metaDescription ?? knowledge.value.tldr ?? rule.value.description)

useHead(() => ({
  title: seoTitle.value,
  titleTemplate: '%s', // seoTitle déjà calibré SERP (~55-60 car) → pas de marque appendée qui tronque
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          'itemListElement': [
            { '@type': 'ListItem', 'position': 1, 'name': t('docs.fiche.crumbHome'), 'item': abs('index') },
            { '@type': 'ListItem', 'position': 2, 'name': t('docs.fiche.crumbRules'), 'item': abs('docs-rules') },
            { '@type': 'ListItem', 'position': 3, 'name': label.value, 'item': selfUrl.value },
          ],
        },
        {
          '@type': 'TechArticle',
          'headline': h1.value,
          'description': metaDescription.value,
          'identifier': rule.value.id,
          'inLanguage': loc.value,
          'datePublished': FICHE_UPDATED_AT,
          'dateModified': FICHE_UPDATED_AT,
          'mainEntityOfPage': selfUrl.value,
          'author': buildPersonNode(appUrl, { jobTitle: t('docs.author.role'), aboutUrl: abs('a-propos') }),
          'publisher': { '@type': 'Organization', 'name': 'Seogard', 'url': appUrl },
        },
      ],
    }),
  }],
}))

useSeoMeta({
  description: () => metaDescription.value,
  ogTitle: () => h1.value,
  ogDescription: () => metaDescription.value,
  ogType: 'article',
  ogUrl: () => selfUrl.value,
  ogImage: () => ogImage.value,
  twitterCard: 'summary_large_image',
  twitterImage: () => ogImage.value,
  robots: 'index, follow',
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.fiche {
  max-width: 720px;

  &__crumb {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-2;
    font-size: $font-size-xs;
    color: $color-gray-400;
    margin-bottom: $spacing-4;

    a { color: $color-gray-500; text-decoration: none; &:hover { color: $color-gray-900; } }
  }

  &__crumb-current { color: $color-gray-900; font-weight: $font-weight-medium; }

  &__h1 {
    font-size: $font-size-3xl;
    font-weight: $font-weight-bold;
    letter-spacing: -0.02em;
    color: $color-gray-900;
    line-height: $line-height-tight;
    text-wrap: balance;
    margin: 0 0 $spacing-4;
  }

  &__tldr {
    margin: 0 0 $spacing-5;
    padding: $spacing-4 $spacing-5;
    background: $color-info-bg;
    border: 1px solid rgba($color-info, 0.2);
    border-radius: $radius-xl;

    &-k {
      font-size: $font-size-xs;
      font-weight: $font-weight-bold;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: $color-info;
      margin: 0 0 $spacing-1;
    }

    &-p { font-size: $font-size-lg; line-height: $line-height-normal; color: $color-gray-900; margin: 0; }
  }

  &__badges { display: flex; flex-wrap: wrap; gap: $spacing-2; margin-bottom: $spacing-8; }

  &__h2 {
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
    letter-spacing: -0.01em;
    color: $color-gray-900;
    margin: $spacing-8 0 $spacing-3;
  }

  &__p { font-size: $font-size-base; line-height: $line-height-normal; color: $color-gray-700; margin: 0 0 $spacing-3; }

  &__list { margin: 0 0 $spacing-3; padding-left: $spacing-5; color: $color-gray-700; line-height: $line-height-normal; }
  &__list li { margin-bottom: $spacing-1; }

  &__notprob {
    margin: $spacing-4 0;
    padding: $spacing-4 $spacing-5;
    border: 1px solid rgba($color-success, 0.3);
    background: $color-success-bg;
    border-radius: $radius-xl;

    &-h { font-size: $font-size-lg; font-weight: $font-weight-semibold; color: $color-gray-900; margin: 0 0 $spacing-2; }
  }

  &__example { margin: $spacing-4 0; display: flex; flex-direction: column; gap: $spacing-2; }

  &__code { border: 1px solid $color-gray-200; border-radius: $radius-lg; overflow: hidden; }

  &__code-tag {
    font-family: $font-family-mono;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    padding: $spacing-2 $spacing-3;

    &--bad { color: $color-danger; background: $color-danger-bg; }
    &--ok { color: $color-success; background: $color-success-bg; }
  }

  &__code-pre {
    margin: 0;
    padding: $spacing-3 $spacing-4;
    overflow-x: auto;
    background: #0e1424;
    color: #e6e9f2;
    font-family: $font-family-mono;
    font-size: $font-size-xs;
    line-height: 1.6;
  }

  &__code-note { font-size: $font-size-sm; color: $color-gray-500; margin: 0; }

  &__steps {
    margin: 0 0 $spacing-3;
    padding-left: $spacing-5;
    color: $color-gray-700;
    line-height: $line-height-normal;

    li { margin-bottom: $spacing-2; }
  }

  &__signal {
    display: flex;
    gap: $spacing-3;
    align-items: flex-start;
    margin: $spacing-6 0;
    padding: $spacing-3 $spacing-4;
    border-left: 3px solid $color-gray-900;
    background: $surface-elevated;
    border-radius: 0 $radius-lg $radius-lg 0;
    font-size: $font-size-sm;
    color: $color-gray-700;
    line-height: $line-height-normal;

    strong { color: $color-gray-900; }
  }

  &__faq-q { font-size: $font-size-base; font-weight: $font-weight-semibold; color: $color-gray-900; margin: $spacing-4 0 $spacing-1; }
  &__faq-a { font-size: $font-size-sm; color: $color-gray-700; line-height: $line-height-normal; margin: 0; }

  &__sisters { margin-top: $spacing-8; }

  &__sisters-h {
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: $color-gray-400;
    margin: 0 0 $spacing-3;
  }

  &__sisters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: $spacing-2;
  }

  &__sister {
    display: block;
    padding: $spacing-3 $spacing-4;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    text-decoration: none;
    color: inherit;

    &:hover { border-color: $color-gray-300; background: $surface-elevated; }
  }

  &__sister-n { display: flex; align-items: center; gap: $spacing-2; font-weight: $font-weight-semibold; font-size: $font-size-sm; color: $color-gray-900; }
  &__sister-d { display: block; color: $color-gray-500; font-size: $font-size-xs; margin-top: 2px; }

  &__dot {
    width: 8px; height: 8px; border-radius: $radius-full; flex: none;
    &--danger { background: $color-danger; }
    &--warning { background: $color-warning; }
    &--info { background: $color-gray-400; }
  }

  &__twin { font-size: $font-size-sm; color: $color-gray-600; margin-top: $spacing-3; a { color: $color-accent; } }

  &__datemod { font-family: $font-family-mono; font-size: $font-size-xs; color: $color-gray-400; margin: $spacing-4 0 0; }

  // ── Barre sticky bas (mobile-first) — héberge un ScanBar (même parcours que la home) ──
  &__sticky {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 60;
    display: flex;
    align-items: center;
    gap: $spacing-4;
    padding: $spacing-3 $spacing-4;
    background: $color-white;
    border-top: 1px solid $color-gray-200;
    box-shadow: 0 -4px 20px rgba(17, 24, 39, 0.08);
  }

  &__sticky-t {
    flex: 1;
    min-width: 0;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-900;
  }

  &__sticky-scan {
    flex: none;
    width: min(480px, 56vw);

    // La sticky reste slim : le consentement est déjà affiché sur le CTA principal de la fiche.
    :deep(.scan-bar__consent) { display: none; }
  }

  @media (max-width: $breakpoint-sm) {
    &__sticky { flex-direction: column; align-items: stretch; gap: $spacing-2; padding: $spacing-3; }
    &__sticky-t { font-size: $font-size-xs; }
    &__sticky-scan { width: 100%; }
  }
}

.fiche-sticky-enter-active, .fiche-sticky-leave-active { transition: transform $transition-base, opacity $transition-base; }
.fiche-sticky-enter-from, .fiche-sticky-leave-to { transform: translateY(100%); opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .fiche-sticky-enter-active, .fiche-sticky-leave-active { transition: none; }
}
</style>
