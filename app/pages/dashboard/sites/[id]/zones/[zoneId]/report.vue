<template>
  <div class="zone-report">
    <DashboardHeader :title="`Rapport — ${history?.zoneName ?? 'Zone'}`" />

    <!-- Échec de chargement -->
    <AppCard v-if="error" class="zone-report__empty">
      <AppIcon name="alert-triangle" size="lg" />
      <h3>Impossible de charger l'historique</h3>
      <p>Réessayez dans un instant. Si le problème persiste, vérifiez vos droits sur cette zone.</p>
      <AppButton variant="secondary" size="sm" @click="refresh()">Réessayer</AppButton>
    </AppCard>

    <!-- Zone jamais crawlée -->
    <AppCard v-else-if="timeline.length === 0" class="zone-report__empty">
      <AppIcon name="radar" size="lg" />
      <h3>Pas encore de rapport</h3>
      <p>Le rapport de cette zone apparaîtra ici dès le premier crawl terminé.</p>
    </AppCard>

    <template v-else>
      <!-- Dernier crawl : downloads visibles directement -->
      <AppCard v-if="latest" class="zone-report__latest">
        <div class="zone-report__latest-head">
          <span class="zone-report__dot" :class="`zone-report__dot--${latest.verdict}`" />
          <div>
            <p class="zone-report__latest-title">Dernier crawl — {{ formatDate(latest.completedAt) }}</p>
            <p class="zone-report__latest-meta">
              {{ verdictLabel(latest.verdict) }} · {{ latest.regressions.toLocaleString('fr-FR') }} régression{{ latest.regressions > 1 ? 's' : '' }}
              · {{ latest.fixed.toLocaleString('fr-FR') }} réparée{{ latest.fixed > 1 ? 's' : '' }}
              · {{ latest.pagesScanned.toLocaleString('fr-FR') }} pages
            </p>
          </div>
        </div>
        <div class="zone-report__dl">
          <a :href="pdfUrl(latest.crawlId)" class="zone-report__dl-link zone-report__dl-link--pdf">
            <AppIcon name="download" size="sm" /> PDF <span>synthèse métier</span>
          </a>
          <a :href="mdUrl(latest.crawlId)" class="zone-report__dl-link zone-report__dl-link--md">
            <AppIcon name="download" size="sm" /> Markdown <span>exhaustif, pour IA</span>
          </a>
        </div>
      </AppCard>

      <!-- Crawls précédents : cliquer pour révéler les downloads de ce crawl -->
      <section v-if="previous.length" class="zone-report__history">
        <h2 class="zone-report__history-title">Crawls précédents</h2>
        <details v-for="entry in previous" :key="entry.crawlId" class="zone-report__crawl">
          <summary class="zone-report__crawl-row">
            <span class="zone-report__dot" :class="`zone-report__dot--${entry.verdict}`" />
            <span class="zone-report__crawl-date">{{ formatDate(entry.completedAt) }}</span>
            <span class="zone-report__crawl-verdict">{{ verdictLabel(entry.verdict) }}</span>
            <span class="zone-report__crawl-counts">
              {{ entry.regressions.toLocaleString('fr-FR') }} régr. · {{ entry.fixed.toLocaleString('fr-FR') }} rép. · {{ entry.pagesScanned.toLocaleString('fr-FR') }} pages
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

definePageMeta({ layout: 'default' })
useSeoMeta({ robots: 'noindex, nofollow' })

const route = useRoute()
const siteId = computed(() => route.params.id as string)
const zoneId = computed(() => route.params.zoneId as string)

const { data: history, error, refresh } = await useFetch<ZoneCrawlHistory>(`/api/sites/${siteId.value}/zones/${zoneId.value}/report`)

useHead({ title: computed(() => `Rapport — ${history.value?.zoneName ?? 'Zone'}`) })

const timeline = computed(() => history.value?.timeline ?? [])
const latest = computed(() => timeline.value[0])
const previous = computed(() => timeline.value.slice(1))

function mdUrl(crawlId: string) { return crawlReportDownloadPath(siteId.value, zoneId.value, crawlId, 'md') }
function pdfUrl(crawlId: string) { return crawlReportDownloadPath(siteId.value, zoneId.value, crawlId, 'pdf') }

const VERDICT_LABELS: Record<CrawlActivityVerdict, string> = {
  critical: 'Régressions critiques',
  warning: 'Régressions à surveiller',
  info: 'Régressions mineures',
  stable: 'Stable',
}
function verdictLabel(v: CrawlActivityVerdict) { return VERDICT_LABELS[v] }

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
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
