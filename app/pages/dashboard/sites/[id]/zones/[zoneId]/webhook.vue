<template>
  <div class="zone-webhook">
    <div v-if="!canManage" class="zone-webhook__denied" data-testid="zone-denied">
      <AppIcon name="shield-check" size="sm" />
      <span>{{ $t('dashboard.webhook.denied') }}</span>
    </div>

    <template v-else>
      <DashboardHeader :title="$t('dashboard.webhook.title', { zone: zoneName })" :subtitle="$t('dashboard.webhook.subtitle')" />

      <AppCard :bordered="false" class="zone-webhook__card">
        <!-- Crawl endpoint -->
        <div class="zone-webhook__section">
          <h3 class="zone-webhook__section-title">{{ $t('dashboard.webhook.triggerCrawl') }}</h3>
          <div class="zone-webhook__field">
            <code class="zone-webhook__code">POST {{ crawlEndpoint }}</code>
            <button class="zone-webhook__copy" @click="copy(crawlEndpoint, 'crawl')">
              {{ justCopied === 'crawl' ? $t('dashboard.webhook.copied') : $t('dashboard.webhook.copy') }}
            </button>
          </div>
        </div>

        <!-- Status endpoint -->
        <div class="zone-webhook__section">
          <h3 class="zone-webhook__section-title">{{ $t('dashboard.webhook.checkVerdict') }}</h3>
          <div class="zone-webhook__field">
            <code class="zone-webhook__code">GET {{ statusEndpoint }}</code>
            <button class="zone-webhook__copy" @click="copy(statusEndpoint, 'status')">
              {{ justCopied === 'status' ? $t('dashboard.webhook.copied') : $t('dashboard.webhook.copy') }}
            </button>
          </div>
        </div>

        <!-- API Key -->
        <div class="zone-webhook__section">
          <h3 class="zone-webhook__section-title">{{ $t('dashboard.webhook.apiKeyTitle') }}</h3>
          <div class="zone-webhook__field">
            <code class="zone-webhook__code zone-webhook__code--key">
              {{ keyVisible ? apiKey : maskedKey }}
            </code>
            <button class="zone-webhook__icon-btn" @click="keyVisible = !keyVisible">
              {{ keyVisible ? $t('dashboard.webhook.hide') : $t('dashboard.webhook.show') }}
            </button>
            <button class="zone-webhook__copy" @click="copy(apiKey, 'key')">
              {{ justCopied === 'key' ? $t('dashboard.webhook.copied') : $t('dashboard.webhook.copy') }}
            </button>
          </div>
          <button class="zone-webhook__regenerate" @click="showRegenModal = true">
            {{ $t('dashboard.webhook.regenerateKey') }}
          </button>
          <p class="zone-webhook__hint">
            {{ $t('dashboard.webhook.keyHint') }}
          </p>
        </div>

        <!-- How it works -->
        <div class="zone-webhook__section">
          <h3 class="zone-webhook__section-title">{{ $t('dashboard.webhook.howTitle') }}</h3>
          <ol class="zone-webhook__steps">
            <!-- eslint-disable vue/no-v-html -->
            <li v-html="$t('dashboard.webhook.step1')" />
            <li v-html="$t('dashboard.webhook.step2')" />
            <li v-html="$t('dashboard.webhook.step3')" />
            <!-- eslint-enable vue/no-v-html -->
          </ol>
        </div>

        <!-- Strictness level -->
        <div class="zone-webhook__section">
          <h3 class="zone-webhook__section-title">{{ $t('dashboard.webhook.strictnessTitle') }}</h3>
          <p class="zone-webhook__section-desc">{{ $t('dashboard.webhook.strictnessDesc') }}</p>

          <div class="zone-webhook__strictness">
            <button
              v-for="level in strictnessLevels"
              :key="level.value"
              class="zone-webhook__strictness-option"
              :class="{ 'zone-webhook__strictness-option--active': ciStrictness === level.value }"
              @click="updateStrictness(level.value)"
            >
              <span class="zone-webhook__strictness-label">{{ level.label }}</span>
              <span class="zone-webhook__strictness-rule">{{ level.rule }}</span>
              <span class="zone-webhook__strictness-desc">{{ level.description }}</span>
            </button>
          </div>
        </div>

        <!-- Patterns -->
        <div class="zone-webhook__section">
          <h3 class="zone-webhook__section-title">{{ $t('dashboard.webhook.patternsTitle') }}</h3>
          <div class="zone-webhook__patterns">
            <code v-for="pattern in patterns" :key="pattern" class="zone-webhook__pattern">
              {{ pattern }}
            </code>
          </div>
        </div>

        <!-- CI/CD Snippets -->
        <div class="zone-webhook__section">
          <h3 class="zone-webhook__section-title">{{ $t('dashboard.webhook.snippetsTitle') }}</h3>

          <div class="zone-webhook__tabs">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="zone-webhook__tab"
              :class="{ 'zone-webhook__tab--active': activeTab === tab.id }"
              @click="activeTab = tab.id"
            >
              {{ tab.label }}
            </button>
          </div>

          <div class="zone-webhook__snippet">
            <pre class="zone-webhook__pre"><code>{{ snippets[activeTab] }}</code></pre>
            <button class="zone-webhook__copy zone-webhook__copy--snippet" @click="copy(snippets[activeTab], 'snippet')">
              {{ justCopied === 'snippet' ? $t('dashboard.webhook.copied') : $t('dashboard.webhook.copy') }}
            </button>
          </div>
        </div>
      </AppCard>

      <!-- Regenerate confirmation modal -->
      <AppModal v-model="showRegenModal" :title="$t('dashboard.webhook.regenModalTitle')">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p class="zone-webhook__modal-text" v-html="$t('dashboard.webhook.regenModalText')" />
        <template #footer>
          <AppButton variant="secondary" :disabled="regenerating" @click="showRegenModal = false">
            {{ $t('dashboard.webhook.cancel') }}
          </AppButton>
          <AppButton variant="danger" :loading="regenerating" @click="handleRegenerate">
            {{ $t('dashboard.webhook.regenerate') }}
          </AppButton>
        </template>
      </AppModal>
    </template>
  </div>
