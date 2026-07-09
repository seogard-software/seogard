<template>
  <div class="zone-report">
    <DashboardHeader :title="$t('dashboard.report.title', { zone: history?.zoneName ?? $t('dashboard.report.zoneFallback') })" />

    <!-- Échec de chargement -->
    <AppCard v-if="error" class="zone-report__empty">
      <AppIcon name="alert-triangle" size="lg" />
      <h3>{{ $t('dashboard.report.errorTitle') }}</h3>
      <p>{{ $t('dashboard.report.errorText') }}</p>
      <AppButton variant="secondary" size="sm" @click="refresh()">{{ $t('dashboard.report.retry') }}</AppButton>
    </AppCard>

    <!-- Zone jamais crawlée -->
    <AppCard v-else-if="timeline.length === 0" class="zone-report__empty">
      <AppIcon name="radar" size="lg" />
      <h3>{{ $t('dashboard.report.emptyTitle') }}</h3>
      <p>{{ $t('dashboard.report.emptyText') }}</p>
    </AppCard>

    <template v-else>
      <!-- Dernier crawl : downloads visibles directement -->
      <AppCard v-if="latest" class="zone-report__latest">
        <div class="zone-report__latest-head">
          <span class="zone-report__dot" :class="`zone-report__dot--${latest.verdict}`" />
          <div>
            <p class="zone-report__latest-title">{{ $t('dashboard.report.latestTitle', { date: formatDate(latest.completedAt) }) }}</p>
            <p class="zone-report__latest-meta">
              {{ verdictLabel(latest.verdict) }} · {{ $t('dashboard.report.regressionCount', { count: latest.regressions.toLocaleString(numberLocale) }, latest.regressions) }}
              · {{ $t('dashboard.report.fixedCount', { count: latest.fixed.toLocaleString(numberLocale) }, latest.fixed) }}
              · {{ $t('dashboard.report.pagesCount', { count: latest.pagesScanned.toLocaleString(numberLocale) }) }}
            </p>
          </div>
        </div>
        <div class="zone-report__dl">
          <a :href="pdfUrl(latest.crawlId)" class="zone-report__dl-link zone-report__dl-link--pdf">
            <AppIcon name="download" size="sm" /> PDF <span>{{ $t('dashboard.report.pdfHint') }}</span>
          </a>
          <a :href="mdUrl(latest.crawlId)" class="zone-report__dl-link zone-report__dl-link--md">
            <AppIcon name="download" size="sm" /> Markdown <span>{{ $t('dashboard.report.mdHint') }}</span>
          </a>
        </div>
      </AppCard>

      <!-- Crawls précédents : cliquer pour révéler les downloads de ce crawl -->
      <section v-if="previous.length" class="zone-report__history">
        <h2 class="zone-report__history-title">{{ $t('dashboard.report.historyTitle') }}</h2>
        <details v-for="entry in previous" :key="entry.crawlId" class="zone-report__crawl">
          <summary class="zone-report__crawl-row">
            <span class="zone-report__dot" :class="`zone-report__dot--${entry.verdict}`" />
            <span class="zone-report__crawl-date">{{ formatDate(entry.completedAt) }}</span>
            <span class="zone-report__crawl-verdict">{{ verdictLabel(entry.verdict) }}</span>
            <span class="zone-report__crawl-counts">
              {{ $t('dashboard.report.crawlCounts', { regressions: entry.regressions.toLocaleString(numberLocale), fixed: entry.fixed.toLocaleString(numberLocale), pages: entry.pagesScanned.toLocaleString(numberLocale) }) }}
            </span>
            <AppIcon name="chevron-down" size="sm" class="zone-report__crawl-chevron" />
          </summary>
          <div class="zone-report__dl zone-report__dl--inset">
            <a :href="pdfUrl(entry.crawlId)" class="zone-report__dl-link zone-report__dl-link--pdf">
              <AppIcon name="download" size="sm" /> PDF
            </a>
            <a :href="mdUrl(entry.crawlId)" class="zone-report__dl-link zone-report__dl-link--md">
              <AppIcon name="download" size="sm" /> Markdown
            </a>
          </div>
        </details>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CrawlActivityVerdict, ZoneCrawlHistory } from '~~/shared/types/zone-report'
