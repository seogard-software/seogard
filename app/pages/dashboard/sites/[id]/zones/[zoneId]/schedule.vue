<template>
  <div class="zone-schedule">
    <div v-if="!canManage" class="zone-schedule__denied" data-testid="zone-denied">
      <AppIcon name="shield-check" size="sm" />
      <span>{{ $t('dashboard.schedule.denied') }}</span>
    </div>

    <template v-else>
      <DashboardHeader :title="$t('dashboard.schedule.title', { zone: zoneName })" :subtitle="$t('dashboard.schedule.subtitle')" />

      <AppCard :bordered="false" class="zone-schedule__card">
        <!-- Activation -->
        <div class="zone-schedule__section">
          <h3 class="zone-schedule__section-title">{{ $t('dashboard.schedule.activationTitle') }}</h3>
          <p class="zone-schedule__section-desc">
            {{ $t('dashboard.schedule.activationDesc') }}
          </p>

          <label class="zone-schedule__toggle">
            <input
              type="checkbox"
              :checked="form.enabled"
              :disabled="saving"
              @change="onToggleEnabled(($event.target as HTMLInputElement).checked)"
            >
            <span>{{ $t('dashboard.schedule.enableToggle') }}</span>
          </label>
        </div>

        <!-- Frequency -->
        <div :class="['zone-schedule__section', !form.enabled && 'zone-schedule__section--disabled']">
          <h3 class="zone-schedule__section-title">{{ $t('dashboard.schedule.frequencyTitle') }}</h3>

          <div class="zone-schedule__options">
            <button
              v-for="opt in FREQUENCY_OPTIONS"
              :key="opt.value"
              type="button"
              class="zone-schedule__option"
              :class="{ 'zone-schedule__option--active': form.frequency === opt.value }"
              :disabled="!form.enabled || saving"
              @click="setFrequency(opt.value)"
            >
              <span class="zone-schedule__option-label">{{ opt.label }}</span>
              <span class="zone-schedule__option-desc">{{ opt.description }}</span>
            </button>
          </div>
        </div>

        <!-- Quand -->
        <div :class="['zone-schedule__section', !form.enabled && 'zone-schedule__section--disabled']">
          <h3 class="zone-schedule__section-title">{{ $t('dashboard.schedule.whenTitle') }}</h3>

          <div class="zone-schedule__fields">
            <label v-if="form.frequency === 'weekly' || form.frequency === 'biweekly'" class="zone-schedule__field-group">
              <span class="zone-schedule__field-label">{{ $t('dashboard.schedule.dayOfWeekLabel') }}</span>
              <select
                :value="form.dayOfWeek ?? 1"
                :disabled="!form.enabled || saving"
                class="zone-schedule__select"
                @change="setDayOfWeek(Number(($event.target as HTMLSelectElement).value))"
              >
                <option v-for="d in DAY_OF_WEEK_OPTIONS" :key="d.value" :value="d.value">{{ d.label }}</option>
              </select>
            </label>

            <label v-if="form.frequency === 'monthly'" class="zone-schedule__field-group">
              <span class="zone-schedule__field-label">{{ $t('dashboard.schedule.dayOfMonthLabel') }}</span>
              <select
                :value="form.lastDayOfMonth ? 'last' : (form.dayOfMonth ?? 1)"
                :disabled="!form.enabled || saving"
                class="zone-schedule__select"
                @change="setDayOfMonth(($event.target as HTMLSelectElement).value)"
              >
                <option v-for="n in 31" :key="n" :value="n">{{ n }}</option>
                <option value="last">{{ $t('dashboard.schedule.lastDayOfMonth') }}</option>
              </select>
            </label>

            <label class="zone-schedule__field-group">
              <span class="zone-schedule__field-label">{{ $t('dashboard.schedule.hourUtcLabel') }}</span>
              <select
                :value="form.hour"
                :disabled="!form.enabled || saving"
                class="zone-schedule__select"
                @change="setHour(Number(($event.target as HTMLSelectElement).value))"
              >
                <option v-for="h in 24" :key="h - 1" :value="h - 1">{{ String(h - 1).padStart(2, '0') }}:00</option>
              </select>
            </label>
          </div>

          <p class="zone-schedule__hint">
            {{ $t('dashboard.schedule.utcHint') }}
          </p>
        </div>

        <!-- Status -->
        <div class="zone-schedule__section">
          <h3 class="zone-schedule__section-title">{{ $t('dashboard.schedule.statusTitle') }}</h3>
          <div class="zone-schedule__status">
            <div class="zone-schedule__status-row">
              <AppIcon name="clock" size="sm" />
              <span class="zone-schedule__status-label">{{ $t('dashboard.schedule.nextCrawl') }}</span>
              <span class="zone-schedule__status-value">{{ nextLabel }}</span>
            </div>
            <div class="zone-schedule__status-row">
              <AppIcon name="check" size="sm" />
              <span class="zone-schedule__status-label">{{ $t('dashboard.schedule.lastScheduledCrawl') }}</span>
              <span class="zone-schedule__status-value">{{ lastLabel }}</span>
            </div>
          </div>
        </div>
      </AppCard>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CrawlSchedule, CrawlScheduleFrequency } from '~~/shared/types/zone'