</template>

<script setup lang="ts">
defineI18nRoute(false)
definePageMeta({ layout: 'default' })
useSeoMeta({ robots: 'noindex, nofollow' })

const route = useRoute()
const { t } = useI18n()
const siteId = computed(() => route.params.id as string)
const zoneId = computed(() => route.params.zoneId as string)
// Zone info from shared state
const { zones, hasMinZoneRole } = useZones()
const canManage = computed(() => hasMinZoneRole(zoneId.value, 'admin'))
const zone = computed(() => zones.value.find(z => z._id === zoneId.value) ?? null)
const isDefaultZone = computed(() => zone.value?.isDefault ?? false)
const zoneName = computed(() => isDefaultZone.value ? t('dashboard.webhook.defaultZoneName') : (zone.value?.name ?? t('dashboard.webhook.zoneFallback')))
const patterns = computed(() => zone.value?.patterns ?? ['**'])

useHead({ title: computed(() => t('dashboard.webhook.tabTitle', { zone: zoneName.value })) })

const config = useRuntimeConfig()
const appUrl = computed(() => config.public.appUrl || 'https://seogard.io')
const crawlEndpoint = computed(() => `${appUrl.value}/api/sites/${siteId.value}/zones/${zoneId.value}/crawl`)
const statusEndpoint = computed(() => `${appUrl.value}/api/sites/${siteId.value}/zones/${zoneId.value}/crawl-status`)

// API key
const apiKey = ref('')
const keyVisible = ref(false)
const showRegenModal = ref(false)
const regenerating = ref(false)
const justCopied = ref<string | null>(null)

