<template>
  <div class="muted-rules">
    <h4 class="muted-rules__title">Règles désactivées</h4>
    <p class="muted-rules__desc">Ces règles ne génèrent plus d'alertes sur ce site. Réactivez-les pour surveiller à nouveau ces problèmes.</p>

    <div v-if="loading" class="muted-rules__loading">
      <AppSpinner size="sm" />
    </div>

    <div v-else-if="rules.length === 0" class="muted-rules__empty">
      Aucune règle désactivée
    </div>

    <div v-else class="muted-rules__list">
      <div v-for="rule in rules" :key="rule.ruleId" class="muted-rules__item">
        <div class="muted-rules__info">
          <span class="muted-rules__label">{{ getLabel(rule.ruleId) }}</span>
          <span class="muted-rules__date">Ignorée le {{ formatDate(rule.createdAt) }}</span>
        </div>
        <AppButton
          variant="secondary"
          size="sm"
          :loading="unmuting === rule.ruleId"
          @click="unmute(rule.ruleId)"
        >
          Réactiver
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface MutedRule {
  ruleId: string
  createdAt: string
}

interface Props {
  siteId: string
}

const props = defineProps<Props>()

const loading = ref(true)
const rules = ref<MutedRule[]>([])
const unmuting = ref<string | null>(null)

function getLabel(ruleId: string): string {
  return ALERT_TYPE_LABELS[ruleId] ?? ruleId
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function fetchRules() {
  loading.value = true
  try {
    const data = await $fetch<{ rules: MutedRule[] }>(`/api/sites/${props.siteId}/muted-rules`)
    rules.value = data.rules
  }
  finally {
    loading.value = false
  }
}

async function unmute(ruleId: string) {
  unmuting.value = ruleId
  try {
    await $fetch(`/api/sites/${props.siteId}/muted-rules/${ruleId}`, { method: 'DELETE' })
    rules.value = rules.value.filter(r => r.ruleId !== ruleId)
  }
  finally {
    unmuting.value = null
  }
}

onMounted(fetchRules)
</script>

<style scoped lang="scss">
@use '~/assets/styles/variables' as *;

.muted-rules {
  margin-top: $spacing-6;
  padding-top: $spacing-6;
  border-top: 1px solid $color-gray-200;

  &__title {
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-gray-800;
    margin: 0 0 $spacing-1;
  }

  &__desc {
    font-size: $font-size-xs;
    color: $color-gray-400;
    margin: 0 0 $spacing-4;
    line-height: $line-height-normal;
  }

  &__loading {
    padding: $spacing-4;
    display: flex;
    justify-content: center;
  }

  &__empty {
    font-size: $font-size-sm;
    color: $color-gray-400;
    padding: $spacing-3 0;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $spacing-2;
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $spacing-3;
    padding: $spacing-3 $spacing-4;
    background: $color-gray-50;
    border-radius: $radius-md;
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__label {
    font-size: $font-size-sm;
    font-weight: $font-weight-medium;
    color: $color-gray-700;
  }

  &__date {
    font-size: $font-size-xs;
    color: $color-gray-400;
  }
}
</style>