import { formatLastCrawlLabel, formatNextCrawlLabel } from '~~/shared/utils/crawl-schedule'
defineI18nRoute(false)

definePageMeta({ layout: 'default' })
useSeoMeta({ robots: 'noindex, nofollow' })

const route = useRoute()
const toast = useToast()
const { t, locale } = useI18n()
const apiError = useApiError()
const siteId = computed(() => route.params.id as string)
const zoneId = computed(() => route.params.zoneId as string)

const { zones, hasMinZoneRole } = useZones()
const canManage = computed(() => hasMinZoneRole(zoneId.value, 'admin'))
const zone = computed(() => zones.value.find(z => z._id === zoneId.value) ?? null)
const isDefaultZone = computed(() => zone.value?.isDefault ?? false)
const zoneName = computed(() => isDefaultZone.value ? t('dashboard.schedule.defaultZoneName') : (zone.value?.name ?? t('dashboard.schedule.zoneFallback')))

useHead({ title: computed(() => t('dashboard.schedule.tabTitle', { zone: zoneName.value })) })

interface ScheduleForm {
  enabled: boolean
  frequency: CrawlScheduleFrequency
  dayOfWeek: number | null
  dayOfMonth: number | null
  lastDayOfMonth: boolean
  hour: number
}

const form = ref<ScheduleForm>({
  enabled: false,
  frequency: 'weekly',
  dayOfWeek: 5,
  dayOfMonth: null,
  lastDayOfMonth: false,
  hour: 3,
})

const lastCrawledAt = ref<string | null>(null)
const nextCrawlAt = ref<string | null>(null)
const saving = ref(false)

const FREQUENCY_OPTIONS = computed<{ value: CrawlScheduleFrequency; label: string; description: string }[]>(() => [
  { value: 'daily', label: t('dashboard.schedule.freqDailyLabel'), description: t('dashboard.schedule.freqDailyDesc') },
  { value: 'weekly', label: t('dashboard.schedule.freqWeeklyLabel'), description: t('dashboard.schedule.freqWeeklyDesc') },
  { value: 'biweekly', label: t('dashboard.schedule.freqBiweeklyLabel'), description: t('dashboard.schedule.freqBiweeklyDesc') },
  { value: 'monthly', label: t('dashboard.schedule.freqMonthlyLabel'), description: t('dashboard.schedule.freqMonthlyDesc') },
])

const DAY_OF_WEEK_OPTIONS = computed(() => [
  { value: 1, label: t('dashboard.schedule.dayMonday') },
  { value: 2, label: t('dashboard.schedule.dayTuesday') },
  { value: 3, label: t('dashboard.schedule.dayWednesday') },
  { value: 4, label: t('dashboard.schedule.dayThursday') },
  { value: 5, label: t('dashboard.schedule.dayFriday') },
  { value: 6, label: t('dashboard.schedule.daySaturday') },
  { value: 0, label: t('dashboard.schedule.daySunday') },
])

const nextLabel = computed(() => form.value.enabled ? formatNextCrawlLabel(nextCrawlAt.value, locale.value) : t('dashboard.schedule.disabled'))
const lastLabel = computed(() => formatLastCrawlLabel(lastCrawledAt.value, undefined, locale.value))

function applySchedule(schedule: CrawlSchedule | null) {
  if (!schedule) {
    lastCrawledAt.value = null
    nextCrawlAt.value = null
    return
  }
  form.value = {
    enabled: schedule.enabled,
    frequency: schedule.frequency,
    dayOfWeek: schedule.dayOfWeek,
    dayOfMonth: schedule.dayOfMonth,
    lastDayOfMonth: schedule.lastDayOfMonth,
    hour: schedule.hour,
  }
  lastCrawledAt.value = schedule.lastCrawledAt
  nextCrawlAt.value = schedule.nextCrawlAt
}

async function loadSchedule() {
  try {
    const data = await $fetch<{ schedule: CrawlSchedule | null }>(
      `/api/sites/${siteId.value}/zones/${zoneId.value}/schedule`,
    )
    applySchedule(data.schedule)
  }
  catch {
    /* permission denied: canManage guard already hides UI */
  }
}

