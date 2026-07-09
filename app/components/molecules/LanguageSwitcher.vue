<template>
  <div
    v-if="items.length"
    class="lang"
    :class="[`lang--${variant}`, { 'lang--single': items.length === 1 }]"
    :data-active="locale"
    role="group"
    :aria-label="t('common.nav.switchLanguage')"
  >
    <template v-for="item in items" :key="item.code">
      <!-- Langue courante : pas un lien -->
      <span v-if="item.active" class="lang__slot lang__slot--active" aria-current="true">
        <span class="lang__flag" :class="item.flagClass" aria-hidden="true" />
        <span class="lang__code">{{ item.code.toUpperCase() }}</span>
      </span>
      <!-- Autre langue : vrai lien vers le slug traduit (SSR, crawlable) -->
      <NuxtLink
        v-else
        :to="item.to"
        :hreflang="item.code"
        :aria-label="item.name"
        class="lang__slot"
      >
        <span class="lang__flag" :class="item.flagClass" aria-hidden="true" />
        <span class="lang__code">{{ item.code.toUpperCase() }}</span>
      </NuxtLink>
    </template>
    <span v-if="items.length > 1" class="lang__glass" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
// « Prisme » — sélecteur de langue. Bascule via useSwitchLocalePath() → toujours le slug traduit
// de la page courante (/fr/tarifs → /en/pricing). Chaque autre langue est un vrai <NuxtLink>
// (SSR, crawlable, marche sans JS). La langue active est dérivée de `locale`, aucun état client.
import type { Locale } from '~~/shared/utils/i18n'
import { buildLanguageItems } from '~~/shared/utils/language-switcher'

const { variant = 'desktop' } = defineProps<{ variant?: 'desktop' | 'mobile' }>()

const { locale, locales, t } = useI18n()
const switchLocalePath = useSwitchLocalePath()

const FLAG_CLASS: Record<string, string> = { fr: 'lang__flag--fr', en: 'lang__flag--gb' }
const NAME_KEY: Record<string, string> = { fr: 'common.nav.langFr', en: 'common.nav.langEn' }

const items = computed(() =>
  buildLanguageItems({
    codes: (locales.value as { code: Locale }[]).map(l => l.code),
    current: locale.value as Locale,
    path: switchLocalePath,
  }).map(item => ({
    ...item,
    name: t(NAME_KEY[item.code] ?? item.code),
    flagClass: FLAG_CLASS[item.code] ?? '',
  })),
)
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

// Instrument optique sombre, cohérent avec le CTA. Fond + spectre = couleurs bespoke (hors palette)
// justifiées : c'est un composant signature, pas un élément d'UI standard.
$prism-bg: #0e1424;
$prism-border: #2a3350;
$prism-code: #eef1ff;

.lang {
  --slot-w: 112px;

  position: relative;
  display: inline-flex;
  align-items: stretch;
  width: var(--slot-w);
  padding: 3px;
  background: $prism-bg;
  border: 1px solid $prism-border;
  border-radius: $radius-full;
  box-shadow: 0 8px 20px rgb(6 10 22 / 42%), inset 0 1px 0 rgb(255 255 255 / 7%);
  -webkit-tap-highlight-color: transparent;

  &--mobile { --slot-w: 136px; }
  &--single { --slot-w: auto; }

  &__slot {
    position: relative;
    z-index: 2;
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-2;
    padding: 6px 0;
    border-radius: $radius-full;
    text-decoration: none;
    opacity: 0.42;
    filter: grayscale(0.75);
    transition: opacity $transition-base, filter $transition-base;

    &--active { opacity: 1; filter: none; }

    &:hover { opacity: 1; filter: none; text-decoration: none; }

    &:focus-visible { outline: 2px solid #7c8cff; outline-offset: 2px; }
  }

  &--mobile &__slot { padding: 9px 0; }

  &__flag {
    width: 14px;
    height: 10px;
    flex: none;
    border-radius: 2px;
    background-size: cover;
    background-position: center;
    box-shadow: 0 0 0 1px rgb(255 255 255 / 30%), 0 1px 2px rgb(0 0 0 / 40%);

    // Drapeau France : tricolore vertical (pas d'emoji → rendu net et « rempli »).
    &--fr { background-image: linear-gradient(90deg, #0055a4 0 33.33%, #fff 33.33% 66.66%, #ef4135 66.66%); }

    // Drapeau UK : Union Jack en SVG inline (data-URI, aucune requête externe).
    &--gb {
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 30'%3E%3CclipPath id='t'%3E%3Cpath d='M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z'/%3E%3C/clipPath%3E%3Cpath d='M0,0 v30 h60 v-30 z' fill='%23012169'/%3E%3Cpath d='M0,0 L60,30 M60,0 L0,30' stroke='%23fff' stroke-width='6'/%3E%3Cpath d='M0,0 L60,30 M60,0 L0,30' clip-path='url(%23t)' stroke='%23C8102E' stroke-width='4'/%3E%3Cpath d='M30,0 v30 M0,15 h60' stroke='%23fff' stroke-width='10'/%3E%3Cpath d='M30,0 v30 M0,15 h60' stroke='%23C8102E' stroke-width='6'/%3E%3C/svg%3E");
    }
  }

  &__code {
    font-family: $font-family-mono;
    font-size: 11px;
    font-weight: $font-weight-bold;
    letter-spacing: 0.05em;
    color: $prism-code;
  }

  // Lame de verre : indicateur qui glisse sur la langue active (au changement de route,
  // le composant vit dans le layout donc il persiste → la transition se joue).
  &__glass {
    position: absolute;
    z-index: 1;
    inset: 3px auto 3px 3px;
    width: calc(50% - 3px);
    border-radius: $radius-full;
    background: linear-gradient(180deg, rgb(255 255 255 / 18%), rgb(255 255 255 / 3%));
    border: 1px solid rgb(255 255 255 / 22%);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 35%), 0 2px 8px rgb(0 0 0 / 25%);
    transition: transform 0.36s cubic-bezier(0.5, 0.05, 0.2, 1);

    // Ligne de réfraction (le « prisme ») sous la langue active.
    &::after {
      content: "";
      position: absolute;
      inset: auto 22% -1px;
      height: 2px;
      border-radius: 2px;
      background: linear-gradient(90deg, #8b5cf6, #22d3ee, #f472b6, #8b5cf6);
      background-size: 200% 100%;
      box-shadow: 0 0 8px rgb(124 140 255 / 60%);
    }
  }

  &[data-active="en"] &__glass { transform: translateX(100%); }
}

@media (prefers-reduced-motion: no-preference) {
  .lang__glass::after { animation: lang-shimmer 3.6s linear infinite; }
}

@keyframes lang-shimmer {
  to { background-position: 200% 0; }
}
</style>
