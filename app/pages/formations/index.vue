<template>
  <div class="formations">
    <!-- Hero -->
    <section class="formations__hero">
      <span class="formations__badge">
        <AppIcon name="check" size="sm" />
        Formations gratuites · SEO technique &amp; GEO
      </span>
      <h1 class="formations__title">
        Formations SEO technique &amp; GEO : rendez votre site visible par Google <em>et</em> par l'IA
      </h1>
      <p class="formations__subtitle">
        Des formations courtes et concrètes pour comprendre ce que Google et les moteurs IA
        (ChatGPT, Perplexity, Google AI Overviews) voient vraiment de votre site — et corriger les
        régressions SEO avant qu'elles ne vous coûtent du trafic. Accessibles même sans être
        développeur : vous vérifiez avec nos outils gratuits, vous corrigez avec l'export IA.
      </p>
      <div class="formations__cta">
        <NuxtLink to="/register" class="formations__btn formations__btn--primary">
          Commencer l'essai gratuit
        </NuxtLink>
        <NuxtLink to="/scanner" class="formations__btn formations__btn--ghost">
          Scanner mon site gratuitement
        </NuxtLink>
      </div>
    </section>

    <!-- Positionnement -->
    <section class="formations__intro">
      <p>
        Le SEO ne se joue plus seulement sur Google. Les réponses de ChatGPT, Perplexity et des
        AI Overviews lisent le <strong>HTML brut</strong> de vos pages — pas le rendu JavaScript que
        vous voyez dans votre navigateur. Un site moderne (SSR/CSR mal configuré, données
        structurées injectées en JavaScript, <code>robots.txt</code> qui bloque les crawlers IA)
        peut être invisible sans que personne ne s'en aperçoive. Ces formations vous apprennent à
        le détecter et à le réparer.
      </p>
    </section>

    <!-- La formation -->
    <section class="formations__program">
      <h2 class="formations__section-title">La première formation</h2>
      <p class="formations__section-intro">
        Une formation complète en {{ lessons.length }} modules, publiés un par un. Chaque module =
        un problème concret, une démonstration sur un vrai site, et la méthode pour vérifier puis
        corriger le vôtre. Gratuite — les premiers modules arrivent bientôt.
      </p>

      <article class="formations__course">
        <div class="formations__course-banner">
          <div class="formations__course-head">
            <span class="formations__tag formations__tag--geo">GEO / IA</span>
            <span class="formations__soon">Bientôt</span>
          </div>
          <h3 class="formations__course-title">Ton site et l'IA</h3>
          <p class="formations__course-desc">
            Rendez votre site visible et citable par ChatGPT, Perplexity et les AI Overviews de
            Google. Du diagnostic (« l'IA voit-elle mon site ? ») jusqu'à la correction — sans
            jargon, sans savoir coder.
          </p>
          <div class="formations__course-meta">
            <span class="formations__meta-item">
              <AppIcon name="pages" size="sm" /> {{ lessons.length }} modules
            </span>
            <span class="formations__meta-item">
              <AppIcon name="check" size="sm" /> Gratuit
            </span>
            <span class="formations__meta-item">
              <AppIcon name="chart-bar" size="sm" /> Débutant → Avancé
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
      <h2 class="formations__section-title">Pourquoi ces formations sont différentes</h2>
      <div class="formations__why-grid">
        <div v-for="item in benefits" :key="item.title" class="formations__why-item">
          <h3 class="formations__why-title">{{ item.title }}</h3>
          <p class="formations__why-desc">{{ item.desc }}</p>
        </div>
      </div>
    </section>

    <!-- CTA final -->
    <section class="formations__final">
      <h2 class="formations__final-title">Vérifiez votre site pendant que vous apprenez</h2>
      <p class="formations__final-desc">
        Seogard surveille en continu les régressions SEO et GEO de votre site et vous alerte avant
        Google. Essai 14 jours, sans carte bancaire.
      </p>
      <NuxtLink to="/register" class="formations__btn formations__btn--primary">
        Démarrer gratuitement
      </NuxtLink>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing', auth: false })

interface Lesson {
  title: string
  desc: string
}

// Modules de la formation « Ton site et l'IA » = la série vidéo (pilier + 8 épisodes) planifiée
// dans .claude/youtube/cluster-ia.md. Publiés un par un, tous à venir. Aucun module inventé.
const lessons: Lesson[] = [
  { title: 'Votre site est invisible pour l\'IA : le test en 30 secondes', desc: 'On commence par le diagnostic : vérifiez en 30 secondes ce que l\'IA lit réellement de vos pages (le HTML brut, pas votre navigateur).' },
  { title: 'Les 5 raisons pour lesquelles l\'IA ne vous cite pas', desc: 'La vue d\'ensemble : les 5 causes qui rendent un site invisible pour les IA, et par où commencer.' },
  { title: 'Vous bloquez ChatGPT et Perplexity sans le savoir (1 ligne dans robots.txt)', desc: 'La nuance entre entraînement et citation, et la ligne de robots.txt qui vous rend invisible dans les réponses IA.' },
  { title: 'llms.txt : le fichier qui vous fait citer… ou du pur bullshit ?', desc: 'Le démontage honnête d\'un fichier à la mode : ce qu\'il fait, ce qu\'il ne fait pas, et quand s\'en occuper.' },
  { title: 'L\'IA cite vos concurrents, pas vous : la vraie raison (auteur, date, sources)', desc: 'Les signaux de citation qui décident qui l\'IA met en avant — et comment les ajouter à vos pages.' },
  { title: 'Écrivez votre article pour que l\'IA le recopie : les 30 premiers % décident tout', desc: 'La structure citable : réponse dès l\'intro, titres clairs, questions/réponses. Ce qui fait recopier votre contenu.' },
  { title: 'Où trouver les questions qui vous font citer par l\'IA (sans les inventer)', desc: 'Où récolter les vraies questions de votre audience pour des FAQ que l\'IA cite — sans en inventer.' },
  { title: 'Votre JavaScript cache vos données structurées à l\'IA (et vos liens à Google)', desc: 'Pourquoi un JSON-LD ou des liens injectés en JavaScript restent invisibles, et comment les servir dès le HTML brut.' },
  { title: 'Refonte ou mise à jour : le jour où vous devenez invisible pour l\'IA sans rien voir', desc: 'Comment un déploiement casse silencieusement votre visibilité IA, et comment le détecter avant qu\'il soit trop tard.' },
]

const benefits = [
  { title: 'Accessible à tous', desc: 'Même sans coder. Vous vérifiez avec nos outils gratuits et vous corrigez en collant l\'export IA de Seogard dans ChatGPT, Claude ou l\'assistant de votre CMS.' },
  { title: 'Sur de vrais sites', desc: 'Pas de théorie : on ouvre de vraies pages, on prouve le défaut à l\'écran, on montre le correctif. Vous repartez avec une méthode reproductible.' },
  { title: 'SEO + GEO réunis', desc: 'La visibilité Google et la visibilité dans les réponses IA (ChatGPT, Perplexity, AI Overviews) traitées ensemble, parce que les deux dépendent de votre HTML brut.' },
  { title: 'Honnête, sans promesse magique', desc: 'Aucune fausse promesse de trafic ou de ranking. On vous donne les mécaniques réelles ; vous décidez quoi prioriser.' },
]

useSeoMeta({
  title: 'Formations SEO technique & GEO gratuites — visibilité Google et IA',
  description: 'Apprenez le SEO technique et le GEO (visibilité IA) : SSR vs CSR, crawlers ChatGPT/Perplexity, llms.txt, données structurées, régressions SEO et gate CI/CD. Formations gratuites, accessibles même sans coder.',
  ogTitle: 'Formations SEO technique & GEO — rendez votre site visible par Google et par l\'IA',
  ogDescription: 'Formations gratuites SEO/GEO : ce que Google et l\'IA voient de votre site, et comment corriger les régressions avant qu\'elles coûtent du trafic.',
  ogType: 'website',
  ogUrl: 'https://seogard.io/formations',
  ogImage: 'https://seogard.io/og-image.png',
  twitterCard: 'summary_large_image',
  twitterImage: 'https://seogard.io/og-image.png',
  twitterTitle: 'Formations SEO technique & GEO gratuites',
  twitterDescription: 'SSR/CSR, crawlers IA, llms.txt, données structurées, régressions SEO. Gratuit, même sans coder.',
  robots: 'index, follow',
})

useHead({
  link: [{ rel: 'canonical', href: 'https://seogard.io/formations' }],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Course',
      'name': 'Ton site et l\'IA',
      'description': 'Formation gratuite en modules pour rendre son site visible et citable par ChatGPT, Perplexity et les AI Overviews de Google.',
      'provider': { '@type': 'Organization', 'name': 'Seogard', 'url': 'https://seogard.io' },
      'inLanguage': 'fr',
      'isAccessibleForFree': true,
      'syllabusSections': lessons.map((l, i) => ({
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