async function persist() {
  if (saving.value) return
  saving.value = true
  try {
    const payload = {
      enabled: form.value.enabled,
      frequency: form.value.frequency,
      dayOfWeek: form.value.frequency === 'weekly' || form.value.frequency === 'biweekly' ? form.value.dayOfWeek : null,
      dayOfMonth: form.value.frequency === 'monthly' && !form.value.lastDayOfMonth ? form.value.dayOfMonth : null,
      lastDayOfMonth: form.value.frequency === 'monthly' ? form.value.lastDayOfMonth : false,
      hour: form.value.hour,
    }
    const data = await $fetch<{ schedule: CrawlSchedule }>(
      `/api/sites/${siteId.value}/zones/${zoneId.value}/schedule`,
      { method: 'PUT', body: payload },
    )
    applySchedule(data.schedule)
    toast.success(t('dashboard.schedule.saveSuccess'))
  }
  catch (error) {
    const fetchError = error as { data?: { message?: string } }
    toast.error(apiError(fetchError, t('dashboard.schedule.saveError')))
  }
  finally {
    saving.value = false
  }
}

function onToggleEnabled(enabled: boolean) {
  form.value.enabled = enabled
  persist()
}

function setFrequency(value: CrawlScheduleFrequency) {
  form.value.frequency = value
  if (value === 'monthly') {
    if (form.value.dayOfMonth === null && !form.value.lastDayOfMonth) form.value.dayOfMonth = 1
  }
  if (value === 'weekly' || value === 'biweekly') {
    if (form.value.dayOfWeek === null) form.value.dayOfWeek = 1
  }
  persist()
}

function setDayOfWeek(value: number) {
  form.value.dayOfWeek = value
  persist()
}

function setDayOfMonth(rawValue: string) {
  if (rawValue === 'last') {
    form.value.lastDayOfMonth = true
    form.value.dayOfMonth = null
  }
  else {
    form.value.lastDayOfMonth = false
    form.value.dayOfMonth = Number(rawValue)
  }
  persist()
}

function setHour(value: number) {
  form.value.hour = value
  persist()
}

if (import.meta.client) {
  loadSchedule()
}
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.zone-schedule {
  &__denied {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: $spacing-3;
    min-height: 300px;
    color: $color-gray-500;
    font-size: $font-size-sm;
  }

  &__card {
    padding: $spacing-8;
  }

  &__section {
    transition: opacity $transition-fast;

    &:not(:last-child) {
      margin-bottom: $spacing-8;
      padding-bottom: $spacing-8;
      border-bottom: 1px solid $color-gray-200;
    }

    &--disabled {
      opacity: 0.5;
    }
  }

  &__section-title {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-800;
    margin-bottom: $spacing-3;
  }

  &__section-desc {
    font-size: $font-size-xs;
    color: $color-gray-500;
    margin-bottom: $spacing-4;
    line-height: $line-height-normal;
  }

  &__toggle {
    display: flex;
    align-items: center;
    gap: $spacing-3;
    cursor: pointer;
    font-size: $font-size-sm;
    color: $color-gray-700;

    input {
      width: 16px;
      height: 16px;
      cursor: pointer;
    }
  }

  &__options {
    display: flex;
    flex-direction: column;
    gap: $spacing-2;
  }

  &__option {
    display: flex;
    flex-direction: column;
    gap: $spacing-1;
    padding: $spacing-3 $spacing-4;
    background: none;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    cursor: pointer;
    text-align: left;
    transition: all $transition-fast;

    &:hover:not(:disabled) {
      border-color: $color-gray-300;
    }

    &:disabled {
      cursor: not-allowed;
    }

    &--active {
      border-color: $color-accent;
      background-color: rgba($color-accent, 0.04);
    }
  }

  &__option-label {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-800;
  }

  &__option-desc {
    font-size: $font-size-xs;
    color: $color-gray-500;
    line-height: $line-height-normal;
  }

  &__fields {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-4;
  }

  &__field-group {
    display: flex;
    flex-direction: column;
    gap: $spacing-1;
  }

  &__field-label {
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: $color-gray-600;
  }

  &__select {
    padding: $spacing-2 $spacing-3;
    font-size: $font-size-sm;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    background: $surface-card;
    color: $color-gray-800;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  &__hint {
    margin-top: $spacing-3;
    font-size: $font-size-xs;
    color: $color-gray-500;
  }

  &__status {
    display: flex;
    flex-direction: column;
    gap: $spacing-2;
  }

  &__status-row {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    font-size: $font-size-sm;
    color: $color-gray-600;
  }

  &__status-label {
    font-weight: $font-weight-medium;
    color: $color-gray-700;
  }

  &__status-value {
    color: $color-gray-600;
  }
}
</style>
