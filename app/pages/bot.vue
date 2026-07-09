<template>
  <div class="bot-page">
    <div class="bot-page__container">
      <header class="bot-page__header">
        <h1 class="bot-page__title">Seogard-Bot</h1>
        <p class="bot-page__subtitle">{{ $t('landing.bot.header.subtitle') }}</p>
      </header>

      <section class="bot-page__section">
        <h2 class="bot-page__heading">{{ $t('landing.bot.identification.heading') }}</h2>
        <div class="bot-page__info-grid">
          <div class="bot-page__info-card">
            <span class="bot-page__info-label">{{ $t('landing.bot.identification.userAgentLabel') }}</span>
            <code class="bot-page__info-value">Seogard-Bot/1.0 (+https://seogard.io/bot)</code>
          </div>
          <div class="bot-page__info-card">
            <span class="bot-page__info-label">{{ $t('landing.bot.identification.ipLabel') }}</span>
            <code class="bot-page__info-value">142.132.133.166</code>
          </div>
        </div>
        <p class="bot-page__text" v-html="$t('landing.bot.identification.text')" />
      </section>

      <section class="bot-page__section">
        <h2 class="bot-page__heading">{{ $t('landing.bot.whitelisting.heading') }}</h2>
        <p class="bot-page__text">
          {{ $t('landing.bot.whitelisting.intro') }}
        </p>

        <div class="bot-page__guides">
          <details class="bot-page__guide">
            <summary class="bot-page__guide-title">Cloudflare</summary>
            <div class="bot-page__guide-content">
              <h4 class="bot-page__guide-step-title">{{ $t('landing.bot.cloudflare.step1Title') }}</h4>
              <ol class="bot-page__steps">
                <li v-html="$t('landing.bot.cloudflare.li1')" />
                <li>{{ $t('landing.bot.cloudflare.li2') }}</li>
                <li v-html="$t('landing.bot.cloudflare.li3')" />
                <li v-html="$t('landing.bot.cloudflare.li4')" />
                <li v-html="$t('landing.bot.cloudflare.li5')" />
                <li>
                  <span v-html="$t('landing.bot.cloudflare.li6')" />
                  <code class="bot-page__code-block">(ip.src eq 142.132.133.166) or (http.user_agent contains "Seogard-Bot")</code>
                </li>
                <li v-html="$t('landing.bot.cloudflare.li7')" />
                <li>
                  <span v-html="$t('landing.bot.cloudflare.li8')" />
                  <ul>
                    <li>All remaining custom rules</li>
                    <li>All rate limiting rules</li>
                    <li>All managed rules</li>
                    <li>All Super Bot Fight Mode Rules</li>
                  </ul>
                </li>
                <li v-html="$t('landing.bot.cloudflare.li9')" />
                <li v-html="$t('landing.bot.cloudflare.li10')" />
              </ol>
              <p class="bot-page__guide-alt" v-html="$t('landing.bot.cloudflare.step1Alt')" />

              <h4 class="bot-page__guide-step-title">{{ $t('landing.bot.cloudflare.step2Title') }}</h4>
              <p v-html="$t('landing.bot.cloudflare.step2Intro')" />
              <ol class="bot-page__steps">
                <li v-html="$t('landing.bot.cloudflare.step2Li1')" />
                <li v-html="$t('landing.bot.cloudflare.step2Li2')" />
              </ol>
              <p class="bot-page__guide-alt" v-html="$t('landing.bot.cloudflare.step2Alt')" />
            </div>
          </details>

          <details class="bot-page__guide">
            <summary class="bot-page__guide-title">Akamai</summary>
            <div class="bot-page__guide-content">
              <ol class="bot-page__steps">
                <li v-html="$t('landing.bot.akamai.li1')" />
                <li v-html="$t('landing.bot.akamai.li2')" />
                <li v-html="$t('landing.bot.akamai.li3')" />
                <li>{{ $t('landing.bot.akamai.li4') }}</li>
              </ol>
              <p class="bot-page__guide-alt" v-html="$t('landing.bot.akamai.alt')" />
            </div>
          </details>

          <details class="bot-page__guide">
            <summary class="bot-page__guide-title">AWS WAF</summary>
            <div class="bot-page__guide-content">
              <ol class="bot-page__steps">
                <li v-html="$t('landing.bot.aws.li1')" />
                <li v-html="$t('landing.bot.aws.li2')" />
                <li v-html="$t('landing.bot.aws.li3')" />
                <li v-html="$t('landing.bot.aws.li4')" />
              </ol>
            </div>
          </details>

          <details class="bot-page__guide">
            <summary class="bot-page__guide-title">Sucuri</summary>
            <div class="bot-page__guide-content">
              <ol class="bot-page__steps">
                <li v-html="$t('landing.bot.sucuri.li1')" />
                <li v-html="$t('landing.bot.sucuri.li2')" />
                <li v-html="$t('landing.bot.sucuri.li3')" />
                <li>{{ $t('landing.bot.sucuri.li4') }}</li>
              </ol>
            </div>
          </details>

          <details class="bot-page__guide">
            <summary class="bot-page__guide-title">{{ $t('landing.bot.other.title') }}</summary>
            <div class="bot-page__guide-content">
              <p>{{ $t('landing.bot.other.intro') }}</p>
              <div class="bot-page__method">
                <h4>{{ $t('landing.bot.other.method1Title') }}</h4>
                <p v-html="$t('landing.bot.other.method1Text')" />
              </div>
              <div class="bot-page__method">
                <h4>{{ $t('landing.bot.other.method2Title') }}</h4>
                <p v-html="$t('landing.bot.other.method2Text')" />
              </div>
            </div>
          </details>
        </div>
      </section>

      <section id="self-hosted" class="bot-page__section">
        <h2 class="bot-page__heading">{{ $t('landing.bot.selfHosted.heading') }}</h2>
        <p class="bot-page__text" v-html="$t('landing.bot.selfHosted.text')" />
        <div class="bot-page__selfhosted-steps">
          <div class="bot-page__selfhosted-step">
            <span class="bot-page__selfhosted-number">1</span>
            <div>
              <strong>{{ $t('landing.bot.selfHosted.step1Title') }}</strong>
              <code class="bot-page__code-block">curl -s ifconfig.me</code>
            </div>
          </div>
          <div class="bot-page__selfhosted-step">
            <span class="bot-page__selfhosted-number">2</span>
            <div>
              <strong>{{ $t('landing.bot.selfHosted.step2Title') }}</strong>
              <p class="bot-page__selfhosted-detail" v-html="$t('landing.bot.selfHosted.step2Text')" />
            </div>
          </div>
          <div class="bot-page__selfhosted-step">
            <span class="bot-page__selfhosted-number">3</span>
            <div>
              <strong>{{ $t('landing.bot.selfHosted.step3Title') }}</strong>
              <p class="bot-page__selfhosted-detail" v-html="$t('landing.bot.selfHosted.step3Text')" />
            </div>
          </div>
        </div>
      </section>

      <section class="bot-page__section">
        <h2 class="bot-page__heading">{{ $t('landing.bot.help.heading') }}</h2>
        <p class="bot-page__text">
          {{ $t('landing.bot.help.text1') }}
          <a href="mailto:support@seogard.io" class="bot-page__link">support@seogard.io</a>.
          {{ $t('landing.bot.help.text2') }}
        </p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing', auth: false })

const { t } = useI18n()

useHead({
  title: t('seo.bot.title'),
  meta: [
    { name: 'description', content: t('seo.bot.description') },
  ],
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.bot-page {
  padding: 120px $spacing-6 $spacing-16;
  min-height: 100vh;

  &__container {
    max-width: 720px;
    margin: 0 auto;
  }

  &__header {
    margin-bottom: $spacing-12;
  }

  &__title {
    font-size: 36px;
    font-weight: $font-weight-bold;
    color: $color-gray-800;
    margin: 0 0 $spacing-2;
  }

  &__subtitle {
    font-size: $font-size-lg;
    color: $color-gray-500;
    margin: 0;
  }

  &__section {
    margin-bottom: $spacing-12;
  }

  &__heading {
    font-size: $font-size-xl;
    font-weight: $font-weight-semibold;
    color: $color-gray-800;
    margin: 0 0 $spacing-4;
  }

  &__text {
    font-size: $font-size-base;
    color: $color-gray-600;
    line-height: $line-height-normal;
    margin: 0 0 $spacing-4;

    code {
      background: $color-gray-200;
      padding: 2px 6px;
      border-radius: $radius-sm;
      font-size: $font-size-sm;
    }
  }

  &__link {
    color: $color-accent;
    text-decoration: none;
    font-weight: $font-weight-medium;

    &:hover {
      text-decoration: underline;
    }
  }

  &__info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $spacing-4;
    margin-bottom: $spacing-6;
  }

  &__info-card {
    background: $surface-card;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    padding: $spacing-4 $spacing-5;
  }

  &__info-label {
    display: block;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    color: $color-gray-500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: $spacing-2;
  }

  &__info-value {
    display: block;
    font-size: $font-size-sm;
    color: $color-gray-800;
    background: $color-gray-200;
    padding: $spacing-2 $spacing-3;
    border-radius: $radius-sm;
    word-break: break-all;
  }

  // --- Guides ---
  &__guides {
    display: flex;
    flex-direction: column;
    gap: $spacing-3;
  }

  &__guide {
    background: $surface-card;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    overflow: hidden;

    &[open] {
      border-color: rgba($color-accent, 0.3);
    }
  }

  &__guide-title {
    padding: $spacing-4 $spacing-5;
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $color-gray-800;
    cursor: pointer;
    list-style: none;
    display: flex;
    align-items: center;
    justify-content: space-between;

    &::after {
      content: '+';
      font-size: $font-size-lg;
      color: $color-gray-400;
      transition: transform $transition-fast;
    }

    [open] > &::after {
      content: '-';
    }

    &:hover {
      background: rgba($color-gray-200, 0.5);
    }

    &::-webkit-details-marker {
      display: none;
    }
  }

  &__guide-content {
    padding: 0 $spacing-5 $spacing-5;
    font-size: $font-size-sm;
    color: $color-gray-600;
    line-height: $line-height-normal;

    code {
      background: $color-gray-200;
      padding: 2px 6px;
      border-radius: $radius-sm;
      font-size: $font-size-xs;
    }
  }

  &__guide-alt {
    margin-top: $spacing-4;
    padding: $spacing-3 $spacing-4;
    background: rgba($color-accent, 0.05);
    border-left: 3px solid $color-accent;
    border-radius: 0 $radius-sm $radius-sm 0;
    font-size: $font-size-sm;
    color: $color-gray-600;
  }

  &__steps {
    margin: $spacing-3 0;
    padding-left: $spacing-6;

    li {
      margin-bottom: $spacing-2;
    }

    ul {
      margin-top: $spacing-2;
      padding-left: $spacing-5;
    }
  }

  &__guide-step-title {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-800;
    margin: $spacing-5 0 $spacing-2;

    &:first-child {
      margin-top: 0;
    }
  }

  &__code-block {
    display: block;
    margin-top: $spacing-2;
    padding: $spacing-3 $spacing-4;
    background: $color-gray-100;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    font-size: $font-size-xs;
    word-break: break-all;
    line-height: $line-height-normal;
  }

  &__selfhosted-steps {
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
    margin-top: $spacing-4;
  }

  &__selfhosted-step {
    display: flex;
    align-items: flex-start;
    gap: $spacing-4;
    padding: $spacing-4 $spacing-5;
    background: $surface-card;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    font-size: $font-size-sm;
    color: $color-gray-600;
    line-height: $line-height-normal;

    code {
      background: $color-gray-200;
      padding: 2px 6px;
      border-radius: $radius-sm;
      font-size: $font-size-xs;
    }
  }

  &__selfhosted-number {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: $color-accent;
    color: white;
    border-radius: 50%;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
  }

  &__selfhosted-detail {
    margin: $spacing-1 0 0;
  }

  &__method {
    margin-top: $spacing-4;
    padding: $spacing-3 $spacing-4;
    background: rgba($color-gray-200, 0.5);
    border-radius: $radius-sm;

    h4 {
      font-size: $font-size-sm;
      font-weight: $font-weight-semibold;
      color: $color-gray-800;
      margin: 0 0 $spacing-1;
    }

    p {
      margin: 0;
    }
  }

  // --- Responsive ---
  @media (max-width: $breakpoint-sm) {
    padding-top: 100px;

    &__info-grid {
      grid-template-columns: 1fr;
    }

    &__title {
      font-size: 28px;
    }
  }
}
</style>