// Strictness DE LA ZONE — override optimiste après clic (par zoneId : l'état survit à une
// navigation zone A → zone B sans afficher la strictness de la mauvaise zone), sinon la valeur de la zone.
const strictnessOverride = ref<Record<string, 'strict' | 'standard' | 'relaxed'>>({})
const ciStrictness = computed<'strict' | 'standard' | 'relaxed'>(
  () => strictnessOverride.value[zoneId.value]
    ?? (zone.value as { ciStrictness?: 'strict' | 'standard' | 'relaxed' } | null)?.ciStrictness
    ?? 'standard',
)
const activeTab = ref<'curl' | 'github' | 'vercel' | 'gitlab'>('curl')

const strictnessLevels = computed(() => [
  {
    value: 'strict' as const,
    label: t('dashboard.webhook.strictLabel'),
    rule: t('dashboard.webhook.strictRule'),
    description: t('dashboard.webhook.strictDescription'),
  },
  {
    value: 'standard' as const,
    label: t('dashboard.webhook.standardLabel'),
    rule: t('dashboard.webhook.standardRule'),
    description: t('dashboard.webhook.standardDescription'),
  },
  {
    value: 'relaxed' as const,
    label: t('dashboard.webhook.relaxedLabel'),
    rule: t('dashboard.webhook.relaxedRule'),
    description: t('dashboard.webhook.relaxedDescription'),
  },
])

const tabs = [
  { id: 'curl' as const, label: 'cURL / API' },
  { id: 'github' as const, label: 'GitHub Actions' },
  { id: 'vercel' as const, label: 'Vercel' },
  { id: 'gitlab' as const, label: 'GitLab CI' },
]

const snippets = computed(() => ({
  curl: `# 1. Trigger crawl
RESPONSE=$(curl -s -X POST ${crawlEndpoint.value} \\
  -H "x-api-key: YOUR_API_KEY")
CRAWL_ID=$(echo $RESPONSE | jq -r '.crawlId')

# 2. Poll until done (timeout 30 min)
for i in $(seq 1 60); do
  RESULT=$(curl -s "${statusEndpoint.value}?crawlId=$CRAWL_ID" \\
    -H "x-api-key: YOUR_API_KEY")
  STATUS=$(echo $RESULT | jq -r '.status')
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    break
  fi
  sleep 30
done

# 3. Check verdict — exit 1 blocks the pipeline
PASS=$(echo $RESULT | jq -r '.pass')
if [ "$PASS" = "false" ]; then
  echo "Seogard: critical SEO regressions detected!"
  echo $RESULT | jq .alerts
  exit 1
fi`,

  github: `# .github/workflows/deploy.yml
name: Deploy & Crawl
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # ... your deploy steps ...

      - name: Trigger Seogard crawl
        id: seogard
        run: |
          RESPONSE=$(curl -s -X POST ${crawlEndpoint.value} \\
            -H "x-api-key: \${{ secrets.SEOGARD_API_KEY }}")
          echo "crawl_id=$(echo $RESPONSE | jq -r '.crawlId')" >> $GITHUB_OUTPUT

      - name: Wait for Seogard results
        run: |
          for i in $(seq 1 60); do
            RESULT=$(curl -s "${statusEndpoint.value}?crawlId=\${{ steps.seogard.outputs.crawl_id }}" \\
              -H "x-api-key: \${{ secrets.SEOGARD_API_KEY }}")
            STATUS=$(echo $RESULT | jq -r '.status')
            if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
              break
            fi
            sleep 30
          done
          PASS=$(echo $RESULT | jq -r '.pass')
          if [ "$PASS" = "false" ]; then
            echo "::error::Seogard detected critical SEO regressions"
            echo $RESULT | jq .alerts
            exit 1
          fi`,

  vercel: `# .github/workflows/seogard.yml
# Vercel deploys automatically — this runs after push
name: Seogard post-deploy
on:
  push:
    branches: [main]

jobs:
  seo-check:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Seogard crawl
        id: seogard
        run: |
          # Wait 60s for Vercel deploy to finish
          sleep 60
          RESPONSE=$(curl -s -X POST ${crawlEndpoint.value} \\
            -H "x-api-key: \${{ secrets.SEOGARD_API_KEY }}")
          echo "crawl_id=$(echo $RESPONSE | jq -r '.crawlId')" >> $GITHUB_OUTPUT

      - name: Wait for Seogard results
        run: |
          for i in $(seq 1 60); do
            RESULT=$(curl -s "${statusEndpoint.value}?crawlId=\${{ steps.seogard.outputs.crawl_id }}" \\
              -H "x-api-key: \${{ secrets.SEOGARD_API_KEY }}")
            STATUS=$(echo $RESULT | jq -r '.status')
            if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
              break
            fi
            sleep 30
          done
          PASS=$(echo $RESULT | jq -r '.pass')
          if [ "$PASS" = "false" ]; then
            echo "::error::Seogard detected critical SEO regressions"
            echo $RESULT | jq .alerts
            exit 1
          fi`,

  gitlab: `# .gitlab-ci.yml
stages:
  - deploy
  - seo-check

seogard:
  stage: seo-check
  image: curlimages/curl:latest
  script:
    - |
      RESPONSE=$(curl -s -X POST ${crawlEndpoint.value} \\
        -H "x-api-key: $SEOGARD_API_KEY")
      CRAWL_ID=$(echo $RESPONSE | jq -r '.crawlId')

      for i in $(seq 1 60); do
        RESULT=$(curl -s "${statusEndpoint.value}?crawlId=$CRAWL_ID" \\
          -H "x-api-key: $SEOGARD_API_KEY")
        STATUS=$(echo $RESULT | jq -r '.status')
        if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
          break
        fi
        sleep 30
      done

      PASS=$(echo $RESULT | jq -r '.pass')
      if [ "$PASS" = "false" ]; then
        echo "Seogard: critical SEO regressions detected!"
        echo $RESULT | jq .alerts
        exit 1
      fi
  only:
    - main`,
}))