import { crawlReportDownloadPath } from '~~/shared/utils/report-links'
defineI18nRoute(false)

definePageMeta({ layout: 'default' })
useSeoMeta({ robots: 'noindex, nofollow' })

const route = useRoute()
const siteId = computed(() => route.params.id as string)
const zoneId = computed(() => route.params.zoneId as string)

const { t, locale } = useI18n()
const numberLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'fr-FR'))

const { data: history, error, refresh } = await useFetch<ZoneCrawlHistory>(`/api/sites/${siteId.value}/zones/${zoneId.value}/report`)

useHead({ title: computed(() => t('dashboard.report.tabTitle', { zone: history.value?.zoneName ?? t('dashboard.report.zoneFallback') })) })

const timeline = computed(() => history.value?.timeline ?? [])
const latest = computed(() => timeline.value[0])
const previous = computed(() => timeline.value.slice(1))

function mdUrl(crawlId: string) { return crawlReportDownloadPath(siteId.value, zoneId.value, crawlId, 'md') }
function pdfUrl(crawlId: string) { return crawlReportDownloadPath(siteId.value, zoneId.value, crawlId, 'pdf') }

function verdictLabel(v: CrawlActivityVerdict) { return t(`dashboard.report.verdict.${v}`) }

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(numberLocale.value, { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.zone-report {
  &__empty {
    padding: $spacing-12;
    text-align: center;
    color: $color-gray-500;

    h3 { margin: $spacing-4 0 $spacing-2; color: $color-gray-800; }
  }

  // Pastille de verdict d'activité
  &__dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: $radius-full;
    flex-shrink: 0;
    background: $color-gray-300;

    &--critical { background: $color-danger; }
    &--warning { background: $color-warning; }
    &--info { background: $color-gray-400; }
    &--stable { background: $color-success; }
  }

  // ── Dernier crawl ──
  &__latest {
    padding: $spacing-5;
    margin-bottom: $spacing-6;
    display: flex;
    flex-direction: column;
    gap: $spacing-4;
  }

  &__latest-head {
    display: flex;
    align-items: center;
    gap: $spacing-3;
  }

  &__latest-title {
    font-size: $font-size-base;
    font-weight: $font-weight-semibold;
    color: $color-gray-900;
  }

  &__latest-meta {
    font-size: $font-size-sm;
    color: $color-gray-500;
    margin-top: 2px;
  }

  // ── Liens de téléchargement (sobres, pas de gros boutons) ──
  &__dl {
    display: flex;
    gap: $spacing-3;
    flex-wrap: wrap;

    &--inset {
      padding: 0 $spacing-4 $spacing-4 calc(#{$spacing-4} + 18px);
    }
  }

  &__dl-link {
    display: inline-flex;
    align-items: center;
    gap: $spacing-2;
    padding: $spacing-2 $spacing-3;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-800;
    text-decoration: none;
    transition: border-color $transition-fast, background $transition-fast;

    span {
      font-weight: $font-weight-normal;
      font-size: $font-size-xs;
      color: $color-gray-400;
    }

    &:hover { border-color: $color-gray-400; text-decoration: none; }

    &--md:hover { border-color: $color-info; color: $color-info; }
  }

  // ── Historique ──
  &__history-title {
    font-size: $font-size-lg;
    margin-bottom: $spacing-3;
  }

  &__crawl {
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    margin-bottom: $spacing-2;
    background: $surface-card;
  }

  &__crawl-row {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    padding: $spacing-3 $spacing-4;
    cursor: pointer;
    list-style: none;

    &::-webkit-details-marker { display: none; }
  }

  &__crawl-date {
    font-weight: $font-weight-medium;
    color: $color-gray-900;
    font-size: $font-size-sm;
    white-space: nowrap;
  }

  &__crawl-verdict {
    font-size: $font-size-xs;
    color: $color-gray-500;
    white-space: nowrap;
  }

  &__crawl-counts {
    flex: 1;
    min-width: 0;
    font-size: $font-size-xs;
    color: $color-gray-500;
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__crawl-chevron {
    flex-shrink: 0;
    color: $color-gray-400;
    transition: transform $transition-fast;

    .zone-report__crawl[open] & { transform: rotate(180deg); }
  }
}
</style>