async function updateStrictness(value: 'strict' | 'standard' | 'relaxed') {
  const previous = strictnessOverride.value
  strictnessOverride.value = { ...previous, [zoneId.value]: value }
  try {
    await $fetch(`/api/sites/${siteId.value}/zones/${zoneId.value}`, {
      method: 'PATCH',
      body: { ciStrictness: value },
    })
  }
  catch {
    // Échec serveur → on annule l'affichage optimiste (sinon l'UI mentirait).
    strictnessOverride.value = previous
  }
}

async function handleRegenerate() {
  regenerating.value = true
  try {
    const result = await $fetch<{ apiKey: string }>(`/api/sites/${siteId.value}/api-key`, { method: 'POST' })
    apiKey.value = result.apiKey
    showRegenModal.value = false
    keyVisible.value = true
  }
  finally {
    regenerating.value = false
  }
}

function copy(text: string, id = 'endpoint') {
  if (import.meta.client) {
    navigator.clipboard.writeText(text)
    justCopied.value = id
    setTimeout(() => { justCopied.value = null }, 2000)
  }
}

// Fetch API key (la strictness vient de la zone via le store useZones).
async function init() {
  try {
    const keyData = await $fetch<{ apiKey: string }>(`/api/sites/${siteId.value}/api-key`)
    if (keyData) apiKey.value = keyData.apiKey
  } catch {
    /* permissions insuffisantes — la clé restera masquée */
  }
}

if (import.meta.client) {
  init()
}

const maskedKey = computed(() => {
  if (!apiKey.value) return '••••••••'
  return apiKey.value.slice(0, 8) + '••••••••••••••••••••'
})
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.zone-webhook {
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
    &:not(:last-child) {
      margin-bottom: $spacing-8;
      padding-bottom: $spacing-8;
      border-bottom: 1px solid $color-gray-200;
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
  }

  &__field {
    display: flex;
    align-items: center;
    gap: $spacing-2;
    background-color: $color-gray-100;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    padding: $spacing-2 $spacing-3;
  }

  &__code {
    flex: 1;
    font-family: $font-family-mono;
    font-size: $font-size-xs;
    color: $color-gray-700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &--key {
      letter-spacing: 0.02em;
    }
  }

  &__icon-btn {
    font-size: $font-size-xs;
    color: $color-gray-500;
    background: none;
    border: none;
    cursor: pointer;
    padding: $spacing-1 $spacing-2;
    border-radius: $radius-md;
    transition: color $transition-fast;
    white-space: nowrap;

    &:hover {
      color: $color-gray-800;
    }
  }

  &__copy {
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: $color-gray-500;
    background: none;
    border: 1px solid $color-gray-200;
    border-radius: $radius-md;
    padding: $spacing-1 $spacing-2;
    cursor: pointer;
    white-space: nowrap;
    transition: all $transition-fast;

    &:hover {
      color: $color-gray-800;
      border-color: $color-gray-300;
    }

    &--snippet {
      position: absolute;
      top: $spacing-2;
      right: $spacing-2;
    }
  }

  &__hint {
    margin-top: $spacing-2;
    font-size: $font-size-xs;
    color: $color-gray-500;
  }

  &__regenerate {
    margin-top: $spacing-3;
    font-size: $font-size-xs;
    color: $color-danger;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: opacity $transition-fast;

    &:hover {
      opacity: 0.8;
    }
  }

  &__steps {
    padding-left: $spacing-5;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: $spacing-2;
    font-size: $font-size-sm;
    color: $color-gray-600;

    code {
      font-family: $font-family-mono;
      font-size: $font-size-xs;
      background: $color-gray-100;
      padding: 1px $spacing-1;
      border-radius: $radius-sm;
      color: $color-gray-700;
    }

    strong {
      color: $color-gray-800;
    }
  }

  &__strictness {
    display: flex;
    flex-direction: column;
    gap: $spacing-2;
  }

  &__strictness-option {
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

    &:hover {
      border-color: $color-gray-300;
    }

    &--active {
      border-color: $color-accent;
      background-color: rgba($color-accent, 0.04);
    }
  }

  &__strictness-label {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-800;
  }

  &__strictness-rule {
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: $color-gray-600;
  }

  &__strictness-desc {
    font-size: $font-size-xs;
    color: $color-gray-500;
    line-height: $line-height-normal;
  }

  &__patterns {
    display: flex;
    flex-wrap: wrap;
    gap: $spacing-2;
  }

  &__pattern {
    font-family: $font-family-mono;
    font-size: $font-size-xs;
    color: $color-gray-700;
    background: $color-gray-100;
    padding: $spacing-1 $spacing-3;
    border-radius: $radius-md;
    border: 1px solid $color-gray-200;
  }

  &__tabs {
    display: flex;
    gap: $spacing-1;
    margin-bottom: $spacing-3;
  }

  &__tab {
    font-size: $font-size-xs;
    font-weight: $font-weight-medium;
    color: $color-gray-500;
    background: none;
    border: 1px solid transparent;
    border-radius: $radius-md;
    padding: $spacing-1 $spacing-3;
    cursor: pointer;
    transition: all $transition-fast;

    &:hover {
      color: $color-gray-700;
    }

    &--active {
      color: $color-gray-900;
      border-color: $color-gray-200;
      background-color: $color-gray-100;
    }
  }

  &__snippet {
    position: relative;
    background-color: $color-gray-100;
    border: 1px solid $color-gray-200;
    border-radius: $radius-lg;
    overflow: hidden;
  }

  &__pre {
    padding: $spacing-4;
    padding-right: $spacing-10;
    margin: 0;
    overflow-x: auto;
    font-family: $font-family-mono;
    font-size: $font-size-xs;
    line-height: $line-height-normal;
    color: $color-gray-700;
    white-space: pre;
  }

  &__modal-text {
    font-size: $font-size-sm;
    color: $color-gray-600;
    margin-bottom: $spacing-3;

    strong {
      color: $color-gray-800;
    }
  }
}
</style>
